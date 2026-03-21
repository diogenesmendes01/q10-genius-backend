const { Router } = require('express');
const router = Router();

const Q10_BASE = 'https://api.q10.com/v1';
const headers = () => ({
  'Ocp-Apim-Subscription-Key': process.env.Q10_API_KEY,
  'Content-Type': 'application/json',
});

// List payment orders
router.get('/orders', async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const url = qs ? `${Q10_BASE}/ordenesdepago?${qs}` : `${Q10_BASE}/ordenesdepago`;
    const resp = await fetch(url, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch payment orders', detail: err.message });
  }
});

// Get single payment order
router.get('/orders/:id', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/ordenesdepago/${req.params.id}`, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch payment order', detail: err.message });
  }
});

// Create payment order
router.post('/orders', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/ordenesdepago`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(req.body),
    });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to create payment order', detail: err.message });
  }
});

// List payment concepts
router.get('/concepts', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/conceptosdepago`, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch payment concepts', detail: err.message });
  }
});

module.exports = router;
