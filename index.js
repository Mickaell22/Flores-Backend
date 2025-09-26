const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { connectDatabase } = require('./src/config/database');
const routes = require('./src/routes');
const {
  generalLimiter,
  apiLimiter,
  sanitizeInput,
  securityHeaders,
  validateUserAgent,
  securityLogger
} = require('./src/middleware/security');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy para obtener IP real
app.set('trust proxy', 1);

// Seguridad y middleware básico
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Servir archivos estáticos SIN restricciones de seguridad
app.use('/uploads', (req, res, next) => {
  // Remover headers de seguridad restrictivos para imágenes
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('Origin-Agent-Cluster');
  res.removeHeader('Referrer-Policy');
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('X-DNS-Prefetch-Control');
  res.removeHeader('X-Download-Options');
  res.removeHeader('X-Permitted-Cross-Domain-Policies');
  res.removeHeader('X-XSS-Protection');
  res.removeHeader('Strict-Transport-Security');

  // Configurar headers CORS específicos para imágenes
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Headers adicionales para imágenes
    res.set('Cache-Control', 'public, max-age=86400'); // 1 día de cache
  }
}));

// Rate limiting
app.use(generalLimiter);

// Logging
app.use(morgan('combined'));
app.use(securityLogger);

// Validación y sanitización
app.use(validateUserAgent);
app.use(sanitizeInput);
app.use(securityHeaders);

// Parsing de datos
app.use(express.json({
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Flores Eternas API funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Ruta de test para imágenes
app.get('/test-image', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-image.html'));
});

// API Routes con rate limiting específico
app.use('/api', apiLimiter, routes);

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV}`);
      console.log(`Base de datos: Conectada`);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();