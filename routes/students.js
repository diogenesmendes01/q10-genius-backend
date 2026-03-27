const { Router } = require('express');
const router = Router();

const Q10_BASE = 'https://api.q10.com/v1';
const headers = () => ({
  'Api-Key': process.env.Q10_API_KEY,
  'Content-Type': 'application/json',
});

// List students
router.get('/', async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query).toString();
    const url = qs ? `${Q10_BASE}/usuarios?${qs}` : `${Q10_BASE}/usuarios`;
    const resp = await fetch(url, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch students', detail: err.message });
  }
});

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/usuarios/${req.params.id}`, { headers: headers() });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch student', detail: err.message });
  }
});

// Create student
router.post('/', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/usuarios`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(req.body),
    });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to create student', detail: err.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const resp = await fetch(`${Q10_BASE}/usuarios/${req.params.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(req.body),
    });
    res.status(resp.status).json(await resp.json());
  } catch (err) {
    res.status(502).json({ error: 'Failed to update student', detail: err.message });
  }
});

module.exports = router;
