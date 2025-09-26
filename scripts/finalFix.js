const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalFix() {
  try {
    console.log('Aplicando corrección final...');

    // Desactivar productos del seed (los que no tienen las imágenes correctas)
    const seedProducts = await prisma.product.findMany({
      where: {
        OR: [
          { sku: 'ROSE-RED-001' },
          { sku: 'BOX-BLACK-001' },
          { sku: 'CARNATION-RED-001' },
          { sku: 'ROSE-WHITE-001' },
          { sku: 'BOUQUET-LOVE-001' },
          { sku: 'ROSE-PINK-001' }
        ]
      }
    });

    for (const product of seedProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false }
      });
      console.log(`Desactivado: ${product.name}`);
    }

    // Verificar productos activos
    const activeProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: true,
        category: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`\nProductos activos: ${activeProducts.length}`);
    activeProducts.forEach((product, index) => {
      const imageFile = product.images[0]?.url.split('/').pop() || 'sin imagen';
      console.log(`${index + 1}. ${product.name} - $${product.price} (${imageFile})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalFix();