const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Limpiar datos existentes (para desarrollo)
  if (process.env.NODE_ENV === 'development') {
    await prisma.auditLog.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.sriConfiguration.deleteMany();
  }

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@floreseternas.com',
      password: adminPassword,
      role: 'ADMIN',
      profile: {
        create: {
          firstName: 'Administrador',
          lastName: 'Sistema',
          phone: '+593999999999',
          address: 'Av. Principal 123',
          city: 'Quito',
          province: 'Pichincha'
        }
      }
    }
  });

  // Crear usuario vendedor
  const vendedorPassword = await bcrypt.hash('vendedor123', 12);
  const vendedor = await prisma.user.create({
    data: {
      email: 'vendedor@floreseternas.com',
      password: vendedorPassword,
      role: 'VENDEDOR',
      profile: {
        create: {
          firstName: 'María',
          lastName: 'García',
          phone: '+593987654321',
          address: 'Calle Secundaria 456',
          city: 'Guayaquil',
          province: 'Guayas'
        }
      }
    }
  });

  // Crear usuario cliente de prueba
  const clientePassword = await bcrypt.hash('cliente123', 12);
  const cliente = await prisma.user.create({
    data: {
      email: 'cliente@example.com',
      password: clientePassword,
      role: 'CLIENTE',
      profile: {
        create: {
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '+593999888777',
          address: 'Av. Los Rosales 789',
          city: 'Cuenca',
          province: 'Azuay'
        }
      }
    }
  });

  // Crear categorías
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Rosas Eternas',
        description: 'Rosas preservadas que duran para siempre'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Claveles Eternos',
        description: 'Claveles preservados de larga duración'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Ramos Especiales',
        description: 'Arreglos florales únicos y personalizados'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Cajas de Flores',
        description: 'Elegantes cajas con flores preservadas'
      }
    })
  ]);

  // Crear productos
  const products = await Promise.all([
    // Rosas
    prisma.product.create({
      data: {
        name: 'Rosa Eterna Roja',
        description: 'Hermosa rosa roja preservada que mantiene su belleza por años',
        price: 25.99,
        stock: 50,
        sku: 'ROSE-RED-001',
        categoryId: categories[0].id,
        images: {
          create: [
            {
              url: 'https://example.com/rosa-roja.jpg',
              altText: 'Rosa eterna roja',
              isMain: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Rosa Eterna Blanca',
        description: 'Elegante rosa blanca preservada, símbolo de pureza',
        price: 25.99,
        stock: 45,
        sku: 'ROSE-WHITE-001',
        categoryId: categories[0].id,
        images: {
          create: [
            {
              url: 'https://example.com/rosa-blanca.jpg',
              altText: 'Rosa eterna blanca',
              isMain: true
            }
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Rosa Eterna Rosada',
        description: 'Delicada rosa rosada preservada, perfecta para regalar',
        price: 25.99,
        stock: 40,
        sku: 'ROSE-PINK-001',
        categoryId: categories[0].id,
        images: {
          create: [
            {
              url: 'https://example.com/rosa-rosada.jpg',
              altText: 'Rosa eterna rosada',
              isMain: true
            }
          ]
        }
      }
    }),
    // Claveles
    prisma.product.create({
      data: {
        name: 'Clavel Eterno Rojo',
        description: 'Vibrante clavel rojo preservado con técnica especial',
        price: 18.99,
        stock: 60,
        sku: 'CARNATION-RED-001',
        categoryId: categories[1].id,
        images: {
          create: [
            {
              url: 'https://example.com/clavel-rojo.jpg',
              altText: 'Clavel eterno rojo',
              isMain: true
            }
          ]
        }
      }
    }),
    // Ramos especiales
    prisma.product.create({
      data: {
        name: 'Ramo Eternal Love',
        description: 'Ramo especial con 12 rosas eternas rojas y envoltorio elegante',
        price: 89.99,
        stock: 20,
        sku: 'BOUQUET-LOVE-001',
        categoryId: categories[2].id,
        images: {
          create: [
            {
              url: 'https://example.com/ramo-love.jpg',
              altText: 'Ramo Eternal Love',
              isMain: true
            }
          ]
        }
      }
    }),
    // Cajas de flores
    prisma.product.create({
      data: {
        name: 'Caja Elegante Negra',
        description: 'Caja negra elegante con 9 rosas eternas multicolores',
        price: 65.99,
        stock: 30,
        sku: 'BOX-BLACK-001',
        categoryId: categories[3].id,
        images: {
          create: [
            {
              url: 'https://example.com/caja-negra.jpg',
              altText: 'Caja elegante negra',
              isMain: true
            }
          ]
        }
      }
    })
  ]);

  // Crear clientes de prueba
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        tipoIdentificacion: 'CEDULA',
        identificacion: '1234567890',
        razonSocial: 'Ana López',
        email: 'ana.lopez@email.com',
        telefono: '+593999111222',
        direccion: 'Av. Amazonas 123, Quito'
      }
    }),
    prisma.customer.create({
      data: {
        tipoIdentificacion: 'RUC',
        identificacion: '1790123456001',
        razonSocial: 'Florería Bella Vista S.A.',
        email: 'ventas@bellvista.com',
        telefono: '+593987654321',
        direccion: 'Calle de las Flores 456, Guayaquil'
      }
    }),
    prisma.customer.create({
      data: {
        tipoIdentificacion: 'CONSUMIDOR_FINAL',
        identificacion: '9999999999999',
        razonSocial: 'Consumidor Final',
        email: null,
        telefono: null,
        direccion: null
      }
    })
  ]);

  // Crear orden de ejemplo
  const order = await prisma.order.create({
    data: {
      customerId: customers[0].id,
      userId: vendedor.id,
      status: 'CONFIRMADO',
      subtotal: 51.98,
      iva: 7.80,
      total: 59.78,
      paymentMethod: 'efectivo',
      shippingAddress: 'Av. Amazonas 123, Quito',
      notes: 'Entrega para el día de San Valentín',
      items: {
        create: [
          {
            productId: products[0].id, // Rosa roja
            quantity: 1,
            price: 25.99,
            subtotal: 25.99
          },
          {
            productId: products[1].id, // Rosa blanca
            quantity: 1,
            price: 25.99,
            subtotal: 25.99
          }
        ]
      }
    }
  });

  // Crear configuración SRI de pruebas
  const sriConfig = await prisma.sriConfiguration.create({
    data: {
      ruc: '1790012340001',
      razonSocial: 'FLORES ETERNAS CIA LTDA',
      nombreComercial: 'Flores Eternas',
      ambiente: '1', // Pruebas
      certificadoPath: './certs/certificado_pruebas.p12',
      certificadoClave: 'clave_certificado_pruebas',
      dirMatriz: 'AV PRINCIPAL 123 Y SECUNDARIA, QUITO, PICHINCHA',
      isActive: true
    }
  });

  console.log('Seed completed successfully!');
  console.log('Created:');
  console.log(`- ${3} users (admin, vendedor, cliente)`);
  console.log(`- ${categories.length} categories`);
  console.log(`- ${products.length} products`);
  console.log(`- ${customers.length} customers`);
  console.log(`- ${1} sample order`);
  console.log(`- ${1} SRI configuration`);
  console.log('');
  console.log('Login credentials:');
  console.log('Admin: admin@floreseternas.com / admin123');
  console.log('Vendedor: vendedor@floreseternas.com / vendedor123');
  console.log('Cliente: cliente@example.com / cliente123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });