const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAPIProducts() {
  try {
    console.log('Diagnosticando problema del API...');

    // Verificar TODOS los productos en la base de datos
    const allProducts = await prisma.product.findMany({
      include: {
        images: true,
        category: true
      }
    });

    console.log(`\nTotal productos en BD: ${allProducts.length}`);

    // Separar productos por tipo
    const seedProducts = allProducts.filter(p =>
      p.images.some(img => img.url.includes('example.com'))
    );

    const realProducts = allProducts.filter(p =>
      !p.images.some(img => img.url.includes('example.com'))
    );

    console.log(`Productos del seed (URLs example.com): ${seedProducts.length}`);
    console.log(`Productos reales (tus productos): ${realProducts.length}`);

    console.log('\n📋 Productos del seed (a desactivar):');
    seedProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - ID: ${p.id.slice(-8)}`);
    });

    console.log('\n📋 Tus productos reales:');
    realProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - $${p.price} - ID: ${p.id.slice(-8)}`);
    });

    // Desactivar productos del seed en lugar de eliminarlos
    console.log('\n🔄 Desactivando productos del seed...');

    for (const product of seedProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false }
      });
      console.log(`✅ Desactivado: ${product.name}`);
    }

    console.log('\n🎉 ¡Productos del seed desactivados!');

    // Verificar que el API ahora devuelva solo productos activos
    const activeProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: true,
        category: true
      }
    });

    console.log(`\n📊 Productos activos restantes: ${activeProducts.length}`);
    activeProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - $${p.price} (${p.images.length} imágenes)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAPIProducts();