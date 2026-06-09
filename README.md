# Flores Eternas — Backend

API REST para tienda de flores preservadas. Gestión de productos, clientes, pedidos y facturación electrónica integrada con el SRI (Servicio de Rentas Internas de Ecuador).

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Auth** | Registro y login con JWT. Roles: ADMIN, VENDEDOR, CLIENTE |
| **Productos** | CRUD con subida de imágenes. Catálogo público |
| **Clientes** | Gestión de clientes |
| **Pedidos** | Registro y seguimiento de órdenes |
| **Facturación SRI** | Emisión, firma digital, envío y autorización de facturas electrónicas |

---

## SRI

Integración completa con el SRI Ecuador: generación de XML, firma digital, envío vía SOAP y autorización. Soporta ambientes de prueba y producción.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js + Express |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Auth | JWT |
| Seguridad | Helmet, CORS, rate limiting, sanitización |
| Imágenes | Multer (upload) |

---

## Variables de entorno

```env
DATABASE_URL=postgresql://user:password@localhost:5432/flores_db
JWT_SECRET=your-jwt-secret
SRI_AMBIENTE=1   # 1=pruebas, 2=producción
```

---

## Correr localmente

```bash
git clone https://github.com/Mickaell22/Flores-Backend.git
cd Flores-Backend
npm install
npx prisma migrate dev
node index.js
```

---

## Frontend

Consumido por [Flores-Frontend](https://github.com/Mickaell22/Flores-Frontend) — React + Tailwind.
