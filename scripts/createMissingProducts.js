const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingProducts() {
  try {
    console.log('Creando productos faltantes...');

    // Obtener una categoría existente para asignar a los nuevos productos
    const categories = await prisma.category.findMany();
    const defaultCategory = categories[0]; // Usamos la primera categoría disponible

    console.log(`Usando categoría: ${defaultCategory.name}`);

    // Productos del 7 al 10 que faltan
    const newProducts = [
      {
        name: "Caja Premium con Luces - 4 Flores",
        description: "Exclusiva caja cuadrada de 15x15 cm con 4 flores eternas y sistema de luces LED. Combina elegancia y modernidad para crear un ambiente mágico. Ideal para regalos especiales o decoración premium.",
        price: 20.00,
        stock: 5,
        sku: "CAJA-PREMIUM-LED-001"
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

    for (const productData of newProducts) {
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

      console.log(`✅ Producto creado: ${created.name} - $${created.price}`);
    }

    // Ahora actualizar los primeros 6 productos con precios correctos
    const existingProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      take: 6
    });

    const updates = [
      { name: "Caja Elegante de Flores Eternas", price: 13.00, description: "Hermosa caja de flores eternas de 40x15 cm con una altura de 50 cm. Perfecta para decorar cualquier espacio con elegancia y sofisticación. Las flores mantienen su belleza natural durante años sin necesidad de cuidados." },
      { name: "Caja Compacta con Luz LED", price: 20.00, description: "Encantadora caja iluminada de 20x13 cm con luz LED incorporada. Ideal para crear un ambiente romántico y acogedor. Las flores eternas brillan suavemente, perfecta para regalo o decoración nocturna." },
      { name: "Margarita Eterna Clásica", price: 3.00, description: "Preciosa margarita eterna de 22 cm de diámetro y 25 cm de altura. Simboliza la pureza y la belleza natural. Perfecta para quienes aman la simplicidad y elegancia de las flores clásicas." },
      { name: "Ramo de 4 Rosas con Listón", price: 8.00, description: "Ramo romántico de 4 rosas eternas adornado con elegante listón. Mide 33 cm de alto por 27 cm de ancho. Ideal para expresar amor y cariño en ocasiones especiales o como detalle romántico." },
      { name: "Ramo Mini de 7 Rosas", price: 7.00, description: "Encantador ramo compacto con 7 rosas eternas de 30x30 cm. Perfecto para espacios pequeños o como regalo delicado. Su tamaño lo hace ideal para escritorios, mesitas de noche o como detalle especial." },
      { name: "Girasol Eterno Grande", price: 10.00, description: "Impresionante girasol eterno de 47 cm de diámetro y 18 cm de altura. Simboliza alegría, vitalidad y energía positiva. Perfecto para iluminar cualquier espacio con su presencia radiante y optimista." }
    ];

    console.log('\nActualizando productos existentes...');

    for (let i = 0; i < Math.min(existingProducts.length, updates.length); i++) {
      const updated = await prisma.product.update({
        where: { id: existingProducts[i].id },
        data: {
          name: updates[i].name,
          description: updates[i].description,
          price: updates[i].price,
          stock: 5
        }
      });

      console.log(`✅ Producto actualizado: ${updated.name} - $${updated.price}`);
    }

    console.log('\n🎉 ¡Todos los productos han sido creados y actualizados!');

    // Mostrar resumen final
    const allProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        name: true,
        price: true,
        stock: true
      }
    });

    console.log('\n📋 Catálogo completo:');
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price} (Stock: ${product.stock})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingProducts();