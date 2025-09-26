const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdminOrVendedor } = require('../middleware/auth');
const sriService = require('../services/sri-service');

const router = express.Router();

// POST /api/sri/invoice - Generar factura desde orden
router.post('/invoice', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    // Crear factura
    const invoice = await sriService.crearFactura(orderId);

    res.status(201).json({
      message: 'Factura creada correctamente',
      invoice
    });
  } catch (error) {
    console.error('Error generando factura:', error);
    res.status(500).json({
      error: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/sri/invoice/:id/sign - Firmar factura
router.post('/invoice/:id/sign', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const invoice = await sriService.firmarXML(req.params.id);

    res.json({
      message: 'Factura firmada correctamente',
      invoice
    });
  } catch (error) {
    console.error('Error firmando factura:', error);
    res.status(500).json({
      error: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/sri/invoice/:id/send - Enviar factura al SRI
router.post('/invoice/:id/send', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const result = await sriService.enviarFactura(req.params.id);

    res.json({
      message: 'Factura enviada al SRI',
      result
    });
  } catch (error) {
    console.error('Error enviando factura:', error);
    res.status(500).json({
      error: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/sri/invoice/:id/authorize - Consultar autorización
router.post('/invoice/:id/authorize', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const invoice = await sriService.consultarAutorizacion(req.params.id);

    res.json({
      message: 'Autorización consultada',
      invoice
    });
  } catch (error) {
    console.error('Error consultando autorización:', error);
    res.status(500).json({
      error: error.message || 'Error interno del servidor'
    });
  }
});

// POST /api/sri/invoice/:id/complete - Proceso completo de facturación
router.post('/invoice/:id/complete', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const { orderId } = req.body;

    // 1. Crear factura
    const invoice = await sriService.crearFactura(orderId);

    // 2. Firmar XML
    await sriService.firmarXML(invoice.id);

    // 3. Enviar al SRI
    await sriService.enviarFactura(invoice.id);

    // 4. Esperar un momento y consultar autorización
    setTimeout(async () => {
      try {
        await sriService.consultarAutorizacion(invoice.id);
      } catch (error) {
        console.error('Error en autorización automática:', error);
      }
    }, 5000);

    res.json({
      message: 'Proceso de facturación iniciado',
      invoiceId: invoice.id
    });
  } catch (error) {
    console.error('Error en proceso completo:', error);
    res.status(500).json({
      error: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/sri/invoice/:id/xml - Descargar XML original
router.get('/invoice/:id/xml', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id }
    });

    if (!invoice || !invoice.xmlContent) {
      return res.status(404).json({ error: 'XML no encontrado' });
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="factura_${invoice.claveAcceso}.xml"`);
    res.send(invoice.xmlContent);
  } catch (error) {
    console.error('Error descargando XML:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/sri/invoice/:id/xml-signed - Descargar XML firmado
router.get('/invoice/:id/xml-signed', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id }
    });

    if (!invoice || !invoice.xmlSigned) {
      return res.status(404).json({ error: 'XML firmado no encontrado' });
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="factura_firmada_${invoice.claveAcceso}.xml"`);
    res.send(invoice.xmlSigned);
  } catch (error) {
    console.error('Error descargando XML firmado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/sri/invoice/:id/xml-authorized - Descargar XML autorizado
router.get('/invoice/:id/xml-authorized', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id }
    });

    if (!invoice || !invoice.xmlAuthorized) {
      return res.status(404).json({ error: 'XML autorizado no encontrado' });
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="factura_autorizada_${invoice.claveAcceso}.xml"`);
    res.send(invoice.xmlAuthorized);
  } catch (error) {
    console.error('Error descargando XML autorizado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/sri/invoices - Listar facturas
router.get('/invoices', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const { page = 1, limit = 20, estado, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      ...(estado && { estado }),
      ...(startDate || endDate) && {
        fechaEmision: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      }
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            include: {
              customer: true,
              user: { include: { profile: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error listando facturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/sri/invoice/:id - Obtener factura por ID
router.get('/invoice/:id', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            customer: true,
            user: { include: { profile: true } },
            items: { include: { product: true } }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/sri/test-connection - Probar conexión con SRI
router.post('/test-connection', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const result = await sriService.probarConexion();
    res.json(result);
  } catch (error) {
    console.error('Error probando conexión:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// GET /api/sri/config - Obtener configuración SRI actual
router.get('/config', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const config = await prisma.sriConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!config) {
      return res.status(404).json({ error: 'No hay configuración SRI activa' });
    }

    // No enviar datos sensibles
    const { certificadoClave, ...safeConfig } = config;

    res.json({ config: safeConfig });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/sri/config - Crear/actualizar configuración SRI
router.post('/config', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const {
      ruc,
      razonSocial,
      nombreComercial,
      ambiente,
      certificadoPath,
      certificadoClave,
      dirMatriz
    } = req.body;

    // Desactivar configuración anterior
    await prisma.sriConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Crear nueva configuración
    const config = await prisma.sriConfiguration.create({
      data: {
        ruc,
        razonSocial,
        nombreComercial,
        ambiente,
        certificadoPath,
        certificadoClave,
        dirMatriz,
        isActive: true
      }
    });

    // No devolver datos sensibles
    const { certificadoClave: _, ...safeConfig } = config;

    res.status(201).json({
      message: 'Configuración SRI guardada',
      config: safeConfig
    });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;