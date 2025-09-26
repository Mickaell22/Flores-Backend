const rateLimit = require('express-rate-limit');

// Rate limiting para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP (aumentado para desarrollo)
  message: {
    error: 'Demasiadas peticiones. Intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Aumentado para desarrollo
  message: {
    error: 'Límite de API excedido. Intenta de nuevo más tarde.'
  }
});

// Middleware para sanitizar entradas
const sanitizeInput = (req, res, next) => {
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Sanitizar query
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  next();
};

function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remover caracteres peligrosos
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// Middleware para headers de seguridad adicionales
const securityHeaders = (req, res, next) => {
  // Prevenir sniffing de contenido
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevenir XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // HSTS (solo en HTTPS)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // CSP básico - permitir imágenes y datos
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: http://localhost:3000 http://localhost:5000; media-src 'self'");

  next();
};

// Middleware para validar user agent
const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');

  // Permitir requests sin User-Agent desde el frontend de desarrollo
  if (!userAgent) {
    console.log('Request without User-Agent, allowing in development');
    return next();
  }

  if (userAgent.length < 5) {
    return res.status(400).json({
      error: 'User-Agent requerido'
    });
  }

  // Bloquear bots conocidos maliciosos
  const blockedAgents = [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'zap'
  ];

  if (blockedAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return res.status(403).json({
      error: 'Acceso denegado'
    });
  }

  next();
};

// Middleware para logging de seguridad
const securityLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log después de la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id || null
    };

    // Log requests sospechosos
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('Suspicious request:', logData);
    }

    // Log todos los requests en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', logData);
    }
  });

  next();
};

module.exports = {
  authLimiter,
  generalLimiter,
  apiLimiter,
  sanitizeInput,
  securityHeaders,
  validateUserAgent,
  securityLogger
};