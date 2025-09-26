const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  price: z.number().positive('Precio debe ser positivo'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  sku: z.string().min(1, 'SKU es requerido'),
  categoryId: z.string().min(1, 'Categoría es requerida'),
  images: z.array(z.object({
    url: z.string().url('URL de imagen inválida'),
    altText: z.string().optional()
  })).optional().default([])
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').optional(),
  description: z.string().min(1, 'Descripción es requerida').optional(),
  price: z.number().positive('Precio debe ser positivo').optional(),
  stock: z.number().int().min(0, 'Stock no puede ser negativo').optional(),
  sku: z.string().min(1, 'SKU es requerido').optional(),
  categoryId: z.string().min(1, 'Categoría es requerida').optional(),
  images: z.array(z.object({
    url: z.string().url('URL de imagen inválida'),
    altText: z.string().optional()
  })).optional()
});

const queryProductsSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional()
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema
};