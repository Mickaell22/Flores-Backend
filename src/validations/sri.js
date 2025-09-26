const { z } = require('zod');

const createInvoiceSchema = z.object({
  orderId: z.string().min(1, 'ID de orden es requerido')
});

const completeInvoiceSchema = z.object({
  orderId: z.string().min(1, 'ID de orden es requerido')
});

const sriConfigSchema = z.object({
  ruc: z.string().min(13, 'RUC debe tener al menos 13 dígitos').max(13, 'RUC debe tener máximo 13 dígitos'),
  razonSocial: z.string().min(1, 'Razón social es requerida'),
  nombreComercial: z.string().optional(),
  ambiente: z.enum(['1', '2'], {
    errorMap: () => ({ message: 'Ambiente debe ser 1 (pruebas) o 2 (producción)' })
  }),
  certificadoPath: z.string().min(1, 'Ruta del certificado es requerida'),
  certificadoClave: z.string().min(1, 'Clave del certificado es requerida'),
  dirMatriz: z.string().min(1, 'Dirección matriz es requerida')
});

const queryInvoicesSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  estado: z.enum(['PENDIENTE', 'ENVIADO', 'AUTORIZADO', 'NO_AUTORIZADO', 'ERROR']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

module.exports = {
  createInvoiceSchema,
  completeInvoiceSchema,
  sriConfigSchema,
  queryInvoicesSchema
};