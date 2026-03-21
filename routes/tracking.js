const { Router } = require('express');
const router = Router();

/**
 * In-memory tracking store.
 * In production, replace with Redis or a database.
 *
 * Status flow: pending → opened → filled → paid
 */
const trackingStore = new Map();

// Status enum
const STATUS = {
  PENDING: 'pending',
  OPENED: 'opened',
  FILLED: 'filled',
  PAID: 'paid',
};

/**
 * GET /api/q10/tracking/:ref
 * Returns current status of an enrollment form by reference ID.
 */
router.get('/:ref', (req, res) => {
  const { ref } = req.params;

  if (!ref) {
    return res.status(400).json({ error: 'Missing reference ID' });
  }

  const entry = trackingStore.get(ref);

  if (!entry) {
    return res.json({
      ref,
      status: STATUS.PENDING,
      message: 'Link generated but form not yet opened',
      createdAt: null,
      updatedAt: null,
    });
  }

  res.json(entry);
});

/**
 * POST /api/q10/tracking
 * Create or update tracking entry.
 * Body: { ref, status, asesor?, studentName?, email? }
 */
router.post('/', (req, res) => {
  const { ref, status, asesor, studentName, email } = req.body;

  if (!ref) {
    return res.status(400).json({ error: 'Missing reference ID' });
  }

  const validStatuses = Object.values(STATUS);
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(', ')}` });
  }

  const existing = trackingStore.get(ref);
  const now = new Date().toISOString();

  const entry = {
    ref,
    status: status || existing?.status || STATUS.PENDING,
    asesor: asesor || existing?.asesor || null,
    studentName: studentName || existing?.studentName || null,
    email: email || existing?.email || null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  trackingStore.set(ref, entry);

  res.json(entry);
});

/**
 * GET /api/q10/tracking
 * List all tracked entries (admin/debug).
 */
router.get('/', (_req, res) => {
  const entries = Array.from(trackingStore.values());
  res.json({ count: entries.length, entries });
});

// Export store for use in enrollment route
router.trackingStore = trackingStore;
router.STATUS = STATUS;

module.exports = router;
