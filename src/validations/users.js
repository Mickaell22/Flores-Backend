const { z } = require('zod');

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'VENDEDOR', 'CLIENTE']),
  firstName: z.string().min(1, 'Nombre es requerido'),
  lastName: z.string().min(1, 'Apellido es requerido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional()
});

const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'VENDEDOR', 'CLIENTE']).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().min(1, 'Nombre es requerido').optional(),
  lastName: z.string().min(1, 'Apellido es requerido').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional()
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Nombre es requerido'),
  lastName: z.string().min(1, 'Apellido es requerido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password actual es requerida'),
  newPassword: z.string().min(6, 'Nueva password debe tener al menos 6 caracteres')
});

const queryUsersSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  role: z.enum(['ADMIN', 'VENDEDOR', 'CLIENTE']).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional()
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateProfileSchema,
  changePasswordSchema,
  queryUsersSchema
};