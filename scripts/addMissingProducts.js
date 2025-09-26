const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMissingProducts() {
  try {
    console.log('Agregando los 2 productos faltantes...');

    // Obtener una categoría para asignar
    const categories = await prisma.category.findMany();
    const defaultCategory = categories[0];

    // Los 2 productos que faltan según tu lista original
    const missingProducts = [
      {
        name: "Margarita Eterna Clásica",
        description: "Preciosa margarita eterna de 22 cm de diámetro y 25 cm de altura. Simboliza la pureza y la belleza natural. Perfecta para quienes aman la simplicidad y elegancia de las flores clásicas.",
        price: 3.00,
        stock: 5,
        sku: "MARGARITA-CLASICA-001",
        imageFilename: "9.jpg"
      },
      {
        name: "Ramo de 4 Rosas con Listón",
        description: "Ramo romántico de 4 rosas eternas adornado con elegante listón. Mide 33 cm de alto por 27 cm de ancho. Ideal para expresar amor y cariño en ocasiones especiales o como detalle romántico.",
        price: 8.00,
        stock: 5,
        sku: "RAMO-4ROSAS-001",
        imageFilename: "10.jpg"
      }
    ];

    for (const productData of missingProducts) {
      // Crear el producto
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          sku: productData.sku,
          categoryId: defaultCategory.id,
          isActive: true
        }
      });

      // Crear la imagen
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `/uploads/products/${productData.imageFilename}`,
          altText: productData.name,
          isMain: true
        }
      });

      console.log(`✅ Creado: ${product.name} - $${product.price} (${productData.imageFilename})`);
    }

    console.log('\n🎉 ¡Productos faltantes agregados!');

    // Mostrar catálogo completo
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: true,
        category: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`\n📋 Catálogo completo (${allProducts.length} productos):`);
    allProducts.forEach((product, index) => {
      const imageFile = product.images[0]?.url.split('/').pop() || 'sin imagen';
      console.log(`${index + 1}. ${product.name} - $${product.price} (${imageFile})`);
    });

    console.log(`\n💰 Valor total del inventario: $${allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingProducts();