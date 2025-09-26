const { z } = require('zod');

const createCustomerSchema = z.object({
  tipoIdentificacion: z.enum(['RUC', 'CEDULA', 'PASAPORTE', 'CONSUMIDOR_FINAL', 'EXTERIOR']),
  identificacion: z.string().min(1, 'Identificación es requerida'),
  razonSocial: z.string().min(1, 'Razón social es requerida'),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional()
});

const updateCustomerSchema = createCustomerSchema.partial();

const queryCustomersSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  tipoIdentificacion: z.enum(['RUC', 'CEDULA', 'PASAPORTE', 'CONSUMIDOR_FINAL', 'EXTERIOR']).optional()
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  queryCustomersSchema
};