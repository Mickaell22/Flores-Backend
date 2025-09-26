const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingProducts() {
  try {
    console.log('Actualizando productos existentes...');

    // Obtener todos los productos actuales ordenados por fecha de creación
    const existingProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Productos encontrados: ${existingProducts.length}`);

    // Datos reales de tus productos
    const realProductsData = [
      {
        name: "Caja Elegante de Flores Eternas",
        description: "Hermosa caja de flores eternas de 40x15 cm con una altura de 50 cm. Perfecta para decorar cualquier espacio con elegancia y sofisticación. Las flores mantienen su belleza natural durante años sin necesidad de cuidados.",
        price: 13.00,
        stock: 5
      },
      {
        name: "Caja Compacta con Luz LED",
        description: "Encantadora caja iluminada de 20x13 cm con luz LED incorporada. Ideal para crear un ambiente romántico y acogedor. Las flores eternas brillan suavemente, perfecta para regalo o decoración nocturna.",
        price: 20.00,
        stock: 5
      },
      {
        name: "Margarita Eterna Clásica",
        description: "Preciosa margarita eterna de 22 cm de diámetro y 25 cm de altura. Simboliza la pureza y la belleza natural. Perfecta para quienes aman la simplicidad y elegancia de las flores clásicas.",
        price: 3.00,
        stock: 5
      },
      {
        name: "Ramo de 4 Rosas con Listón",
        description: "Ramo romántico de 4 rosas eternas adornado con elegante listón. Mide 33 cm de alto por 27 cm de ancho. Ideal para expresar amor y cariño en ocasiones especiales o como detalle romántico.",
        price: 8.00,
        stock: 5
      },
      {
        name: "Ramo Mini de 7 Rosas",
        description: "Encantador ramo compacto con 7 rosas eternas de 30x30 cm. Perfecto para espacios pequeños o como regalo delicado. Su tamaño lo hace ideal para escritorios, mesitas de noche o como detalle especial.",
        price: 7.00,
        stock: 5
      },
      {
        name: "Girasol Eterno Grande",
        description: "Impresionante girasol eterno de 47 cm de diámetro y 18 cm de altura. Simboliza alegría, vitalidad y energía positiva. Perfecto para iluminar cualquier espacio con su presencia radiante y optimista.",
        price: 10.00,
        stock: 5
      }
    ];

    // Actualizar productos existentes
    for (let i = 0; i < Math.min(existingProducts.length, realProductsData.length); i++) {
      const product = existingProducts[i];
      const newData = realProductsData[i];

      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          name: newData.name,
          description: newData.description,
          price: newData.price,
          stock: newData.stock
        }
      });

      console.log(`✅ ${i + 1}. Actualizado: ${updated.name} - $${updated.price}`);
    }

    // Crear productos faltantes si hay menos de 10
    if (existingProducts.length < 10) {
      console.log('\nCreando productos faltantes...');

      const categories = await prisma.category.findMany();
      const defaultCategory = categories[0];

      const additionalProducts = [
        {
          name: "Caja Premium con Luces - 4 Flores",
          description: "Exclusiva caja cuadrada de 15x15 cm con 4 flores eternas y sistema de luces LED. Combina elegancia y modernidad para crear un ambiente mágico. Ideal para regalos especiales o decoración premium.",
          price: 20.00,
          stock: 5,
          sku: "CAJA-PREMIUM-001"
        },
        {
          name: "Margarita Eterna Amplia",
          description: "Margarita eterna de gran tamaño, 37 cm de alto por 23 cm de ancho. Su imponente presencia la convierte en el centro de atención de cualquier decoración. Perfecta para espacios amplios.",
          price: 3.00,
          stock: 5,
          sku: "MARGARITA-AMPLIA-001"
        },
        {
          name: "Moño Decorativo para Cortinas",
          description: "Elegante moño decorativo diseñado especialmente para cortinas. Añade un toque de sofisticación y estilo a tus ventanas. Fácil de instalar y combina con cualquier decoración del hogar.",
          price: 5.00,
          stock: 5,
          sku: "MONO-CORTINA-001"
        },
        {
          name: "Plumaflora Artesanal",
          description: "Delicada plumaflora artesanal, perfecta para arreglos florales únicos o como elemento decorativo individual. Su textura suave y aspecto natural la hacen ideal para decoraciones bohemias o rústicas.",
          price: 3.00,
          stock: 5,
          sku: "PLUMAFLORA-001"
        }
      ];

      const missingCount = 10 - existingProducts.length;
      const productsToCreate = additionalProducts.slice(0, missingCount);

      for (let i = 0; i < productsToCreate.length; i++) {
        const productData = productsToCreate[i];

        const created = await prisma.product.create({
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

        console.log(`✅ ${existingProducts.length + i + 1}. Creado: ${created.name} - $${created.price}`);
      }
    }

    console.log('\n🎉 ¡Catálogo actualizado exitosamente!');

    // Mostrar resumen final
    const allProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        category: true
      }
    });

    console.log('\n📋 Tu catálogo final:');
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} (Stock: ${product.stock})`);
    });

    console.log(`\n📊 Estadísticas:`);
    console.log(`- Total productos: ${allProducts.length}`);
    console.log(`- Valor total inventario: $${allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}`);
    console.log(`- Precio promedio: $${(allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingProducts();