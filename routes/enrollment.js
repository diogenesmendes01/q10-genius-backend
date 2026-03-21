const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const trackingModule = require('./tracking');

const router = Router();

const Q10_BASE = 'https://api.q10.com/v1';
const headers = () => ({
  'Ocp-Apim-Subscription-Key': process.env.Q10_API_KEY,
  'Content-Type': 'application/json',
});

/**
 * Helper: call Q10 API with error handling
 */
async function q10Call(method, path, body = null) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(`${Q10_BASE}${path}`, opts);
  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg = data?.Message || data?.message || `Q10 returned ${resp.status}`;
    const err = new Error(msg);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * POST /api/q10/enrollment
 *
 * Full enrollment wizard — executes 5 steps in sequence:
 * 1. Create contact
 * 2. Register student
 * 3. Enroll in academic program
 * 4. Create matricula
 * 5. Generate payment order
 *
 * Body: {
 *   ref: "OPP-123",           // tracking reference
 *   asesor: "Juan",           // advisor name
 *   personal: {
 *     Nombres, Apellidos, Correo_electronico,
 *     Telefono, Numero_documento, Tipo_documento,
 *     Nacionalidad, Fecha_nacimiento, Genero
 *   },
 *   program: {
 *     Codigo_programa, Codigo_periodo, Codigo_sede
 *   },
 *   payment: {
 *     Concepto_pago, Valor, Fecha_vencimiento
 *   }
 * }
 */
router.post('/', async (req, res) => {
  const { ref, asesor, personal, program, payment } = req.body;

  // Validate required fields
  if (!personal || !program) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['personal', 'program'],
    });
  }

  const trackingRef = ref || `ENR-${uuidv4().slice(0, 8).toUpperCase()}`;
  const steps = [];
  let contactId, studentId, enrollmentId, matriculaId, paymentOrderId;

  try {
    // ──── Step 1: Create Contact ────
    console.log(`[enrollment:${trackingRef}] Step 1: Creating contact...`);
    const contactData = {
      Nombres: personal.Nombres,
      Apellidos: personal.Apellidos,
      Correo_electronico: personal.Correo_electronico,
      Telefono: personal.Telefono,
      Numero_documento: personal.Numero_documento,
      Tipo_documento: personal.Tipo_documento || 'CC',
      Nacionalidad: personal.Nacionalidad || '',
    };

    const contact = await q10Call('POST', '/contactos', contactData);
    contactId = contact.Codigo_contacto || contact.Id || contact.id;
    steps.push({ step: 1, name: 'contact', status: 'ok', id: contactId });
    console.log(`[enrollment:${trackingRef}] Contact created: ${contactId}`);

    // ──── Step 2: Register Student ────
    console.log(`[enrollment:${trackingRef}] Step 2: Registering student...`);
    const studentData = {
      ...contactData,
      Fecha_nacimiento: personal.Fecha_nacimiento || '',
      Genero: personal.Genero || '',
      Codigo_contacto: contactId,
    };

    const student = await q10Call('POST', '/estudiantes', studentData);
    studentId = student.Codigo_estudiante || student.Id || student.id;
    steps.push({ step: 2, name: 'student', status: 'ok', id: studentId });
    console.log(`[enrollment:${trackingRef}] Student registered: ${studentId}`);

    // ──── Step 3: Enroll in Program ────
    console.log(`[enrollment:${trackingRef}] Step 3: Enrolling in program...`);
    const enrollData = {
      Codigo_estudiante: studentId,
      Codigo_programa: program.Codigo_programa,
      Codigo_periodo: program.Codigo_periodo,
      Codigo_sede: program.Codigo_sede || '',
    };

    const enrollment = await q10Call('POST', '/inscripciones', enrollData);
    enrollmentId = enrollment.Codigo_inscripcion || enrollment.Id || enrollment.id;
    steps.push({ step: 3, name: 'enrollment', status: 'ok', id: enrollmentId });
    console.log(`[enrollment:${trackingRef}] Enrolled: ${enrollmentId}`);

    // ──── Step 4: Create Matricula ────
    console.log(`[enrollment:${trackingRef}] Step 4: Creating matricula...`);
    const matriculaData = {
      Codigo_estudiante: studentId,
      Codigo_programa: program.Codigo_programa,
      Codigo_periodo: program.Codigo_periodo,
      Codigo_sede: program.Codigo_sede || '',
      Codigo_inscripcion: enrollmentId,
    };

    const matricula = await q10Call('POST', '/matriculas', matriculaData);
    matriculaId = matricula.Codigo_matricula || matricula.Id || matricula.id;
    steps.push({ step: 4, name: 'matricula', status: 'ok', id: matriculaId });
    console.log(`[enrollment:${trackingRef}] Matricula created: ${matriculaId}`);

    // ──── Step 5: Generate Payment Order ────
    console.log(`[enrollment:${trackingRef}] Step 5: Generating payment order...`);
    const paymentData = {
      Codigo_estudiante: studentId,
      Codigo_matricula: matriculaId,
      Concepto_pago: payment?.Concepto_pago || 'Matrícula',
      Valor: payment?.Valor || 0,
      Fecha_vencimiento: payment?.Fecha_vencimiento || '',
      Estado: 'Pendiente',
    };

    const paymentOrder = await q10Call('POST', '/ordenesdepago', paymentData);
    paymentOrderId = paymentOrder.Codigo_orden || paymentOrder.Id || paymentOrder.id;
    steps.push({ step: 5, name: 'payment_order', status: 'ok', id: paymentOrderId });
    console.log(`[enrollment:${trackingRef}] Payment order: ${paymentOrderId}`);

    // ──── Update tracking ────
    trackingModule.trackingStore.set(trackingRef, {
      ref: trackingRef,
      status: trackingModule.STATUS.FILLED,
      asesor: asesor || null,
      studentName: `${personal.Nombres} ${personal.Apellidos}`,
      email: personal.Correo_electronico,
      contactId,
      studentId,
      enrollmentId,
      matriculaId,
      paymentOrderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // ──── Success response ────
    res.json({
      success: true,
      ref: trackingRef,
      message: 'Enrollment completed successfully',
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
        amount: payment?.Valor || 0,
        concept: payment?.Concepto_pago || 'Matrícula',
        dueDate: payment?.Fecha_vencimiento || '',
      },
    });
  } catch (err) {
    console.error(`[enrollment:${trackingRef}] Failed at step ${steps.length + 1}:`, err.message);

    // Update tracking with failure
    trackingModule.trackingStore.set(trackingRef, {
      ref: trackingRef,
      status: 'error',
      asesor: asesor || null,
      error: err.message,
      failedStep: steps.length + 1,
      completedSteps: steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(err.status || 502).json({
      success: false,
      ref: trackingRef,
      error: err.message,
      failedStep: steps.length + 1,
      completedSteps: steps,
      detail: err.data || null,
    });
  }
});

module.exports = router;
