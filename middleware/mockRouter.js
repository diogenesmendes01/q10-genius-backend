/**
 * Mock Router — Intercepts all Q10 API routes when MOCK_MODE is active.
 *
 * Returns realistic simulated responses with artificial delays (200-800ms)
 * so the demo feels like a real API integration.
 */

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const data = require('./mockData');

const router = Router();

// ─── Helpers ───

/** Simulate API latency (200-800ms) */
function delay() {
  const ms = 200 + Math.random() * 600;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a mock ID with prefix */
function mockId(prefix) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

/** Log with [MOCK] prefix */
function log(method, path, detail = '') {
  const ts = new Date().toISOString();
  console.log(`[MOCK] [${ts}] ${method} ${path}${detail ? ' — ' + detail : ''}`);
}

/** Find item by ID in a list (checks Codigo, Id, and id fields) */
function findById(list, id) {
  return list.find(
    (item) => item.Codigo === id || item.Id === id || item.id === id ||
              item.Codigo_contacto === id || item.Codigo_estudiante === id ||
              item.Codigo_matricula === id || item.Codigo_inscripcion === id ||
              item.Codigo_orden === id
  );
}

// ─── Catalogs (aggregated) ───

router.get('/catalogs', async (_req, res) => {
  await delay();
  log('GET', '/catalogs', `${data.programas.length} programas, ${data.periodos.length} periodos, ${data.sedes.length} sedes`);
  res.json({
    programas: data.programas,
    periodos: data.periodos,
    sedes: data.sedes,
  });
});

// ─── Contacts ───

router.get('/contacts', async (req, res) => {
  await delay();
  log('GET', '/contacts', `${data.contactos.length} items`);
  res.json(data.contactos);
});

router.get('/contacts/:id', async (req, res) => {
  await delay();
  const item = findById(data.contactos, req.params.id);
  log('GET', `/contacts/${req.params.id}`, item ? 'found' : '404');
  if (!item) return res.status(404).json({ error: 'Contacto no encontrado' });
  res.json(item);
});

router.post('/contacts', async (req, res) => {
  await delay();
  const id = mockId('CON');
  const newContact = {
    Codigo_contacto: id,
    Codigo: id,
    Id: id,
    ...req.body,
    Fecha_creacion: new Date().toISOString().slice(0, 10),
  };
  data.contactos.push(newContact);
  log('POST', '/contacts', `created ${id}`);
  res.status(201).json(newContact);
});

router.put('/contacts/:id', async (req, res) => {
  await delay();
  const idx = data.contactos.findIndex(
    (c) => c.Codigo === req.params.id || c.Codigo_contacto === req.params.id || c.Id === req.params.id
  );
  if (idx === -1) {
    log('PUT', `/contacts/${req.params.id}`, '404');
    return res.status(404).json({ error: 'Contacto no encontrado' });
  }
  data.contactos[idx] = { ...data.contactos[idx], ...req.body };
  log('PUT', `/contacts/${req.params.id}`, 'updated');
  res.json(data.contactos[idx]);
});

// ─── Students ───

router.get('/students', async (req, res) => {
  await delay();
  log('GET', '/students', `${data.estudiantes.length} items`);
  res.json(data.estudiantes);
});

router.get('/students/:id', async (req, res) => {
  await delay();
  const item = findById(data.estudiantes, req.params.id);
  log('GET', `/students/${req.params.id}`, item ? 'found' : '404');
  if (!item) return res.status(404).json({ error: 'Estudiante no encontrado' });
  res.json(item);
});

router.post('/students', async (req, res) => {
  await delay();
  const id = mockId('EST');
  const newStudent = {
    Codigo_estudiante: id,
    Codigo: id,
    Id: id,
    ...req.body,
    Estado: 'Activo',
  };
  data.estudiantes.push(newStudent);
  log('POST', '/students', `created ${id}`);
  res.status(201).json(newStudent);
});

router.put('/students/:id', async (req, res) => {
  await delay();
  const idx = data.estudiantes.findIndex(
    (s) => s.Codigo === req.params.id || s.Codigo_estudiante === req.params.id || s.Id === req.params.id
  );
  if (idx === -1) {
    log('PUT', `/students/${req.params.id}`, '404');
    return res.status(404).json({ error: 'Estudiante no encontrado' });
  }
  data.estudiantes[idx] = { ...data.estudiantes[idx], ...req.body };
  log('PUT', `/students/${req.params.id}`, 'updated');
  res.json(data.estudiantes[idx]);
});

// ─── Opportunities ───

router.get('/opportunities', async (req, res) => {
  await delay();
  log('GET', '/opportunities', `${data.oportunidades.length} items`);
  res.json(data.oportunidades);
});

router.get('/opportunities/:id', async (req, res) => {
  await delay();
  const item = findById(data.oportunidades, req.params.id);
  log('GET', `/opportunities/${req.params.id}`, item ? 'found' : '404');
  if (!item) return res.status(404).json({ error: 'Oportunidad no encontrada' });
  res.json(item);
});

router.post('/opportunities', async (req, res) => {
  await delay();
  const id = mockId('OPP');
  const newOpp = {
    Codigo: id,
    Id: id,
    ...req.body,
    Estado: req.body.Estado || 'Nueva',
    Fecha_creacion: new Date().toISOString().slice(0, 10),
  };
  data.oportunidades.push(newOpp);
  log('POST', '/opportunities', `created ${id}`);
  res.status(201).json(newOpp);
});

router.put('/opportunities/:id', async (req, res) => {
  await delay();
  const idx = data.oportunidades.findIndex(
    (o) => o.Codigo === req.params.id || o.Id === req.params.id
  );
  if (idx === -1) {
    log('PUT', `/opportunities/${req.params.id}`, '404');
    return res.status(404).json({ error: 'Oportunidad no encontrada' });
  }
  data.oportunidades[idx] = { ...data.oportunidades[idx], ...req.body };
  log('PUT', `/opportunities/${req.params.id}`, 'updated');
  res.json(data.oportunidades[idx]);
});

// ─── Financial — Payment Orders ───

router.get('/financial/orders', async (req, res) => {
  await delay();
  log('GET', '/financial/orders', `${data.ordenesDePago.length} items`);
  res.json(data.ordenesDePago);
});

router.get('/financial/orders/:id', async (req, res) => {
  await delay();
  const item = findById(data.ordenesDePago, req.params.id);
  log('GET', `/financial/orders/${req.params.id}`, item ? 'found' : '404');
  if (!item) return res.status(404).json({ error: 'Orden de pago no encontrada' });
  res.json(item);
});

router.post('/financial/orders', async (req, res) => {
  await delay();
  const id = mockId('ORD');
  const newOrder = {
    Codigo_orden: id,
    Codigo: id,
    Id: id,
    ...req.body,
    Moneda: 'GTQ',
    Estado: req.body.Estado || 'Pendiente',
    Fecha_creacion: new Date().toISOString().slice(0, 10),
  };
  data.ordenesDePago.push(newOrder);
  log('POST', '/financial/orders', `created ${id} — Q${req.body.Valor || 0}`);
  res.status(201).json(newOrder);
});

// ─── Financial — Payment Concepts ───

router.get('/financial/concepts', async (_req, res) => {
  await delay();
  log('GET', '/financial/concepts', `${data.conceptosDePago.length} items`);
  res.json(data.conceptosDePago);
});

// ─── Tracking (pass-through — tracking uses in-memory store, not Q10) ───
// Tracking routes are handled by the real tracking router, no mock needed.

// ─── Enrollment (full flow mock) ───

router.post('/enrollment', async (req, res) => {
  const { ref, asesor, personal, program, payment } = req.body;

  if (!personal || !program) {
    return res.status(400).json({
      error: 'Faltan campos requeridos',
      required: ['personal', 'program'],
    });
  }

  const trackingRef = ref || `ENR-${uuidv4().slice(0, 8).toUpperCase()}`;
  const steps = [];

  log('POST', '/enrollment', `ref=${trackingRef} — starting 5-step flow`);

  try {
    // Step 1: Create Contact
    await delay();
    const contactId = mockId('CON');
    const newContact = {
      Codigo_contacto: contactId,
      Codigo: contactId,
      Id: contactId,
      Nombres: personal.Nombres,
      Apellidos: personal.Apellidos,
      Correo_electronico: personal.Correo_electronico,
      Telefono: personal.Telefono,
      Tipo_documento: personal.Tipo_documento || 'DPI',
      Numero_documento: personal.Numero_documento,
      Nacionalidad: personal.Nacionalidad || '',
      Fecha_creacion: new Date().toISOString().slice(0, 10),
    };
    data.contactos.push(newContact);
    steps.push({ step: 1, name: 'contact', status: 'ok', id: contactId });
    log('POST', '/enrollment', `Step 1 ✓ Contact: ${contactId}`);

    // Step 2: Register Student
    await delay();
    const studentId = mockId('EST');
    const newStudent = {
      Codigo_estudiante: studentId,
      Codigo: studentId,
      Id: studentId,
      ...newContact,
      Fecha_nacimiento: personal.Fecha_nacimiento || '',
      Genero: personal.Genero || '',
      Codigo_contacto: contactId,
      Codigo_programa: program.Codigo_programa,
      Codigo_periodo: program.Codigo_periodo,
      Codigo_sede: program.Codigo_sede || '',
      Estado: 'Activo',
    };
    data.estudiantes.push(newStudent);
    steps.push({ step: 2, name: 'student', status: 'ok', id: studentId });
    log('POST', '/enrollment', `Step 2 ✓ Student: ${studentId}`);

    // Step 3: Enroll in Program
    await delay();
    const enrollmentId = mockId('INS');
    const newInscripcion = {
      Codigo_inscripcion: enrollmentId,
      Codigo: enrollmentId,
      Id: enrollmentId,
      Codigo_estudiante: studentId,
      Codigo_programa: program.Codigo_programa,
      Codigo_periodo: program.Codigo_periodo,
      Codigo_sede: program.Codigo_sede || '',
      Estado: 'Confirmada',
      Fecha_creacion: new Date().toISOString().slice(0, 10),
    };
    data.inscripciones.push(newInscripcion);
    steps.push({ step: 3, name: 'enrollment', status: 'ok', id: enrollmentId });
    log('POST', '/enrollment', `Step 3 ✓ Inscription: ${enrollmentId}`);

    // Step 4: Create Matricula
    await delay();
    const matriculaId = mockId('MAT');
    const newMatricula = {
      Codigo_matricula: matriculaId,
      Codigo: matriculaId,
      Id: matriculaId,
      Codigo_estudiante: studentId,
      Codigo_programa: program.Codigo_programa,
      Codigo_periodo: program.Codigo_periodo,
      Codigo_sede: program.Codigo_sede || '',
      Codigo_inscripcion: enrollmentId,
      Estado: 'Activa',
      Fecha_creacion: new Date().toISOString().slice(0, 10),
    };
    data.matriculas.push(newMatricula);
    steps.push({ step: 4, name: 'matricula', status: 'ok', id: matriculaId });
    log('POST', '/enrollment', `Step 4 ✓ Matricula: ${matriculaId}`);

    // Step 5: Generate Payment Order
    await delay();
    const paymentOrderId = mockId('ORD');
    const paymentValue = payment?.Valor || 1200;
    const newOrder = {
      Codigo_orden: paymentOrderId,
      Codigo: paymentOrderId,
      Id: paymentOrderId,
      Codigo_estudiante: studentId,
      Codigo_matricula: matriculaId,
      Concepto_pago: payment?.Concepto_pago || 'Matrícula',
      Valor: paymentValue,
      Moneda: 'GTQ',
      Estado: 'Pendiente',
      Fecha_creacion: new Date().toISOString().slice(0, 10),
      Fecha_vencimiento: payment?.Fecha_vencimiento || '',
      Fecha_pago: null,
    };
    data.ordenesDePago.push(newOrder);
    steps.push({ step: 5, name: 'payment_order', status: 'ok', id: paymentOrderId });
    log('POST', '/enrollment', `Step 5 ✓ Payment order: ${paymentOrderId} — Q${paymentValue}`);

    log('POST', '/enrollment', `✅ Complete — ref=${trackingRef}`);

    res.json({
      success: true,
      ref: trackingRef,
      message: 'Matrícula completada exitosamente (modo demo)',
      ids: {
        contact: contactId,
        student: studentId,
        enrollment: enrollmentId,
        matricula: matriculaId,
        paymentOrder: paymentOrderId,
      },
      steps,
      paymentDetails: {
        orderId: paymentOrderId,
        amount: paymentValue,
        concept: payment?.Concepto_pago || 'Matrícula',
        dueDate: payment?.Fecha_vencimiento || '',
      },
    });
  } catch (err) {
    log('POST', '/enrollment', `❌ Error at step ${steps.length + 1}: ${err.message}`);
    res.status(500).json({
      success: false,
      ref: trackingRef,
      error: err.message,
      failedStep: steps.length + 1,
      completedSteps: steps,
    });
  }
});

// ─── Generic Q10 Proxy catch-all (mock) ───
// Handles any Q10 path that isn't explicitly routed above.
// Maps common Q10 API paths to mock data.

router.all('/*', async (req, res) => {
  await delay();
  const path = req.params[0] || req.path;
  log(req.method, path, 'generic proxy handler');

  // Map known Q10 API endpoints
  const endpointMap = {
    'programasacademicos': data.programas,
    'periodosacademicos': data.periodos,
    'sedes': data.sedes,
    'contactos': data.contactos,
    'estudiantes': data.estudiantes,
    'oportunidades': data.oportunidades,
    'ordenesdepago': data.ordenesDePago,
    'conceptosdepago': data.conceptosDePago,
    'inscripciones': data.inscripciones,
    'matriculas': data.matriculas,
    'matriculasprogramas': data.matriculas,
  };

  // Extract the base endpoint (first segment of the path)
  const segments = path.replace(/^\//, '').split('/');
  const baseEndpoint = segments[0]?.toLowerCase();
  const resourceId = segments[1];

  const dataset = endpointMap[baseEndpoint];

  if (!dataset) {
    return res.json([]);
  }

  if (req.method === 'GET') {
    if (resourceId) {
      const item = findById(dataset, resourceId);
      if (!item) return res.status(404).json({ error: 'Recurso no encontrado' });
      return res.json(item);
    }
    return res.json(dataset);
  }

  if (req.method === 'POST') {
    const id = mockId(baseEndpoint.slice(0, 3).toUpperCase());
    const newItem = { Codigo: id, Id: id, ...req.body };
    dataset.push(newItem);
    return res.status(201).json(newItem);
  }

  if (req.method === 'PUT') {
    if (!resourceId) return res.status(400).json({ error: 'ID requerido' });
    const idx = dataset.findIndex(
      (item) => item.Codigo === resourceId || item.Id === resourceId
    );
    if (idx === -1) return res.status(404).json({ error: 'Recurso no encontrado' });
    dataset[idx] = { ...dataset[idx], ...req.body };
    return res.json(dataset[idx]);
  }

  res.json({ message: 'OK (mock)' });
});

module.exports = router;
