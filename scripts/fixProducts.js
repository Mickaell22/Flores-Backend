const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProducts() {
  try {
    console.log('Verificando productos actuales...');

    // Primero eliminar todos los productos para empezar limpio
    await prisma.productImage.deleteMany({});
    await prisma.product.deleteMany({});

    console.log('✅ Productos anteriores eliminados');

    // Obtener categorías
    const categories = await prisma.category.findMany();
    console.log('Categorías disponibles:', categories.map(c => c.name));

    // Crear los 10 productos reales
    const realProducts = [
      {
        name: "Caja Elegante de Flores Eternas",
        description: "Hermosa caja de flores eternas de 40x15 cm con una altura de 50 cm. Perfecta para decorar cualquier espacio con elegancia y sofisticación. Las flores mantienen su belleza natural durante años sin necesidad de cuidados.",
        price: 13.00,
        stock: 5,
        sku: "CAJA-ELEGANTE-001",
        categoryId: categories.find(c => c.name.includes('Cajas'))?.id || categories[0].id
      },
      {
        name: "Caja Compacta con Luz LED",
        description: "Encantadora caja iluminada de 20x13 cm con luz LED incorporada. Ideal para crear un ambiente romántico y acogedor. Las flores eternas brillan suavemente, perfecta para regalo o decoración nocturna.",
        price: 20.00,
        stock: 5,
        sku: "CAJA-LUZ-001",
        categoryId: categories.find(c => c.name.includes('Cajas'))?.id || categories[0].id
      },
      {
        name: "Margarita Eterna Clásica",
        description: "Preciosa margarita eterna de 22 cm de diámetro y 25 cm de altura. Simboliza la pureza y la belleza natural. Perfecta para quienes aman la simplicidad y elegancia de las flores clásicas.",
        price: 3.00,
        stock: 5,
        sku: "MARGARITA-CLASICA-001",
        categoryId: categories.find(c => c.name.includes('Rosas'))?.id || categories[0].id
      },
      {
        name: "Ramo de 4 Rosas con Listón",
        description: "Ramo romántico de 4 rosas eternas adornado con elegante listón. Mide 33 cm de alto por 27 cm de ancho. Ideal para expresar amor y cariño en ocasiones especiales o como detalle romántico.",
        price: 8.00,
        stock: 5,
        sku: "RAMO-4ROSAS-001",
        categoryId: categories.find(c => c.name.includes('Ramos'))?.id || categories[0].id
      },
      {
        name: "Ramo Mini de 7 Rosas",
        description: "Encantador ramo compacto con 7 rosas eternas de 30x30 cm. Perfecto para espacios pequeños o como regalo delicado. Su tamaño lo hace ideal para escritorios, mesitas de noche o como detalle especial.",
        price: 7.00,
        stock: 5,
        sku: "RAMO-MINI-001",
        categoryId: categories.find(c => c.name.includes('Ramos'))?.id || categories[0].id
      },
      {
        name: "Girasol Eterno Grande",
        description: "Impresionante girasol eterno de 47 cm de diámetro y 18 cm de altura. Simboliza alegría, vitalidad y energía positiva. Perfecto para iluminar cualquier espacio con su presencia radiante y optimista.",
        price: 10.00,
        stock: 5,
        sku: "GIRASOL-GRANDE-001",
        categoryId: categories.find(c => c.name.includes('Rosas'))?.id || categories[0].id
      },
      {
        name: "Caja Premium con Luces - 4 Flores",
        description: "Exclusiva caja cuadrada de 15x15 cm con 4 flores eternas y sistema de luces LED. Combina elegancia y modernidad para crear un ambiente mágico. Ideal para regalos especiales o decoración premium.",
        price: 20.00,
        stock: 5,
        sku: "CAJA-PREMIUM-001",
        categoryId: categories.find(c => c.name.includes('Cajas'))?.id || categories[0].id
      },
      {
        name: "Margarita Eterna Amplia",
        description: "Margarita eterna de gran tamaño, 37 cm de alto por 23 cm de ancho. Su imponente presencia la convierte en el centro de atención de cualquier decoración. Perfecta para espacios amplios.",
        price: 3.00,
        stock: 5,
        sku: "MARGARITA-AMPLIA-001",
        categoryId: categories.find(c => c.name.includes('Rosas'))?.id || categories[0].id
      },
      {
        name: "Moño Decorativo para Cortinas",
        description: "Elegante moño decorativo diseñado especialmente para cortinas. Añade un toque de sofisticación y estilo a tus ventanas. Fácil de instalar y combina con cualquier decoración del hogar.",
        price: 5.00,
        stock: 5,
        sku: "MONO-CORTINA-001",
        categoryId: categories.find(c => c.name.includes('Ramos'))?.id || categories[0].id
      },
      {
        name: "Plumaflora Artesanal",
        description: "Delicada plumaflora artesanal, perfecta para arreglos florales únicos o como elemento decorativo individual. Su textura suave y aspecto natural la hacen ideal para decoraciones bohemias o rústicas.",
        price: 3.00,
        stock: 5,
        sku: "PLUMAFLORA-001",
        categoryId: categories.find(c => c.name.includes('Ramos'))?.id || categories[0].id
      }
    ];

    console.log('\nCreando productos reales...');

    for (let i = 0; i < realProducts.length; i++) {
      const productData = realProducts[i];

      const created = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          sku: productData.sku,
          categoryId: productData.categoryId,
          isActive: true
        }
      });

      console.log(`✅ ${i + 1}. ${created.name} - $${created.price} (Stock: ${created.stock})`);
    }

    console.log('\n🎉 ¡Catálogo de productos reales creado exitosamente!');
    console.log('\n📋 Resumen de tu catálogo:');

    const allProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        category: true
      }
    });

    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} (${product.category.name})`);
    });

    console.log(`\n💰 Total productos: ${allProducts.length}`);
    console.log(`💵 Valor total del inventario: $${allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProducts();