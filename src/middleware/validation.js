const { z } = require('zod');

/**
 * Middleware para validar datos usando esquemas Zod
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      let dataToValidate;

      switch (source) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: errors
        });
      }

      // Reemplazar los datos originales con los validados y transformados
      switch (source) {
        case 'body':
          req.body = result.data;
          break;
        case 'query':
          req.query = result.data;
          break;
        case 'params':
          req.params = result.data;
          break;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

/**
 * Validar parámetro ID
 */
const validateId = validate(z.object({
  id: z.string().min(1, 'ID es requerido')
}), 'params');

/**
 * Validar paginación
 */
const validatePagination = validate(z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional()
}).partial(), 'query');

module.exports = {
  validate,
  validateId,
  validatePagination
};