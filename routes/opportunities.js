const { Router } = require('express');
const router = Router();

const Q10_BASE = 'https://api.q10.com/v1';
const headers = () => ({
  'Ocp-Apim-Subscription-Key': process.env.Q10_API_KEY,
  'Content-Type': 'application/json',
});

// List opportunities
router.get('/', async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const url = qs ? `${Q10_BASE}/oportunidades?${qs}` : `${Q10_BASE}/oportunidades`;
    const resp = await fetch(url, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch opportunities', detail: err.message });
  }
});

// Get single opportunity
router.get('/:id', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/oportunidades/${req.params.id}`, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch opportunity', detail: err.message });
  }
});

// Create opportunity
router.post('/', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/oportunidades`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(req.body),
    });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to create opportunity', detail: err.message });
  }
});

// Update opportunity
router.put('/:id', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/oportunidades/${req.params.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(req.body),
    });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to update opportunity', detail: err.message });
  }
});

module.exports = router;
