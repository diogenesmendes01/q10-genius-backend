require('dotenv').config();

const express = require('express');
const buildCors = require('./middleware/cors');
const rateLimiter = require('./middleware/rateLimit');

const contactsRouter = require('./routes/contacts');
const studentsRouter = require('./routes/students');
const opportunitiesRouter = require('./routes/opportunities');
const enrollmentRouter = require('./routes/enrollment');
const financialRouter = require('./routes/financial');
const trackingRouter = require('./routes/tracking');

const app = express();
const PORT = process.env.PORT || 3140;
const Q10_BASE = 'https://api.q10.com/v1';

// ─── Mock Mode Detection ───
const MOCK_MODE = process.env.MOCK_MODE === 'true' || !process.env.Q10_API_KEY;

// --------------- Middleware ---------------
app.use(buildCors());
app.use(rateLimiter);
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl}`);
  next();
});

// --------------- Health ---------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'q10-genius-backend',
    mode: MOCK_MODE ? 'mock' : 'live',
    timestamp: new Date().toISOString(),
  });
});

// --------------- Mock Mode Routes ---------------
if (MOCK_MODE) {
  const mockRouter = require('./middleware/mockRouter');

  // Tracking still uses real in-memory store (no Q10 dependency)
  app.use('/api/q10/tracking', trackingRouter);

  // Everything else under /api/q10 goes through mock
  app.use('/api/q10', mockRouter);
} else {
  // --------------- Live Mode Routes ---------------

  // Named routes
  app.use('/api/q10/contacts', contactsRouter);
  app.use('/api/q10/students', studentsRouter);
  app.use('/api/q10/opportunities', opportunitiesRouter);
  app.use('/api/q10/enrollment', enrollmentRouter);
  app.use('/api/q10/financial', financialRouter);
  app.use('/api/q10/tracking', trackingRouter);

  // Catalogs (aggregated)
  app.get('/api/q10/catalogs', async (req, res) => {
    try {
      const headers = {
        'Ocp-Apim-Subscription-Key': process.env.Q10_API_KEY,
        'Content-Type': 'application/json',
      };

      const [programas, periodos, sedes] = await Promise.all([
        fetch(`${Q10_BASE}/programasacademicos`, { headers }).then((r) => r.json()),
        fetch(`${Q10_BASE}/periodosacademicos`, { headers }).then((r) => r.json()),
        fetch(`${Q10_BASE}/sedes`, { headers }).then((r) => r.json()),
      ]);

      res.json({ programas, periodos, sedes });
    } catch (err) {
      console.error('[catalogs] Error:', err.message);
      res.status(502).json({ error: 'Failed to fetch catalogs from Q10' });
    }
  });

  // Webhook
  app.post('/api/q10/webhook/form-completed', (req, res) => {
    const payload = req.body;
    console.log('[webhook] Form completed:', JSON.stringify(payload));
    res.json({ received: true, timestamp: new Date().toISOString() });
  });

  // Generic Q10 Proxy
  app.all('/api/q10/*', async (req, res) => {
    const q10Path = req.params[0];
    if (!q10Path) return res.status(400).json({ error: 'Missing Q10 path' });

    const url = `${Q10_BASE}/${q10Path}`;
    const headers = {
      'Ocp-Apim-Subscription-Key': process.env.Q10_API_KEY,
      'Content-Type': 'application/json',
    };

    try {
      const fetchOpts = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        fetchOpts.body = JSON.stringify(req.body);
      }

      const qs = new URLSearchParams(req.query).toString();
      const fullUrl = qs ? `${url}?${qs}` : url;

      const upstream = await fetch(fullUrl, fetchOpts);
      const contentType = upstream.headers.get('content-type') || '';

      res.status(upstream.status);

      if (contentType.includes('application/json')) {
        const data = await upstream.json();
        res.json(data);
      } else {
        const text = await upstream.text();
        res.send(text);
      }
    } catch (err) {
      console.error(`[proxy] ${req.method} ${url} →`, err.message);
      res.status(502).json({ error: 'Q10 API proxy error', detail: err.message });
    }
  });
}

// --------------- Webhook (available in both modes) ---------------
if (MOCK_MODE) {
  app.post('/api/q10/webhook/form-completed', (req, res) => {
    console.log('[MOCK] [webhook] Form completed:', JSON.stringify(req.body));
    res.json({ received: true, timestamp: new Date().toISOString() });
  });
}

// --------------- 404 ---------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --------------- Error handler ---------------
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// --------------- Start ---------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 q10-genius-backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

  if (MOCK_MODE) {
    console.log(`   🎭 MOCK MODE: Active — using simulated data`);
    console.log(`   All API responses are simulated. No Q10 API key required.`);
  } else {
    console.log(`   🔑 LIVE MODE: Connected to Q10 API`);
    console.log(`   Q10 API Key: ✓ configured`);
  }
});
