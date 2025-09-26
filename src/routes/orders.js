const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdminOrVendedor } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders - Listar órdenes según rol
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, customerId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let where = {};

    // Filtrar por rol
    if (req.user.role === 'CLIENTE') {
      where.userId = req.user.id;
    }

    // Aplicar filtros adicionales
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) })
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          user: {
            include: { profile: true }
          },
          items: {
            include: {
              product: {
                include: { images: true }
              }
            }
          },
          invoice: true
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/orders/:id - Obtener orden por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        user: {
          include: { profile: true }
        },
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        },
        invoice: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Verificar permisos
    if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta orden' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/orders - Crear orden
router.post('/', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const {
      customerId,
      items,
      paymentMethod,
      shippingAddress,
      notes,
      whatsappMessage
    } = req.body;

    // Validar que el customer existe
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Validar productos y calcular totales
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({
          error: `Producto ${item.productId} no encontrado`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
        });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    // Calcular IVA (15% por defecto)
    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    // Crear orden en transacción
    const order = await prisma.$transaction(async (tx) => {
      // Crear la orden
      const newOrder = await tx.order.create({
        data: {
          customerId,
          userId: req.user.id,
          subtotal,
          iva,
          total,
          paymentMethod,
          shippingAddress,
          notes,
          whatsappMessage,
          items: {
            create: orderItems
          }
        },
        include: {
          customer: true,
          user: {
            include: { profile: true }
          },
          items: {
            include: {
              product: {
                include: { images: true }
              }
            }
          }
        }
      });

      // Actualizar stock de productos
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      return newOrder;
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/orders/:id/status - Actualizar estado de orden
router.put('/:id/status', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(notes && { notes })
      },
      include: {
        customer: true,
        user: {
          include: { profile: true }
        },
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    res.json({ order });
  } catch (error) {
    console.error('Update order status error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/orders/:id - Actualizar orden completa
router.put('/:id', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const {
      paymentMethod,
      shippingAddress,
      notes,
      whatsappMessage,
      whatsappSent
    } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        ...(paymentMethod && { paymentMethod }),
        ...(shippingAddress && { shippingAddress }),
        ...(notes && { notes }),
        ...(whatsappMessage && { whatsappMessage }),
        ...(whatsappSent !== undefined && { whatsappSent })
      },
      include: {
        customer: true,
        user: {
          include: { profile: true }
        },
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    res.json({ order });
  } catch (error) {
    console.error('Update order error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/orders/:id - Cancelar orden
router.delete('/:id', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, invoice: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.invoice) {
      return res.status(400).json({
        error: 'No se puede cancelar una orden que ya tiene factura'
      });
    }

    // Restaurar stock y marcar como cancelada
    await prisma.$transaction(async (tx) => {
      // Restaurar stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      // Actualizar estado
      await tx.order.update({
        where: { id: req.params.id },
        data: { status: 'CANCELADO' }
      });
    });

    res.json({ message: 'Orden cancelada correctamente' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/orders/:id/invoice - Obtener factura de la orden
router.get('/:id/invoice', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        invoice: true,
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (!order.invoice) {
      return res.status(404).json({ error: 'La orden no tiene factura asociada' });
    }

    res.json({ invoice: order.invoice });
  } catch (error) {
    console.error('Get order invoice error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;