const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const updatedProducts = [
  {
    id: 1,
    name: "Caja Elegante de Flores Eternas",
    description: "Hermosa caja de flores eternas de 40x15 cm con una altura de 50 cm. Perfecta para decorar cualquier espacio con elegancia y sofisticación. Las flores mantienen su belleza natural durante años sin necesidad de cuidados.",
    price: 13.00,
    dimensions: "40cm x 15cm x 50cm de alto"
  },
  {
    id: 2,
    name: "Caja Compacta con Luz LED",
    description: "Encantadora caja iluminada de 20x13 cm con luz LED incorporada. Ideal para crear un ambiente romántico y acogedor. Las flores eternas brillan suavemente, perfecta para regalo o decoración nocturna.",
    price: 20.00,
    dimensions: "20cm x 13cm de alto con sistema de luz"
  },
  {
    id: 3,
    name: "Margarita Eterna Clásica",
    description: "Preciosa margarita eterna de 22 cm de diámetro y 25 cm de altura. Simboliza la pureza y la belleza natural. Perfecta para quienes aman la simplicidad y elegancia de las flores clásicas.",
    price: 3.00,
    dimensions: "22cm de diámetro, 25cm de altura"
  },
  {
    id: 4,
    name: "Ramo de 4 Rosas con Listón",
    description: "Ramo romántico de 4 rosas eternas adornado con elegante listón. Mide 33 cm de alto por 27 cm de ancho. Ideal para expresar amor y cariño en ocasiones especiales o como detalle romántico.",
    price: 8.00,
    dimensions: "33cm de alto x 27cm de ancho, incluye listón decorativo"
  },
  {
    id: 5,
    name: "Ramo Mini de 7 Rosas",
    description: "Encantador ramo compacto con 7 rosas eternas de 30x30 cm. Perfecto para espacios pequeños o como regalo delicado. Su tamaño lo hace ideal para escritorios, mesitas de noche o como detalle especial.",
    price: 7.00,
    dimensions: "30cm de ancho x 30cm de largo, 7 rosas"
  },
  {
    id: 6,
    name: "Girasol Eterno Grande",
    description: "Impresionante girasol eterno de 47 cm de diámetro y 18 cm de altura. Simboliza alegría, vitalidad y energía positiva. Perfecto para iluminar cualquier espacio con su presencia radiante y optimista.",
    price: 10.00,
    dimensions: "47cm de diámetro, 18cm de altura"
  },
  {
    id: 7,
    name: "Caja Premium con Luces - 4 Flores",
    description: "Exclusiva caja cuadrada de 15x15 cm con 4 flores eternas y sistema de luces LED. Combina elegancia y modernidad para crear un ambiente mágico. Ideal para regalos especiales o decoración premium.",
    price: 20.00,
    dimensions: "15cm x 15cm, 4 flores con sistema de luces"
  },
  {
    id: 8,
    name: "Margarita Eterna Amplia",
    description: "Margarita eterna de gran tamaño, 37 cm de alto por 23 cm de ancho. Su imponente presencia la convierte en el centro de atención de cualquier decoración. Perfecta para espacios amplios.",
    price: 3.00,
    dimensions: "37cm de alto x 23cm de ancho"
  },
  {
    id: 9,
    name: "Moño Decorativo para Cortinas",
    description: "Elegante moño decorativo diseñado especialmente para cortinas. Añade un toque de sofisticación y estilo a tus ventanas. Fácil de instalar y combina con cualquier decoración del hogar.",
    price: 5.00,
    dimensions: "Accesorio para cortinas, fácil instalación"
  },
  {
    id: 10,
    name: "Plumaflora Artesanal",
    description: "Delicada plumaflora artesanal, perfecta para arreglos florales únicos o como elemento decorativo individual. Su textura suave y aspecto natural la hacen ideal para decoraciones bohemias o rústicas.",
    price: 3.00,
    dimensions: "Pieza artesanal única"
  }
];

async function updateProducts() {
  try {
    console.log('Comenzando actualización de productos...');

    for (const productData of updatedProducts) {
      // Buscar el producto por posición en lugar de ID fijo
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'asc' }
      });

      if (products[productData.id - 1]) {
        const productId = products[productData.id - 1].id;

        const updated = await prisma.product.update({
          where: { id: productId },
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
          }
        });

        console.log(`✅ Producto ${productData.id} actualizado: ${updated.name} - $${updated.price}`);
      } else {
        console.log(`⚠️  No se encontró producto en posición ${productData.id}`);
      }
    }

    console.log('\n🎉 ¡Actualización completada exitosamente!');
    console.log('\nResumen de productos actualizados:');

    const allProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        name: true,
        price: true,
        description: true
      }
    });

    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price}`);
    });

  } catch (error) {
    console.error('❌ Error actualizando productos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProducts();