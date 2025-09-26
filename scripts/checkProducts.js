const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Total productos en BD: ${products.length}\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Precio: $${product.price}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Categoría: ${product.category.name}`);
      console.log(`   Imágenes: ${product.images.length}`);
      console.log(`   ID: ${product.id}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();