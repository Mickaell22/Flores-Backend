const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleOrders() {
  try {
    console.log('Creando clientes y órdenes de ejemplo...');

    // Crear algunos clientes
    const customers = await Promise.all([
      prisma.customer.upsert({
        where: { identificacion: '1234567890' },
        update: {},
        create: {
          tipoIdentificacion: 'CEDULA',
          identificacion: '1234567890',
          razonSocial: 'María García',
          email: 'maria.garcia@email.com',
          telefono: '+593991234567',
          direccion: 'Av. 10 de Agosto y Orellana, Quito'
        }
      }),
      prisma.customer.upsert({
        where: { identificacion: '0987654321' },
        update: {},
        create: {
          tipoIdentificacion: 'CEDULA',
          identificacion: '0987654321',
          razonSocial: 'Carlos Mendoza',
          email: 'carlos.mendoza@email.com',
          telefono: '+593987654321',
          direccion: 'Calle Amazonas 123, Quito'
        }
      }),
      prisma.customer.upsert({
        where: { identificacion: '1122334455' },
        update: {},
        create: {
          tipoIdentificacion: 'CEDULA',
          identificacion: '1122334455',
          razonSocial: 'Ana López',
          email: 'ana.lopez@email.com',
          telefono: '+593912345678',
          direccion: 'Av. Patria y 9 de Octubre, Quito'
        }
      })
    ]);

    // Obtener productos existentes
    const products = await prisma.product.findMany({
      take: 6
    });

    if (products.length === 0) {
      console.log('No hay productos. Ejecuta primero el script de productos.');
      return;
    }

    // Obtener usuario admin
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('No hay usuario admin. Crea uno primero.');
      return;
    }

    // Crear órdenes de ejemplo
    const orders = [];

    // Orden 1 - Pendiente
    const order1Items = [
      {
        productId: products[0].id,
        quantity: 2,
        price: products[0].price,
        subtotal: products[0].price * 2
      },
      {
        productId: products[1].id,
        quantity: 1,
        price: products[1].price,
        subtotal: products[1].price * 1
      }
    ];
    const order1Subtotal = order1Items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const order1Iva = order1Subtotal * 0.15;
    const order1Total = order1Subtotal + order1Iva;

    const order1 = await prisma.order.create({
      data: {
        customerId: customers[0].id,
        userId: admin.id,
        status: 'PENDIENTE',
        subtotal: order1Subtotal,
        iva: order1Iva,
        total: order1Total,
        paymentMethod: 'Transferencia Bancaria',
        shippingAddress: 'Av. 10 de Agosto y Orellana, Quito',
        notes: 'Cliente prefiere entrega en la mañana',
        whatsappMessage: `Hola! Confirmamos tu pedido de ${order1Items.length} productos por $${order1Total.toFixed(2)}`,
        whatsappSent: false,
        items: {
          create: order1Items
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    // Orden 2 - En proceso
    const order2Items = [
      {
        productId: products[2].id,
        quantity: 3,
        price: products[2].price,
        subtotal: products[2].price * 3
      }
    ];
    const order2Subtotal = order2Items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const order2Iva = order2Subtotal * 0.15;
    const order2Total = order2Subtotal + order2Iva;

    const order2 = await prisma.order.create({
      data: {
        customerId: customers[1].id,
        userId: admin.id,
        status: 'EN_PROCESO',
        subtotal: order2Subtotal,
        iva: order2Iva,
        total: order2Total,
        paymentMethod: 'PayPal',
        shippingAddress: 'Calle Amazonas 123, Quito',
        notes: 'Pedido para regalo de aniversario',
        whatsappMessage: `Hola Carlos! Tu pedido está en proceso. Total: $${order2Total.toFixed(2)}`,
        whatsappSent: true,
        items: {
          create: order2Items
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    // Orden 3 - Completada
    const order3Items = [
      {
        productId: products[3].id,
        quantity: 1,
        price: products[3].price,
        subtotal: products[3].price * 1
      },
      {
        productId: products[4].id,
        quantity: 2,
        price: products[4].price,
        subtotal: products[4].price * 2
      }
    ];
    const order3Subtotal = order3Items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const order3Iva = order3Subtotal * 0.15;
    const order3Total = order3Subtotal + order3Iva;

    const order3 = await prisma.order.create({
      data: {
        customerId: customers[2].id,
        userId: admin.id,
        status: 'ENTREGADO',
        subtotal: order3Subtotal,
        iva: order3Iva,
        total: order3Total,
        paymentMethod: 'Efectivo',
        shippingAddress: 'Av. Patria y 9 de Octubre, Quito',
        notes: 'Entrega exitosa. Cliente muy satisfecho.',
        whatsappMessage: `¡Gracias Ana! Tu pedido fue entregado exitosamente. Total: $${order3Total.toFixed(2)}`,
        whatsappSent: true,
        items: {
          create: order3Items
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    console.log('✅ Órdenes de ejemplo creadas:');
    console.log(`- Orden 1: ${order1.id} - ${order1.status} - $${order1.total}`);
    console.log(`- Orden 2: ${order2.id} - ${order2.status} - $${order2.total}`);
    console.log(`- Orden 3: ${order3.id} - ${order3.status} - $${order3.total}`);

    console.log('\n✅ Clientes creados:');
    customers.forEach(customer => {
      console.log(`- ${customer.razonSocial} (${customer.identificacion})`);
    });

  } catch (error) {
    console.error('Error creando órdenes de ejemplo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleOrders();