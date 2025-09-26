const express = require('express');
const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdmin, requireAdminOrVendedor } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// GET /api/products - Listar productos (público)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      isActive: isActive !== undefined ? isActive === 'true' : true,
      ...(category && { categoryId: category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: true
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/products/categories - Obtener todas las categorías (público)
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/products/:id - Obtener producto por ID (público)
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        images: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/products - Crear producto (ADMIN only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, sku, categoryId, images = [] } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        sku,
        categoryId,
        images: {
          create: images.map((img, index) => ({
            url: img.url,
            altText: img.altText || name,
            isMain: index === 0
          }))
        }
      },
      include: {
        category: true,
        images: true
      }
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El SKU ya existe' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/products/:id - Actualizar producto (ADMIN/VENDEDOR)
router.put('/:id', authenticateToken, requireAdminOrVendedor, async (req, res) => {
  try {
    const { name, description, price, stock, sku, categoryId, images } = req.body;

    // Si es vendedor, solo puede actualizar stock
    if (req.user.role === 'VENDEDOR') {
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: { stock },
        include: {
          category: true,
          images: true
        }
      });
      return res.json({ product });
    }

    // Admin puede actualizar todo
    const updateData = {
      ...(name && { name }),
      ...(description && { description }),
      ...(price && { price }),
      ...(stock !== undefined && { stock }),
      ...(sku && { sku }),
      ...(categoryId && { categoryId })
    };

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        category: true,
        images: true
      }
    });

    res.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/products/:id - Eliminar producto (ADMIN only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/products/:id/upload - Subir imagen del producto (ADMIN)
router.post('/:id/upload', authenticateToken, requireAdmin, (req, res) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, () => {});
    }

    try {
      const productId = req.params.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No se ha enviado ningún archivo'
        });
      }

      // Verificar que el producto existe
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true }
      });

      if (!product) {
        // Eliminar archivo subido si el producto no existe
        fs.unlinkSync(file.path);
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Crear URL relativa para la imagen
      const imageUrl = `/uploads/products/${file.filename}`;

      // Determinar si es la imagen principal
      const isMain = product.images.length === 0;

      // Guardar información de la imagen en la base de datos
      const productImage = await prisma.productImage.create({
        data: {
          productId: productId,
          url: imageUrl,
          altText: req.body.altText || `${product.name} - imagen`,
          isMain: isMain
        }
      });

      res.json({
        success: true,
        message: 'Imagen subida correctamente',
        image: productImage,
        file: {
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          url: imageUrl
        }
      });

    } catch (error) {
      console.error('Upload image error:', error);

      // Eliminar archivo si hubo error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });
});

// POST /api/products/:id/upload-multiple - Subir múltiples imágenes (ADMIN)
router.post('/:id/upload-multiple', authenticateToken, requireAdmin, (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res, () => {});
    }

    try {
      const productId = req.params.id;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se han enviado archivos'
        });
      }

      // Verificar que el producto existe
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { images: true }
      });

      if (!product) {
        // Eliminar archivos subidos si el producto no existe
        files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        });
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Crear registros de imágenes en la base de datos
      const imagePromises = files.map((file, index) => {
        const imageUrl = `/uploads/products/${file.filename}`;
        const isMain = product.images.length === 0 && index === 0;

        return prisma.productImage.create({
          data: {
            productId: productId,
            url: imageUrl,
            altText: `${product.name} - imagen ${index + 1}`,
            isMain: isMain
          }
        });
      });

      const productImages = await Promise.all(imagePromises);

      res.json({
        success: true,
        message: `${files.length} imágenes subidas correctamente`,
        images: productImages,
        files: files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          url: `/uploads/products/${file.filename}`
        }))
      });

    } catch (error) {
      console.error('Upload multiple images error:', error);

      // Eliminar archivos si hubo error
      if (req.files) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  });
});

// DELETE /api/products/:id/images/:imageId - Eliminar imagen del producto (ADMIN)
router.delete('/:id/images/:imageId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id: productId, imageId } = req.params;

    // Buscar la imagen
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId: productId
      }
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../uploads/products', path.basename(image.url));
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
    }

    // Eliminar registro de la base de datos
    await prisma.productImage.delete({
      where: { id: imageId }
    });

    res.json({
      success: true,
      message: 'Imagen eliminada correctamente'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;