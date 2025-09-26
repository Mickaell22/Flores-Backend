# API Documentation - Flores Eternas Backend

Sistema de venta de flores eternas con facturación electrónica SRI Ecuador.

## Base URL
```
http://localhost:5000/api
```

## Autenticación
Todas las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 🔐 Autenticación

#### POST /auth/register
Registrar nuevo usuario.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "password123",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "role": "CLIENTE" // ADMIN, VENDEDOR, CLIENTE
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "usuario@email.com",
    "role": "CLIENTE",
    "profile": {
      "firstName": "Nombre",
      "lastName": "Apellido"
    }
  },
  "token": "jwt_token"
}
```

#### POST /auth/login
Iniciar sesión.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "password123"
}
```

#### GET /auth/me
Obtener usuario actual (requiere autenticación).

#### POST /auth/refresh
Renovar token JWT (requiere autenticación).

---

### 🏷️ Productos

#### GET /products
Listar productos (público).

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Productos por página (default: 12)
- `category`: ID de categoría
- `search`: Búsqueda por nombre/descripción
- `isActive`: true/false (default: true)

#### GET /products/:id
Obtener producto por ID (público).

#### POST /products
Crear producto (ADMIN only).

**Body:**
```json
{
  "name": "Rosa Eterna Roja",
  "description": "Hermosa rosa preservada",
  "price": 25.99,
  "stock": 100,
  "sku": "ROSE001",
  "categoryId": "category_id",
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "altText": "Rosa roja"
    }
  ]
}
```

#### PUT /products/:id
Actualizar producto (ADMIN/VENDEDOR).
- VENDEDOR: solo puede actualizar stock
- ADMIN: puede actualizar todo

#### DELETE /products/:id
Eliminar producto (ADMIN only) - soft delete.

---

### 👥 Clientes

#### GET /customers
Listar clientes (ADMIN/VENDEDOR).

**Query Parameters:**
- `page`, `limit`: Paginación
- `search`: Búsqueda por identificación, razón social, email
- `tipoIdentificacion`: RUC, CEDULA, PASAPORTE, etc.

#### GET /customers/:id
Obtener cliente con historial de órdenes.

#### POST /customers
Crear cliente.

**Body:**
```json
{
  "tipoIdentificacion": "CEDULA",
  "identificacion": "1234567890",
  "razonSocial": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "+593999999999",
  "direccion": "Av. Principal 123"
}
```

#### PUT /customers/:id
Actualizar cliente.

#### DELETE /customers/:id
Eliminar cliente (solo si no tiene órdenes).

---

### 📦 Órdenes

#### GET /orders
Listar órdenes según rol:
- ADMIN/VENDEDOR: todas las órdenes
- CLIENTE: solo sus órdenes

**Query Parameters:**
- `page`, `limit`: Paginación
- `status`: PENDIENTE, CONFIRMADO, EN_PROCESO, ENVIADO, ENTREGADO, CANCELADO
- `customerId`: Filtrar por cliente
- `startDate`, `endDate`: Rango de fechas

#### GET /orders/:id
Obtener orden por ID.

#### POST /orders
Crear orden (ADMIN/VENDEDOR).

**Body:**
```json
{
  "customerId": "customer_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "paymentMethod": "efectivo",
  "shippingAddress": "Dirección de envío",
  "notes": "Notas adicionales"
}
```

#### PUT /orders/:id/status
Actualizar estado de orden.

**Body:**
```json
{
  "status": "CONFIRMADO",
  "notes": "Orden confirmada"
}
```

#### PUT /orders/:id
Actualizar orden completa.

#### DELETE /orders/:id
Cancelar orden (restaura stock).

#### GET /orders/:id/invoice
Obtener factura de la orden.

---

### 🧾 Facturación SRI

#### POST /sri/invoice
Generar factura desde orden.

**Body:**
```json
{
  "orderId": "order_id"
}
```

#### POST /sri/invoice/:id/sign
Firmar factura electrónicamente.

#### POST /sri/invoice/:id/send
Enviar factura al SRI.

#### POST /sri/invoice/:id/authorize
Consultar autorización en SRI.

#### POST /sri/invoice/:id/complete
Proceso completo de facturación (crear → firmar → enviar → autorizar).

#### GET /sri/invoices
Listar facturas.

**Query Parameters:**
- `page`, `limit`: Paginación
- `estado`: PENDIENTE, ENVIADO, AUTORIZADO, NO_AUTORIZADO, ERROR
- `startDate`, `endDate`: Rango de fechas

#### GET /sri/invoice/:id
Obtener factura por ID.

#### GET /sri/invoice/:id/xml
Descargar XML original.

#### GET /sri/invoice/:id/xml-signed
Descargar XML firmado.

#### GET /sri/invoice/:id/xml-authorized
Descargar XML autorizado por SRI.

#### POST /sri/test-connection
Probar conexión con SRI.

#### GET /sri/config
Obtener configuración SRI actual.

#### POST /sri/config
Crear/actualizar configuración SRI.

**Body:**
```json
{
  "ruc": "1790012340001",
  "razonSocial": "FLORES ETERNAS CIA LTDA",
  "nombreComercial": "Flores Eternas",
  "ambiente": "1",
  "certificadoPath": "./certs/cert.p12",
  "certificadoClave": "clave_cert",
  "dirMatriz": "Av. Principal 123"
}
```

---

### 👤 Usuarios

#### GET /users
Listar usuarios (ADMIN only).

#### GET /users/:id
Obtener usuario por ID (ADMIN only).

#### POST /users
Crear usuario (ADMIN only).

#### PUT /users/:id
Actualizar usuario (ADMIN only).

#### PUT /users/:id/status
Activar/desactivar usuario (ADMIN only).

#### PUT /users/profile
Actualizar propio perfil.

#### PUT /users/change-password
Cambiar propia contraseña.

#### DELETE /users/:id
Eliminar usuario (ADMIN only).

---

## Códigos de Estado

- `200`: OK
- `201`: Created
- `400`: Bad Request (datos inválidos)
- `401`: Unauthorized (no autenticado)
- `403`: Forbidden (sin permisos)
- `404`: Not Found
- `500`: Internal Server Error

## Estructura de Errores

```json
{
  "error": "Mensaje de error",
  "details": [
    {
      "field": "campo_invalido",
      "message": "Descripción del error"
    }
  ]
}
```

## Roles y Permisos

### ADMIN
- Acceso completo a todas las funcionalidades
- CRUD de productos, usuarios, clientes
- Gestión de órdenes y facturación
- Configuración SRI

### VENDEDOR
- CRUD de clientes
- Crear y gestionar órdenes
- Actualizar stock de productos
- Generar facturas
- Ver productos

### CLIENTE
- Ver productos públicos
- Ver sus propias órdenes

## Validaciones

Todos los endpoints utilizan validación Zod:
- Campos requeridos
- Tipos de datos correctos
- Formatos válidos (email, etc.)
- Rangos numéricos

## Testing

Ejecutar pruebas:
```bash
npm test
npm run test:watch
npm run test:coverage
```

## Configuración de Entorno

Variables requeridas en `.env`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db_name"
JWT_SECRET="tu_jwt_secret"
JWT_EXPIRE="7d"
SRI_AMBIENTE="1"
SRI_RUC="1790012340001"
# ... otras configuraciones
```

## Flujo de Facturación SRI

1. **Crear Orden** → Cliente/Vendedor crea orden
2. **Generar Factura** → `POST /sri/invoice`
3. **Firmar XML** → `POST /sri/invoice/:id/sign`
4. **Enviar a SRI** → `POST /sri/invoice/:id/send`
5. **Consultar Autorización** → `POST /sri/invoice/:id/authorize`
6. **Descargar XML Autorizado** → `GET /sri/invoice/:id/xml-authorized`

O usar el endpoint completo:
```
POST /sri/invoice/:id/complete
```

## Ejemplos de Uso

### Crear Orden y Facturar

```javascript
// 1. Crear orden
const order = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customerId: 'customer_id',
    items: [{ productId: 'product_id', quantity: 1 }],
    paymentMethod: 'efectivo'
  })
});

// 2. Generar factura
const invoice = await fetch('/api/sri/invoice', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: order.id
  })
});

// 3. Proceso completo de facturación
const result = await fetch(`/api/sri/invoice/${invoice.id}/complete`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```