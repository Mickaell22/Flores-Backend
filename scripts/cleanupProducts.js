const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupProducts() {
  try {
    console.log('Limpiando productos duplicados...');

    // Obtener todos los productos
    const allProducts = await prisma.product.findMany({
      include: {
        images: true,
        category: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Total productos encontrados: ${allProducts.length}`);

    // Identificar productos del seed original (tienen URLs de ejemplo)
    const seedProducts = allProducts.filter(product =>
      product.images.some(img => img.url.includes('example.com')) ||
      product.sku?.includes('ROSE-RED-001') ||
      product.sku?.includes('BOX-BLACK-001') ||
      product.sku?.includes('CARNATION-RED-001') ||
      product.sku?.includes('ROSE-WHITE-001') ||
      product.sku?.includes('BOUQUET-LOVE-001') ||
      product.sku?.includes('ROSE-PINK-001')
    );

    console.log(`Productos del seed a eliminar: ${seedProducts.length}`);

    // Eliminar productos del seed
    for (const product of seedProducts) {
      // Primero eliminar imágenes
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      });

      // Luego eliminar el producto
      await prisma.product.delete({
        where: { id: product.id }
      });

      console.log(`✅ Eliminado: ${product.name}`);
    }

    console.log('\n🎉 Limpieza completada');

    // Mostrar productos restantes
    const remainingProducts = await prisma.product.findMany({
      include: {
        category: true,
        images: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`\n📋 Productos finales (${remainingProducts.length}):`);
    remainingProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} (${product.images.length} imágenes)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupProducts();