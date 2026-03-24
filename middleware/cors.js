const cors = require('cors');

const DEFAULT_ORIGINS = [
  'https://geniusidiomas.com',
  'https://www.geniusidiomas.com',
  'https://web.whatsapp.com',
];

function buildCorsMiddleware() {
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const allowedOrigins = [...new Set([...DEFAULT_ORIGINS, ...envOrigins])];

  return cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);

      // Allow chrome-extension origins
      if (origin.startsWith('chrome-extension://')) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Q10-Key', 'Ocp-Apim-Subscription-Key'],
    credentials: true,
    maxAge: 86400,
  });
}

module.exports = buildCorsMiddleware;
