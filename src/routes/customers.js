const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdminOrVendedor } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers - Listar clientes (ADMIN/VENDEDOR)
router.get('/', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, tipoIdentificacion } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { identificacion: { contains: search, mode: 'insensitive' } },
          { razonSocial: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(tipoIdentificacion && { tipoIdentificacion })
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/customers/:id - Obtener cliente por ID
router.get('/:id', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/customers - Crear cliente
router.post('/', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const {
      tipoIdentificacion,
      identificacion,
      razonSocial,
      email,
      telefono,
      direccion
    } = req.body;

    // Verificar si ya existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { identificacion }
    });

    if (existingCustomer) {
      return res.status(400).json({ error: 'Ya existe un cliente con esta identificación' });
    }

    const customer = await prisma.customer.create({
      data: {
        tipoIdentificacion,
        identificacion,
        razonSocial,
        email,
        telefono,
        direccion
      }
    });

    res.status(201).json({ customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/customers/:id - Actualizar cliente
router.put('/:id', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const {
      tipoIdentificacion,
      identificacion,
      razonSocial,
      email,
      telefono,
      direccion
    } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        tipoIdentificacion,
        identificacion,
        razonSocial,
        email,
        telefono,
        direccion
      }
    });

    res.json({ customer });
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un cliente con esta identificación' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/customers/:id - Eliminar cliente
router.delete('/:id', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    // Verificar si tiene órdenes
    const ordersCount = await prisma.order.count({
      where: { customerId: req.params.id }
    });

    if (ordersCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el cliente porque tiene órdenes asociadas'
      });
    }

    await prisma.customer.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;