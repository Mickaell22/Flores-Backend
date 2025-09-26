const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateProductImages() {
  try {
    console.log('Actualizando imágenes de productos...');

    // Obtener productos ordenados por creación (nuestros productos reales)
    const products = await prisma.product.findMany({
      where: {
        // Solo productos que no tienen imágenes de ejemplo
        images: {
          none: {
            url: {
              contains: 'example.com'
            }
          }
        }
      },
      include: {
        images: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Productos encontrados: ${products.length}`);

    // Mapeo de imágenes (según tu lista)
    const imageMapping = [
      { filename: '1.jpg', altText: 'Caja Elegante de Flores Eternas' },
      { filename: '2.jpg', altText: 'Caja Compacta con Luz LED' },
      { filename: '3.jpg', altText: 'Margarita Eterna Clásica' },
      { filename: '4.jpg', altText: 'Ramo de 4 Rosas con Listón' },
      { filename: '5.jpg', altText: 'Ramo Mini de 7 Rosas' },
      { filename: '6.jpg', altText: 'Girasol Eterno Grande' },
      { filename: '7.jpg', altText: 'Caja Premium con Luces - 4 Flores' },
      { filename: '8.jpg', altText: 'Margarita Eterna Amplia' },
      { filename: '9.jpg', altText: 'Moño Decorativo para Cortinas' },
      { filename: '10.jpg', altText: 'Plumaflora Artesanal' }
    ];

    for (let i = 0; i < Math.min(products.length, imageMapping.length); i++) {
      const product = products[i];
      const imageData = imageMapping[i];

      // Eliminar imágenes existentes si las hay
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      });

      // Crear nueva imagen
      const newImage = await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `/uploads/products/${imageData.filename}`,
          altText: imageData.altText,
          isMain: true
        }
      });

      console.log(`✅ ${i + 1}. ${product.name} -> ${imageData.filename}`);
    }

    console.log('\n🎉 ¡Imágenes actualizadas exitosamente!');

    // Verificar resultado
    const updatedProducts = await prisma.product.findMany({
      include: {
        images: true,
        category: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('\n📋 Productos con imágenes:');
    updatedProducts.forEach((product, index) => {
      const imageCount = product.images.length;
      const imageUrl = product.images[0]?.url || 'Sin imagen';
      console.log(`${index + 1}. ${product.name} - $${product.price}`);
      console.log(`   Imagen: ${imageUrl}`);
      console.log(`   Stock: ${product.stock} | Categoría: ${product.category.name}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductImages();