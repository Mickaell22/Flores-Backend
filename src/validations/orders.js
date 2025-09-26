const { z } = require('zod');

const orderItemSchema = z.object({
  productId: z.string().min(1, 'ID del producto es requerido'),
  quantity: z.number().int().positive('Cantidad debe ser positiva')
});

const createOrderSchema = z.object({
  customerId: z.string().min(1, 'ID del cliente es requerido'),
  items: z.array(orderItemSchema).min(1, 'Debe incluir al menos un producto'),
  paymentMethod: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  whatsappMessage: z.string().optional()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']),
  notes: z.string().optional()
});

const updateOrderSchema = z.object({
  paymentMethod: z.string().optional(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  whatsappMessage: z.string().optional(),
  whatsappSent: z.boolean().optional()
});

const queryOrdersSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  status: z.enum(['PENDIENTE', 'CONFIRMADO', 'EN_PROCESO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  updateOrderSchema,
  queryOrdersSchema
};