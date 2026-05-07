const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// ============================================================
// CONFIGURACIÓN GLOBAL
// ============================================================
setGlobalOptions({ region: "us-central1" });

const app = initializeApp();
const db = getFirestore(app, "formalizate-app-prod");

// URLs de los dashboards (configurables via env)
const CUSTOMER_DASHBOARD_URL = process.env.CUSTOMER_DASHBOARD_URL || "https://dash.formalizate.app";
const INVESTOR_DASHBOARD_URL = process.env.INVESTOR_DASHBOARD_URL || "https://investors.formalizate.app";

// ============================================================
// EMAIL
// ============================================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "smartbizservicesrd@gmail.com",
    pass: process.env.ZOHO_PASSWORD,
  },
});

async function sendEmail(mailOptions) {
  try {
    const info = await transporter.sendMail({
      ...mailOptions,
      from: '"Formalízate.app" <smartbizservicesrd@gmail.com>',
      replyTo: "ventas@formalizate.app",
      bcc: "jmestrella@formalizate.app",
    });
    console.log("Correo enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error enviando correo:", error);
    return false;
  }
}

// ============================================================
// HELPERS: ORDER ID
// ============================================================
const PRECIOS_OFICIALES = {
  "Starter Pro": "27,900",
  "Essential 360": "41,900",
  "Unlimitech": "64,900",
};

function getPrecio(plan, montoOriginal) {
  if (montoOriginal && montoOriginal !== "0" && montoOriginal !== undefined) return montoOriginal;
  if (plan && PRECIOS_OFICIALES[plan]) return PRECIOS_OFICIALES[plan];
  return "Consultar";
}

function generateOrderId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 4; i++) random += chars.charAt(Math.floor(Math.random() * chars.length));
  return `ORD-${year}${month}-${random}`;
}

async function orderIdExists(orderId) {
  const snapshot = await db.collection("ventas").where("orderId", "==", orderId).limit(1).get();
  return !snapshot.empty;
}

async function generateUniqueOrderId() {
  for (let i = 0; i < 10; i++) {
    const id = generateOrderId();
    if (!(await orderIdExists(id))) return id;
  }
  throw new Error("No se pudo generar ID único");
}

// ============================================================
// HELPERS: JWT (compartido entre customers e investors)
// ============================================================
function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLength);
  return Buffer.from(padded, "base64").toString("utf8");
}

function signToken(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerPart}.${payloadPart}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${signature}`;
}

function verifyToken(token, secret) {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signature] = parts;
  const data = `${headerPart}.${payloadPart}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    return JSON.parse(base64UrlDecode(payloadPart));
  } catch {
    return null;
  }
}

// ============================================================
// HELPERS: PIN (para clientes)
// ============================================================
const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin ambiguos: 0, O, 1, I

function generatePin(length = 6) {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += PIN_CHARS.charAt(Math.floor(Math.random() * PIN_CHARS.length));
  }
  return pin;
}

function hashPin(pin) {
  return crypto.createHash("sha256").update(pin.toUpperCase().trim()).digest("hex");
}

// ============================================================
// TEMPLATES DE EMAIL
// ============================================================
function getTemplate(type, data) {
  const { nombre, plan, monto, orderId, dashboardUrl, dashboardPin, hitoLabel } = data;
  const styles = {
    container: "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;",
    header: "background-color: #1D3557; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;",
    btn: "background-color: #E63A47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px;",
    btnBlue: "background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;",
    pin: "letter-spacing: 8px; font-size: 28px; font-weight: bold; color: #1D3557; background: #f0f4ff; border: 2px dashed #1D3557; padding: 12px 24px; border-radius: 8px; display: inline-block;",
  };

  const commonBody = `
    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
      <p>Hola <strong>${nombre}</strong>,</p>
      <div style="background: #f4f4f4; padding: 10px; text-align: center; margin: 15px 0; font-weight: bold; color: #1D3557;">
        Orden: ${orderId}
      </div>
      <table style="width:100%; margin-bottom: 20px;">
        <tr><td>Servicio:</td><td style="text-align:right"><strong>${plan}</strong></td></tr>
        <tr><td>Monto:</td><td style="text-align:right"><strong>RD$ ${monto}</strong></td></tr>
      </table>
  `;

  const dashboardSection = dashboardUrl && dashboardPin ? `
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-weight: bold; color: #1D3557;">📊 Tu Panel de Seguimiento</p>
    <p style="font-size: 13px; color: #555;">Accede en tiempo real al estado de tu expediente con el enlace y PIN que te asignamos:</p>
    <div style="text-align: center; margin: 16px 0;">
      <a href="${dashboardUrl}" style="${styles.btnBlue}">Ver mi Expediente</a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #888; margin-bottom: 4px;">Tu PIN de acceso (guárdalo, es único):</p>
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="${styles.pin}">${dashboardPin}</span>
    </div>
    <p style="font-size: 11px; color: #aaa; text-align: center;">Si alguien más te pidió este PIN, no lo compartas. Es personal e intransferible.</p>
  ` : "";

  const templates = {
    orden_recibida: {
      subject: "Orden Recibida - Validando Comprobante",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>🔍 Validando tu Orden</h2></div>${commonBody}<div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; color: #856404;">Hemos recibido tu comprobante. Nuestro equipo lo está verificando manualmente.</div>${dashboardSection}</div></div>`,
    },
    pago_exitoso: {
      subject: "✅ Pago Confirmado - Iniciamos labores",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>¡Pago Confirmado!</h2></div>${commonBody}<p>Tu pago ha sido procesado exitosamente. Ya hemos iniciado tu expediente legal.</p>${dashboardSection}</div></div>`,
    },
    transferencia_validada: {
      subject: "✅ Transferencia Validada",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>Pago Aprobado</h2></div>${commonBody}<p>Hemos confirmado tu transferencia bancaria.</p><center><a href="${dashboardUrl || "#"}" style="${styles.btn}">Ver Estatus</a></center></div></div>`,
    },
    onapi_listo: {
      subject: "🚀 Nombre Comercial Aprobado (ONAPI)",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>¡Nombre Aprobado!</h2></div><div style="padding: 20px; border: 1px solid #ddd;"><p>Buenas noticias, <strong>${nombre}</strong>.</p><p>ONAPI ha concedido oficialmente el nombre de tu empresa.</p><center><a href="${dashboardUrl || "#"}" style="${styles.btn}">Ver Documento</a></center></div></div>`,
    },
    completado: {
      subject: "🎉 ¡Tu Empresa está Lista!",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>¡Misión Cumplida!</h2></div><div style="padding: 20px; border: 1px solid #ddd;"><p>Felicidades, <strong>${nombre}</strong>.</p><p>El proceso ha finalizado. Descarga tu RNC y Registro Mercantil.</p><center><a href="${dashboardUrl || "#"}" style="${styles.btn}">Descargar Todo</a></center></div></div>`,
    },
    hito_listo: {
      subject: `✅ Actualización: ${hitoLabel || "Nuevo hito completado"}`,
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>✅ Actualización de Expediente</h2></div>${commonBody}<div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; color: #2e7d32; margin-bottom: 16px;"><strong>${hitoLabel || "Hito completado"}</strong></div><p style="color:#555;">Continuamos avanzando con tu expediente. Te notificaremos en cada etapa.</p><center><a href="${dashboardUrl || "#"}" style="${styles.btnBlue}">Ver Estado de mi Expediente</a></center>${dashboardSection}</div></div>`,
    },
  };

  return templates[type];
}

// ============================================================
// FIRESTORE TRIGGER: NUEVA VENTA
// ============================================================
exports.onVentaCreate = onDocumentCreated(
  {
    document: "ventas/{ventaId}",
    database: "formalizate-app-prod",
    region: "us-central1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    const firestoreId = event.params.ventaId;

    try {
      // --- Generar Order ID ---
      const orderId = await generateUniqueOrderId();

      // --- Generar PIN + Token para el dashboard del cliente ---
      const customerSecret = process.env.CUSTOMER_MAGIC_SECRET;
      let dashboardPin = null;
      let dashboardLink = null;

      if (customerSecret) {
        dashboardPin = generatePin();
        const pinHash = hashPin(dashboardPin);
        const dashboardToken = signToken(
          { saleId: firestoreId, role: "customer", issuedAt: Math.floor(Date.now() / 1000) },
          customerSecret
        );
        dashboardLink = `${CUSTOMER_DASHBOARD_URL}/?token=${dashboardToken}`;

        await snap.ref.update({
          orderId,
          firestoreId,
          fechaCreacion: FieldValue.serverTimestamp(),
          pinHash,
        });
      } else {
        console.warn("CUSTOMER_MAGIC_SECRET no configurada — dashboard PIN no generado");
        await snap.ref.update({
          orderId,
          firestoreId,
          fechaCreacion: FieldValue.serverTimestamp(),
        });
      }

      // --- Datos para el email ---
      const email = data.email || data.userEmail || data.applicant?.email;
      let nombre = "Cliente";
      if (data.applicant?.names) {
        nombre = `${data.applicant.names} ${data.applicant.surnames || ""}`.trim();
      } else if (data.nombre) {
        nombre = data.nombre;
      }

      const plan = data.plan || data.packageName || "Servicio";
      const monto = getPrecio(plan, data.monto || data.totalAmount);
      const metodoRaw = (data.metodoPago || data.paymentMethod || "").toLowerCase();
      const templateType =
        metodoRaw.includes("paypal") || metodoRaw.includes("card") || data.paymentStatus === "paid"
          ? "pago_exitoso"
          : "orden_recibida";

      if (email) {
        const template = getTemplate(templateType, {
          nombre,
          plan,
          monto,
          orderId,
          dashboardUrl: dashboardLink,
          dashboardPin,
        });
        if (template) {
          await sendEmail({ to: email, subject: template.subject, html: template.html });
        }
      }
    } catch (error) {
      console.error("Error en onVentaCreate:", error);
    }
  }
);

// ============================================================
// MAPA DE HITOS — para emails de progreso personalizados
// ============================================================
const HITO_LABELS = {
  estatutos_listos:  "Estatutos Sociales Listos",
  mercantil_listo:   "Registro Mercantil Completado",
  rnc_listo:         "RNC Asignado (DGII)",
  tss_listo:         "Registro TSS / MIT Completado",
  firma_lista:       "Firma Digital Lista",
  dominio_listo:     "Dominio + Correos Activos",
  dga_listo:         "Registro DGA Completado",
  proveedor_listo:   "Registro Proveedor del Estado Completado",
};

// ============================================================
// FIRESTORE TRIGGER: VENTA ACTUALIZADA
// ============================================================
exports.onVentaUpdate = onDocumentUpdated(
  {
    document: "ventas/{ventaId}",
    database: "formalizate-app-prod",
    region: "us-central1",
  },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    const statusChanged    = before.status !== after.status;
    const payStatusChanged = before.paymentStatus !== after.paymentStatus;
    if (!statusChanged && !payStatusChanged) return null;

    const statusNew    = after.status;
    const payStatusNew = after.paymentStatus;
    const payStatusOld = before.paymentStatus;

    let templateType = null;
    let hitoLabel    = null;

    // 1. Pago validado manualmente (transferencia bancaria verificada)
    if (payStatusChanged && payStatusNew === "validated") {
      templateType = "transferencia_validada";

    // 2. Pago confirmado (cualquier método)
    } else if (payStatusChanged && payStatusOld !== "paid" && payStatusNew === "paid") {
      templateType = "pago_exitoso";

    // 3. Admin marcó "Pago confirmado" (status + paymentStatus en una sola escritura)
    } else if (statusNew === "pagado") {
      templateType = "pago_exitoso";

    // 4. ONAPI aprobado
    } else if (statusNew === "onapi_listo") {
      templateType = "onapi_listo";

    // 5. Proceso completado
    } else if (statusNew === "completado") {
      templateType = "completado";

    // 6. Hitos intermedios — cada uno con su propio label
    } else if (HITO_LABELS[statusNew]) {
      templateType = "hito_listo";
      hitoLabel    = HITO_LABELS[statusNew];
    }

    if (!templateType) return null;

    const email = after.email || after.userEmail || after.applicant?.email;
    let nombre = "Cliente";
    if (after.applicant?.names) {
      nombre = `${after.applicant.names} ${after.applicant.surnames || ""}`.trim();
    } else if (after.nombre) {
      nombre = after.nombre;
    }

    const orderId = after.orderId || event.params.ventaId;
    const plan = after.plan || after.packageName;
    const monto = getPrecio(plan, after.monto || after.totalAmount);
    const dashboardUrl = after.dashboardLink || `${CUSTOMER_DASHBOARD_URL}`;

    if (email) {
      const template = getTemplate(templateType, { nombre, plan, monto, orderId, dashboardUrl, hitoLabel });
      if (template) {
        await sendEmail({ to: email, subject: template.subject, html: template.html });
      }
    }
  }
);

// ============================================================
// CUSTOMER DASHBOARD API
// ============================================================

/**
 * Verifica token JWT + PIN del cliente.
 * Retorna { saleId, saleData } si válido, lanza Error si no.
 */
async function verifyCustomerAccess(token, pin) {
  const secret = process.env.CUSTOMER_MAGIC_SECRET;
  if (!secret) throw new Error("Configuración del servidor incompleta");

  const payload = verifyToken(String(token), secret);
  if (!payload || payload.role !== "customer" || !payload.saleId) {
    throw new Error("Enlace de acceso inválido");
  }

  const saleRef = db.collection("ventas").doc(payload.saleId);
  const saleDoc = await saleRef.get();
  if (!saleDoc.exists) throw new Error("Expediente no encontrado");

  const saleData = saleDoc.data();
  if (!saleData.pinHash || hashPin(String(pin)) !== saleData.pinHash) {
    throw new Error("PIN incorrecto");
  }

  return { saleId: payload.saleId, saleData };
}

/** POST { token, pin } → retorna datos del expediente */
exports.customerDashboard = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { token, pin } = req.body || {};
    if (!token || !pin) {
      return res.status(400).json({ error: "Token y PIN son requeridos" });
    }

    try {
      const { saleId, saleData } = await verifyCustomerAccess(token, pin);
      // Excluir campos internos de la respuesta
      const { pinHash, ...safeData } = saleData;
      void pinHash; // marcar como usado
      return res.json({ id: saleId, ...safeData });
    } catch (err) {
      console.warn("customerDashboard acceso denegado:", err.message);
      return res.status(401).json({ error: err.message || "Acceso inválido" });
    }
  }
);

/** POST { token, pin, action: 'list' | 'add', message? } → comentarios */
exports.customerComments = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { token, pin, action, message } = req.body || {};
    if (!token || !pin || !action) {
      return res.status(400).json({ error: "Parámetros faltantes" });
    }

    try {
      const { saleId } = await verifyCustomerAccess(token, pin);
      const commentsRef = db.collection("ventas").doc(saleId).collection("comments");

      if (action === "list") {
        const snapshot = await commentsRef.orderBy("createdAt", "desc").limit(20).get();
        const comments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Serializar Timestamp de Firestore a ISO string
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
        }));
        return res.json(comments);
      }

      if (action === "add") {
        if (!message?.trim()) {
          return res.status(400).json({ error: "El mensaje no puede estar vacío" });
        }
        await commentsRef.add({
          message: message.trim(),
          authorRole: "customer",
          createdAt: FieldValue.serverTimestamp(),
        });
        return res.json({ ok: true });
      }

      return res.status(400).json({ error: "Acción no reconocida" });
    } catch (err) {
      console.warn("customerComments acceso denegado:", err.message);
      return res.status(401).json({ error: err.message || "Acceso inválido" });
    }
  }
);

// ============================================================
// INVESTOR DASHBOARD API
// ============================================================

const UTILIDAD_NETA_POR_PLAN = {
  "Starter Pro": 8289,
  "Essential 360": 14053,
  "Unlimitech": 25945,
};

const getActiveInvestors = () =>
  (process.env.INVESTOR_ACTIVE_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

/** GET con header X-Investor-Token → retorna métricas agregadas */
exports.investorsDashboard = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const magicToken = req.headers["x-investor-token"] || req.query.token;
    if (!magicToken) return res.status(401).json({ error: "Acceso inválido o expirado." });

    const secret = process.env.INVESTOR_MAGIC_SECRET;
    if (!secret) return res.status(500).json({ error: "Error de configuración del servidor" });

    const payload = verifyToken(String(magicToken), secret);
    const email = (payload?.email || "").toLowerCase().trim();
    if (!payload || payload.role !== "investor" || !getActiveInvestors().includes(email)) {
      return res.status(401).json({ error: "Acceso inválido o expirado." });
    }

    try {
      const snapshot = await db.collection("ventas").get();

      if (snapshot.empty) {
        return res.json({
          totalVentas: 0, ingresosBrutos: 0, utilidadNetaTotal: 0,
          ventasPorPlan: {}, progresoPrimerasVentas: { actual: 0, meta: 120, porcentaje: 0 },
          comision25: 0, fechaUltimaVenta: null,
        });
      }

      let totalVentas = 0, ingresosBrutos = 0, utilidadNetaTotal = 0;
      const ventasPorPlan = {};
      let fechaUltimaVenta = null;

      snapshot.forEach((doc) => {
        const d = doc.data();
        const isPaid = d.status === "pagado" || d.paymentStatus === "paid" || d.paymentStatus === "validated";
        if (!isPaid) return;

        totalVentas++;
        const plan = d.plan || d.packageName || "Unknown";
        let monto = 0;
        if (d.monto) {
          monto = parseFloat(String(d.monto).replace(/[^\d]/g, "")) || 0;
        } else if (d.totalAmount) {
          monto = typeof d.totalAmount === "number" ? d.totalAmount : parseFloat(String(d.totalAmount).replace(/[^\d]/g, "")) || 0;
        } else {
          monto = { "Starter Pro": 27900, "Essential 360": 41900, "Unlimitech": 64900 }[plan] || 0;
        }

        ingresosBrutos += monto;
        ventasPorPlan[plan] = (ventasPorPlan[plan] || 0) + 1;
        if (UTILIDAD_NETA_POR_PLAN[plan]) utilidadNetaTotal += UTILIDAD_NETA_POR_PLAN[plan];

        const fecha = d.fechaCreacion?.toDate ? d.fechaCreacion.toDate() : d.fechaCreacion ? new Date(d.fechaCreacion) : null;
        if (fecha && (!fechaUltimaVenta || fecha > fechaUltimaVenta)) fechaUltimaVenta = fecha;
      });

      return res.json({
        totalVentas,
        ingresosBrutos: Math.round(ingresosBrutos),
        utilidadNetaTotal: Math.round(utilidadNetaTotal),
        ventasPorPlan,
        progresoPrimerasVentas: {
          actual: totalVentas,
          meta: 120,
          porcentaje: Math.min((totalVentas / 120) * 100, 100),
        },
        comision25: Math.round(utilidadNetaTotal * 0.25),
        fechaUltimaVenta: fechaUltimaVenta ? fechaUltimaVenta.toISOString() : null,
      });
    } catch (error) {
      console.error("Error en investorsDashboard:", error);
      return res.status(500).json({ error: "Error interno al calcular métricas" });
    }
  }
);

/** POST { email, name } → genera magic link para inversionista */
exports.generateInvestorMagicLink = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const secret = process.env.INVESTOR_MAGIC_SECRET;
    if (!secret) return res.status(500).json({ error: "Error de configuración del servidor" });

    const { email, name } = req.body || {};
    if (!email || !name) return res.status(400).json({ error: "email y name son requeridos" });

    const payload = { email, name, role: "investor", issuedAt: Math.floor(Date.now() / 1000) };
    const token = signToken(payload, secret);
    const url = `${INVESTOR_DASHBOARD_URL}/?token=${token}`;
    return res.json({ url, token });
  }
);

/** GET ?token=... → verifica si el token de inversionista es válido */
exports.verifyInvestorMagicToken = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    const token = req.query.token || req.body?.token;
    if (!token) return res.status(400).json({ valid: false, error: "Token faltante" });

    const secret = process.env.INVESTOR_MAGIC_SECRET;
    if (!secret) return res.status(500).json({ error: "Error de configuración del servidor" });

    const payload = verifyToken(String(token), secret);
    const email = (payload?.email || "").toLowerCase().trim();
    if (!payload || payload.role !== "investor" || !getActiveInvestors().includes(email)) {
      return res.json({ valid: false });
    }
    return res.json({ valid: true, investor: { email: payload.email, name: payload.name, role: payload.role } });
  }
);

// ============================================================
// ADMIN DASHBOARD API
// ============================================================

const ADMIN_DASHBOARD_URL = process.env.ADMIN_DASHBOARD_URL || "https://admin.formalizate.app";

/**
 * Verifica que el x-admin-token header sea válido.
 * Retorna el payload si OK, lanza Error si no.
 */
function verifyAdminAccess(req) {
  const token = req.headers["x-admin-token"];
  if (!token) throw new Error("Token de admin requerido");

  const secret = process.env.ADMIN_MAGIC_SECRET;
  if (!secret) throw new Error("Configuración del servidor incompleta");

  const payload = verifyToken(String(token), secret);
  if (!payload || payload.role !== "admin") throw new Error("Token inválido o expirado");

  // Verificar expiración
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("Token expirado — solicita un nuevo enlace");
  }

  // Verificar email en lista de admins
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = (payload.email || "").toLowerCase();
  if (!adminEmails.includes(email)) throw new Error("Email no autorizado como admin");

  return payload;
}

/** POST { email } → genera magic link y lo envía por email */
exports.adminSendMagicLink = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email requerido" });

    const secret = process.env.ADMIN_MAGIC_SECRET;
    if (!secret) return res.status(500).json({ error: "Error de configuración del servidor" });

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const normalizedEmail = email.toLowerCase().trim();
    if (!adminEmails.includes(normalizedEmail)) {
      // No revelar si el email es válido o no (seguridad)
      console.warn(`adminSendMagicLink: email no autorizado: ${normalizedEmail}`);
      return res.json({ sent: true }); // Respuesta genérica
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      email: normalizedEmail,
      role: "admin",
      issuedAt: now,
      exp: now + 24 * 60 * 60, // 24 horas
    };
    const token = signToken(payload, secret);
    const magicUrl = `${ADMIN_DASHBOARD_URL}/?token=${token}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "🔐 Acceso al Admin Panel — Formalízate",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1D3557; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">🔐 Control Center</h2>
            <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Formalízate Admin</p>
          </div>
          <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hola,</p>
            <p>Solicitaste acceso al panel de administración. Haz clic en el botón para entrar:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${magicUrl}"
                 style="background: #E63A47; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Acceder al Admin Panel
              </a>
            </div>
            <p style="font-size: 13px; color: #666;">
              Este enlace es válido por <strong>24 horas</strong>. Si no solicitaste este acceso, ignora este correo.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #aaa; text-align: center;">
              Formalízate · SBServicesRD · Acceso restringido
            </p>
          </div>
        </div>
      `,
    });

    console.log(`adminSendMagicLink: enlace enviado a ${normalizedEmail}`);
    return res.json({ sent: true });
  }
);

/** POST { token } → verifica token de admin, retorna { email, name } */
exports.adminVerifyToken = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: "Token requerido" });

    try {
      const secret = process.env.ADMIN_MAGIC_SECRET;
      if (!secret) return res.status(500).json({ error: "Error de configuración" });

      const payload = verifyToken(String(token), secret);
      if (!payload || payload.role !== "admin") {
        return res.status(401).json({ error: "Token inválido" });
      }

      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        return res.status(401).json({ error: "Token expirado" });
      }

      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const email = (payload.email || "").toLowerCase();
      if (!adminEmails.includes(email)) {
        return res.status(403).json({ error: "Email no autorizado" });
      }

      return res.json({ email: payload.email, name: payload.name || email });
    } catch (err) {
      return res.status(401).json({ error: "Token inválido" });
    }
  }
);

/** POST (x-admin-token header) + { filter? } → retorna todas las ventas */
exports.adminGetSales = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
      verifyAdminAccess(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    try {
      let query = db.collection("ventas").orderBy("fechaCreacion", "desc").limit(200);

      const snapshot = await query.get();
      const sales = snapshot.docs.map((doc) => {
        const data = doc.data();
        const { pinHash, ...safeData } = data;
        void pinHash;
        return {
          id: doc.id,
          ...safeData,
          fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() ?? data.fechaCreacion ?? null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? null,
        };
      });

      return res.json({ sales });
    } catch (err) {
      console.error("adminGetSales error:", err);
      return res.status(500).json({ error: "Error obteniendo ventas" });
    }
  }
);

/** POST (x-admin-token) + { saleId } → retorna una venta */
exports.adminGetSale = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
      verifyAdminAccess(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId } = req.body || {};
    if (!saleId) return res.status(400).json({ error: "saleId requerido" });

    try {
      const doc = await db.collection("ventas").doc(saleId).get();
      if (!doc.exists) return res.status(404).json({ error: "Venta no encontrada" });

      const data = doc.data();
      const { pinHash, ...safeData } = data;
      void pinHash;
      return res.json({
        id: doc.id,
        ...safeData,
        fechaCreacion: data.fechaCreacion?.toDate?.()?.toISOString() ?? null,
      });
    } catch (err) {
      return res.status(500).json({ error: "Error obteniendo venta" });
    }
  }
);

/** POST (x-admin-token) + { saleId, status?, paymentStatus? } → actualiza estado */
exports.adminUpdateSale = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
      verifyAdminAccess(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId, status, paymentStatus } = req.body || {};
    if (!saleId) return res.status(400).json({ error: "saleId requerido" });

    const updates = { updatedAt: FieldValue.serverTimestamp() };
    if (status !== undefined) updates.status = status;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;

    if (Object.keys(updates).length === 1) {
      return res.status(400).json({ error: "Debe especificar status o paymentStatus" });
    }

    try {
      await db.collection("ventas").doc(saleId).update(updates);
      // onVentaUpdate trigger disparará automáticamente → email al cliente
      return res.json({ ok: true });
    } catch (err) {
      console.error("adminUpdateSale error:", err);
      return res.status(500).json({ error: "Error actualizando venta" });
    }
  }
);

/** POST (x-admin-token) + { saleId, field, url } → actualiza URL de documento */
exports.adminUpdateDocumentUrl = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
      verifyAdminAccess(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId, field, url } = req.body || {};
    if (!saleId || !field) return res.status(400).json({ error: "saleId y field son requeridos" });

    const ALLOWED_FIELDS = ["paymentReceipt", "onapiCertificate", "estatutosUrl", "registroMercantilUrl", "rncUrl"];
    if (!ALLOWED_FIELDS.includes(field)) {
      return res.status(400).json({ error: `Campo no permitido: ${field}` });
    }

    try {
      await db.collection("ventas").doc(saleId).update({
        [field]: url || "",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return res.json({ ok: true });
    } catch (err) {
      console.error("adminUpdateDocumentUrl error:", err);
      return res.status(500).json({ error: "Error actualizando documento" });
    }
  }
);

/** POST (x-admin-token) + { saleId } → lista comentarios */
exports.adminGetComments = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
      verifyAdminAccess(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId } = req.body || {};
    if (!saleId) return res.status(400).json({ error: "saleId requerido" });

    try {
      const snapshot = await db
        .collection("ventas")
        .doc(saleId)
        .collection("comments")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      }));

      return res.json(comments);
    } catch (err) {
      console.error("adminGetComments error:", err);
      return res.status(500).json({ error: "Error obteniendo comentarios" });
    }
  }
);

/** POST (x-admin-token) + { saleId, message } → agrega comentario de admin */
exports.adminAddComment = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
      verifyAdminAccess(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId, message } = req.body || {};
    if (!saleId || !message?.trim()) {
      return res.status(400).json({ error: "saleId y message son requeridos" });
    }

    try {
      await db
        .collection("ventas")
        .doc(saleId)
        .collection("comments")
        .add({
          message: message.trim(),
          authorRole: "admin",
          author: "Admin Team",
          createdAt: FieldValue.serverTimestamp(),
        });

      return res.json({ ok: true });
    } catch (err) {
      console.error("adminAddComment error:", err);
      return res.status(500).json({ error: "Error agregando comentario" });
    }
  }
);

/** POST — asigna custom claim 'investor' en Firebase Auth (opcional, legacy) */
exports.investorAuthorize = onRequest(
  { region: "us-central1", cors: true, secrets: ["INVESTOR_ALLOWED_EMAILS"] },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Token faltante." });

    const idToken = authHeader.replace("Bearer ", "").trim();
    let decodedToken;
    try {
      decodedToken = await getAuth(app).verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: "Token inválido." });
    }

    const email = (decodedToken.email || "").toLowerCase().trim();
    const allowedEmails = (process.env.INVESTOR_ALLOWED_EMAILS || "")
      .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);

    if (!email || !allowedEmails.includes(email)) {
      return res.status(403).json({ error: "Correo no autorizado." });
    }

    try {
      const userRecord = await getAuth(app).getUser(decodedToken.uid);
      const currentClaims = userRecord.customClaims || {};
      if (currentClaims.role === "investor") return res.json({ authorized: true, alreadyAuthorized: true });
      await getAuth(app).setCustomUserClaims(decodedToken.uid, { ...currentClaims, role: "investor" });
      return res.json({ authorized: true });
    } catch (error) {
      console.error("Error asignando claim:", error);
      return res.status(500).json({ error: "Error interno" });
    }
  }
);
