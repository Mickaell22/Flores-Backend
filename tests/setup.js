const { execSync } = require('child_process');

// Configuración de pruebas
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/DB-Flores-Test?schema=public';

// Configurar base de datos de pruebas
async function setupTestDatabase() {
  try {
    console.log('Configurando base de datos de pruebas...');

    // Ejecutar migraciones
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });

    console.log('Base de datos de pruebas configurada correctamente');
  } catch (error) {
    console.error('Error configurando base de datos de pruebas:', error);
    process.exit(1);
  }
}

module.exports = { setupTestDatabase };