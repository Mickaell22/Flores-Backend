const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createRealProducts() {
  try {
    console.log('🌸 Creando catálogo real de productos...');

    // 1. Desactivar productos del seed
    console.log('\n1️⃣ Desactivando productos del seed...');
    await prisma.product.updateMany({
      data: { isActive: false }
    });

    // 2. Obtener categorías
    const categories = await prisma.category.findMany();
    const defaultCategory = categories[0]; // Usar la primera categoría

    console.log(`Categoría por defecto: ${defaultCategory.name}`);

    // 3. Crear los 10 productos reales
    console.log('\n2️⃣ Creando productos reales...');

    const realProducts = [
      {
        name: "Caja Elegante de Flores Eternas",
        description: "Hermosa caja hexagonal de madera de 15 cm con 4 flores eternas multicolores. Perfecta para decorar cualquier espacio con elegancia y estilo duradero.",
        price: 13.00,
        stock: 5,
        sku: "CAJA-ELEGANTE-001",
        imageFilename: "1.jpg"
      },
      {
        name: "Caja Compacta con Luz LED",
        description: "Caja circular compacta de 12 cm con 3 flores eternas e iluminación LED integrada. Combina belleza natural con tecnología moderna para crear un ambiente mágico.",
        price: 20.00,
        stock: 5,
        sku: "CAJA-LED-001",
        imageFilename: "2.jpg"
      },
      {
        name: "Margarita Eterna Clásica",
        description: "Preciosa margarita eterna de 22 cm de diámetro y 25 cm de altura. Simboliza la pureza y la belleza natural. Perfecta para quienes aman la simplicidad y elegancia de las flores clásicas.",
        price: 3.00,
        stock: 5,
        sku: "MARGARITA-CLASICA-001",
        imageFilename: "3.jpg"
      },
      {
        name: "Ramo de 4 Rosas con Listón",
        description: "Ramo romántico de 4 rosas eternas adornado con elegante listón. Mide 33 cm de alto por 27 cm de ancho. Ideal para expresar amor y cariño en ocasiones especiales o como detalle romántico.",
        price: 8.00,
        stock: 5,
        sku: "RAMO-4ROSAS-001",
        imageFilename: "4.jpg"
      },
      {
        name: "Ramo Mini de 7 Rosas",
        description: "Delicado ramo mini con 7 pequeñas rosas eternas de colores variados. Con 20 cm de altura y 15 cm de ancho, es perfecto como regalo tierno o decoración delicada para espacios íntimos.",
        price: 7.00,
        stock: 5,
        sku: "RAMO-MINI-001",
        imageFilename: "5.jpg"
      },
      {
        name: "Girasol Eterno Grande",
        description: "Impresionante girasol eterno de 35 cm de diámetro y 40 cm de altura. Representa alegría, vitalidad y energía positiva. Una pieza llamativa que ilumina cualquier ambiente con su presencia solar.",
        price: 10.00,
        stock: 5,
        sku: "GIRASOL-GRANDE-001",
        imageFilename: "6.jpg"
      },
      {
        name: "Caja Premium con Luces - 4 Flores",
        description: "Caja premium rectangular de 18x12 cm con 4 flores eternas e iluminación LED multicolor. Incluye control remoto para personalizar la experiencia lumínica. Elegancia y tecnología unidas.",
        price: 20.00,
        stock: 5,
        sku: "CAJA-PREMIUM-LED-001",
        imageFilename: "7.jpg"
      },
      {
        name: "Margarita Eterna Amplia",
        description: "Margarita eterna de gran tamaño con 28 cm de diámetro y 30 cm de altura. Su amplia superficie de pétalos blancos crea un impacto visual impresionante, perfecta como pieza central decorativa.",
        price: 3.00,
        stock: 5,
        sku: "MARGARITA-AMPLIA-001",
        imageFilename: "8.jpg"
      },
      {
        name: "Moño Decorativo para Cortinas",
        description: "Elegante moño decorativo de 25 cm con flores eternas integradas. Diseñado para adornar cortinas, pero versátil para múltiples usos decorativos. Combina funcionalidad con belleza floral duradera.",
        price: 5.00,
        stock: 5,
        sku: "MONO-CORTINA-001",
        imageFilename: "9.jpg"
      },
      {
        name: "Plumaflora Artesanal",
        description: "Creación artesanal única que combina plumas naturales con flores eternas en un diseño de 30 cm de altura. Pieza exclusiva que fusiona texturas naturales para crear una decoración sofisticada y original.",
        price: 3.00,
        stock: 5,
        sku: "PLUMAFLORA-001",
        imageFilename: "10.jpg"
      }
    ];

    for (const productData of realProducts) {
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

      console.log(`✅ ${productData.imageFilename}: ${product.name} - $${product.price}`);
    }

    console.log('\n🎉 ¡Catálogo real creado exitosamente!');

    // 4. Mostrar resumen final
    const finalProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: true,
        category: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`\n📋 Catálogo final (${finalProducts.length} productos):`);
    finalProducts.forEach((product, index) => {
      const imageFile = product.images[0]?.url.split('/').pop() || 'sin imagen';
      console.log(`${index + 1}. ${product.name} - $${product.price} (${imageFile})`);
    });

    console.log(`\n💰 Valor total del inventario: $${finalProducts.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRealProducts();