const { Router } = require('express');
const router = Router();

const Q10_BASE = 'https://api.q10.com/v1';
const headers = () => ({
  'Api-Key': process.env.Q10_API_KEY,
  'Content-Type': 'application/json',
});

// List contacts
router.get('/', async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const url = qs ? `${Q10_BASE}/contactos?${qs}` : `${Q10_BASE}/contactos`;
    const resp = await fetch(url, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch contacts', detail: err.message });
  }
});

// Get single contact
router.get('/:id', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/contactos/${req.params.id}`, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch contact', detail: err.message });
  }
});

// Create contact
router.post('/', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/contactos`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(req.body),
    });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to create contact', detail: err.message });
  }
});

// Update contact
router.put('/:id', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/contactos/${req.params.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(req.body),
    });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to update contact', detail: err.message });
  }
});

module.exports = router;
