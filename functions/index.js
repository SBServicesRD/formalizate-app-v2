const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const nodemailer = require("nodemailer");
const { getTemplate } = require("./emailTemplates");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

// ============================================================
// CONFIGURACIÓN GLOBAL
// ============================================================
setGlobalOptions({
  region: "us-central1",
  // Secretos desde Secret Manager (ya NO viven en functions/.env):
  // ZOHO_PASSWORD es la app password de GMAIL (nombre histórico engañoso).
  secrets: ["ZOHO_PASSWORD", "CUSTOMER_MAGIC_SECRET", "INVESTOR_MAGIC_SECRET", "ADMIN_MAGIC_SECRET", "NOTION_API_KEY", "VENTAS_SMTP_PASSWORD", "WHATSAPP_TOKEN", "GEMINI_API_KEY", "GA4_SA_KEY"],
});

const app = initializeApp();
const db = getFirestore(app, "formalizate-app-prod");
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "sbservicesrd.firebasestorage.app";

/**
 * Genera la download URL (tipo getDownloadURL) de un objeto en Storage usando
 * el Admin SDK, que ignora las reglas de seguridad. El admin no tiene sesión de
 * Firebase Auth, así que NO puede llamar getDownloadURL desde el cliente (la
 * regla `allow read: if request.auth != null` lo bloquea). Esto lo resuelve.
 */
async function buildDownloadUrl(objectPath) {
  const file = getStorage(app).bucket(STORAGE_BUCKET).file(objectPath);
  const [meta] = await file.getMetadata();
  let token = meta && meta.metadata && meta.metadata.firebaseStorageDownloadTokens;
  if (!token) {
    token = crypto.randomUUID();
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  }
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/` +
    `${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

// URLs de los dashboards (configurables via env)
const CUSTOMER_DASHBOARD_URL = process.env.CUSTOMER_DASHBOARD_URL || "https://dash.formalizate.app";
const INVESTOR_DASHBOARD_URL = process.env.INVESTOR_DASHBOARD_URL || "https://investors.formalizate.app";

// ── WhatsApp (Meta Cloud API) ────────────────────────────────────────────────
// Enviamos plantillas aprobadas por la WhatsApp Cloud API de Meta (el mismo canal
// que ya usa el Reporte Diario). Fuera de la ventana de 24h Meta EXIGE plantilla
// aprobada — justo el caso de un cliente que dejó de responder. El token de
// sistema vive en Secret Manager (WHATSAPP_TOKEN); phone_number_id y nombre de
// plantilla son config no sensible (defaults abajo). Sin token → se omite (el
// correo sí sale igual).
const WHATSAPP_PHONE_ID      = process.env.WHATSAPP_PHONE_NUMBER_ID || "315400284998744";
const WHATSAPP_TEMPLATE      = process.env.WHATSAPP_TEMPLATE_RECORDATORIO || "recordatorio_expediente";
const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || "es_DO";

/** Normaliza un teléfono RD a E.164 sin '+': 10 dígitos → antepone '1'. */
function normalizePhoneRD(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return "1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  return digits;
}

/**
 * Envía la plantilla de recordatorio por WhatsApp (Meta Cloud API). Best-effort:
 * nunca lanza (un fallo de WhatsApp no debe tumbar el correo ni el trigger).
 * Variables de plantilla: {{1}}=nombre, {{2}}=empresa. El enlace/detalle viaja
 * por correo; el WhatsApp es el "toque" que logra que lo revisen.
 */
async function sendWhatsApp({ phone, nombre, empresa } = {}) {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) {
    console.log("sendWhatsApp: WHATSAPP_TOKEN sin configurar — WhatsApp omitido");
    return false;
  }
  const to = normalizePhoneRD(phone);
  if (!to) {
    console.log("sendWhatsApp: sin teléfono válido — WhatsApp omitido");
    return false;
  }
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: WHATSAPP_TEMPLATE,
      language: { code: WHATSAPP_TEMPLATE_LANG },
      components: [{
        type: "body",
        parameters: [
          { type: "text", text: String(nombre || "Cliente") },
          { type: "text", text: String(empresa || "tu empresa") },
        ],
      }],
    },
  };
  try {
    const resp = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error("sendWhatsApp: Meta respondió", resp.status, txt.slice(0, 300));
      return false;
    }
    console.log("WhatsApp enviado a:", to);
    return true;
  } catch (err) {
    console.error("sendWhatsApp falló:", err.message);
    return false;
  }
}

/** URL del dashboard del cliente con un token fresco (el botón siempre funciona). */
function customerDashboardUrl(firestoreId) {
  const customerSecret = process.env.CUSTOMER_MAGIC_SECRET;
  if (!customerSecret || !firestoreId) return CUSTOMER_DASHBOARD_URL;
  const dashboardToken = signToken(
    { saleId: firestoreId, role: "customer", issuedAt: Math.floor(Date.now() / 1000) },
    customerSecret
  );
  return `${CUSTOMER_DASHBOARD_URL}/?token=${dashboardToken}`;
}

// ============================================================
// EMAIL
// ============================================================
// Envío autenticado como ventas@formalizate.app (Workspace, SPF+DKIM alineados).
// La app password de ventas@ vive en Secret Manager (VENTAS_SMTP_PASSWORD).
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "ventas@formalizate.app",
    pass: process.env.VENTAS_SMTP_PASSWORD,
  },
});

async function sendEmail(mailOptions) {
  try {
    const info = await transporter.sendMail({
      ...mailOptions,
      from: '"Equipo de Formalízate.app" <ventas@formalizate.app>',
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
// getTemplate vive ahora en ./emailTemplates.js (sistema coherente: shell común +
// bloque RECIBO solo en transaccionales). Se importa arriba con require.

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
// PUENTE → NOTION — marca el lead como Cerrado al entrar una venta
// (función AISLADA; no toca onVentaCreate ni las demás)
// ============================================================
const NOTION_BRIDGE_WEBHOOK = "https://n8n.formalizate.app/webhook/venta-cerrada-7c3a1f2e";

exports.onVentaSyncNotion = onDocumentCreated(
  {
    document: "ventas/{ventaId}",
    database: "formalizate-app-prod",
    region: "us-central1",
  },
  async (event) => {
    try {
      const snap = event.data;
      if (!snap) return;
      const data = snap.data();
      const email = data.email || data.userEmail || data.applicant?.email || "";
      const phone = data.telefono || data.phone || data.whatsapp || data.applicant?.phone || "";
      let nombre = "Cliente";
      if (data.applicant?.names) {
        nombre = `${data.applicant.names} ${data.applicant.surnames || ""}`.trim();
      } else if (data.nombre) {
        nombre = data.nombre;
      }
      const plan = data.plan || data.packageName || "";
      const monto = data.monto || data.totalAmount || "";
      const orderId = data.orderId || event.params.ventaId;
      const empresa = data.companyName || nombre;
      const status = data.status || "";
      const paymentStatus = data.paymentStatus || "";
      await fetch(NOTION_BRIDGE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, nombre, empresa, plan, monto, orderId, status, paymentStatus, event: "create" }),
      });
    } catch (error) {
      console.error("Puente Notion (onVentaSyncNotion) falló:", error);
    }
  }
);

// Cierra el lead en Notion cuando el pago se CONFIRMA después de crear la venta
// (transferencias: la venta nace pending_confirmation y el admin la marca paid;
// onVentaSyncNotion solo dispara en el create, así que sin esto el lead quedaba abierto)
exports.onVentaPagoConfirmado = onDocumentUpdated(
  {
    document: "ventas/{ventaId}",
    database: "formalizate-app-prod",
    region: "us-central1",
  },
  async (event) => {
    try {
      const before = event.data?.before?.data() || {};
      const after = event.data?.after?.data() || {};
      if (before.paymentStatus === "paid" || after.paymentStatus !== "paid") return;
      const email = after.email || after.userEmail || after.applicant?.email || "";
      const phone = after.telefono || after.phone || after.applicant?.phone || "";
      let nombre = "Cliente";
      if (after.applicant?.names) {
        nombre = `${after.applicant.names} ${after.applicant.surnames || ""}`.trim();
      } else if (after.nombre) {
        nombre = after.nombre;
      }
      const empresa = after.companyName || nombre;
      const plan = after.plan || after.packageName || "";
      const monto = after.monto || after.totalAmount || "";
      const orderId = after.orderId || event.params.ventaId;
      const status = after.status || "";
      await fetch(NOTION_BRIDGE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, nombre, empresa, plan, monto, orderId, status, paymentStatus: "paid", event: "pagado" }),
      });
    } catch (error) {
      console.error("Puente Notion (onVentaPagoConfirmado) falló:", error);
    }
  }
);

// ============================================================
// GENERAR EXPEDIENTE — corre el motor determinista (docgen/) en la nube.
// El texto legal vive CONGELADO en docgen/ (copias byte-idénticas del motor
// local de 01_DIGITACION); esta función solo lo envuelve: lee la venta,
// mapea, ejecuta el generador como proceso hijo (mismo contrato DATOS_FILE/
// OUT_DIR que el .bat local) y sube los .docx a Storage.
// NO toca estatutosUrl/asambleaUrl/pdrUrl: el admin revisa los .docx y los
// sube por el flujo existente de aprobación. Solo escribe el metadato
// aditivo `expedienteGenerado`.
// ============================================================
exports.generarExpediente = onRequest(
  { region: "us-central1", cors: true, timeoutSeconds: 300, memory: "512MiB" },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }
    let adminPayload;
    try {
      adminPayload = verifyAdminWrite(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
    const { ventaId, generos, fecha } = req.body || {};
    if (!ventaId) return res.status(400).json({ error: "ventaId requerido" });

    try {
      const snap = await db.collection("ventas").doc(String(ventaId)).get();
      if (!snap.exists) return res.status(404).json({ error: "Venta no encontrada" });
      const venta = snap.data();

      // Compuerta: solo con pago confirmado (política: 100% por adelantado).
      if (venta.paymentStatus !== "paid") {
        return res.status(409).json({
          error: "El pago no está confirmado (paymentStatus=" + (venta.paymentStatus || "sin definir") +
            "). Los documentos se generan solo con pago confirmado.",
        });
      }

      const isEirl = /eirl/i.test(venta.companyType || "");
      const dir = path.join(__dirname, "docgen", isEirl ? "eirl" : "srl");
      const generosArr = Array.isArray(generos)
        ? generos
        : String(generos || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      const opts = { fecha: fecha || new Date(), generos: generosArr };
      const datos = isEirl
        ? require(path.join(dir, "mapear_eirl.js")).mapearEirl(venta, opts)
        : require(path.join(dir, "mapear_db.js")).mapear(venta, opts);

      // Ejecutar el motor congelado como proceso hijo (fresco en cada corrida)
      const stamp = Date.now();
      const tmpDatos = path.join(os.tmpdir(), "datos-" + stamp + ".json");
      const outDir = path.join(os.tmpdir(), "gen-" + stamp);
      fs.writeFileSync(tmpDatos, JSON.stringify(datos), "utf8");
      try {
        execFileSync(process.execPath,
          [path.join(dir, isEirl ? "generar_constitucion_eirl.js" : "generar_constitucion_srl.js")],
          { env: { ...process.env, DATOS_FILE: tmpDatos, OUT_DIR: outDir }, stdio: "pipe", timeout: 240000 });
      } finally {
        if (fs.existsSync(tmpDatos)) fs.unlinkSync(tmpDatos);
      }

      const files = fs.existsSync(outDir) ? fs.readdirSync(outDir).filter((f) => f.endsWith(".docx")) : [];
      if (!files.length) throw new Error("El generador no produjo documentos");

      // Subir a Storage bajo una carpeta versionada por fecha (regenerar nunca pisa)
      const generadoEn = new Date().toISOString();
      const carpeta = "ventas/" + ventaId + "/generados/" + generadoEn.slice(0, 10) + "-" + stamp;
      const bucket = getStorage(app).bucket(STORAGE_BUCKET);
      const documentos = [];
      for (const f of files) {
        const objectPath = carpeta + "/" + f;
        await bucket.upload(path.join(outDir, f), {
          destination: objectPath,
          metadata: { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        });
        const url = await buildDownloadUrl(objectPath);
        documentos.push({ nombre: f, path: objectPath, url });
        fs.unlinkSync(path.join(outDir, f));
      }
      fs.rmdirSync(outDir);

      await db.collection("ventas").doc(String(ventaId)).update({
        expedienteGenerado: {
          archivos: documentos,
          generadoEn,
          por: adminPayload.email || "admin",
          tipo: isEirl ? "EIRL" : "SRL",
        },
      });

      // Avisos (mismos chequeos que el procesar.js local)
      const advertencias = [];
      const personas = isEirl ? [datos.titular] : (datos.socios || []);
      if (personas.some((p) => p && p._REVISAR_genero)) {
        advertencias.push("Género no especificado en algún socio/titular — se asumió masculino. Si corresponde, regenerar pasando 'generos' (ej. [\"F\"]).");
      }
      const ent = isEirl ? datos.empresa : datos.sociedad;
      const chk = JSON.stringify({ ...datos, [isEirl ? "empresa" : "sociedad"]: { ...ent, onapiNumero: "" } });
      if (chk.includes("[COMPLETAR")) {
        advertencias.push("Quedan campos [COMPLETAR] visibles (en rojo en el .docx): revisarlos antes de enviar.");
      }
      if (String(ent && ent.onapiNumero).includes("[COMPLETAR")) {
        advertencias.push("El No. ONAPI aún no está (normal hasta la aprobación del nombre); no aparece en el cuerpo.");
      }

      console.log("Expediente generado", ventaId, isEirl ? "EIRL" : "SRL", files.join(", "), "por", adminPayload.email);
      return res.json({ ok: true, tipo: isEirl ? "EIRL" : "SRL", documentos, advertencias });
    } catch (err) {
      console.error("generarExpediente falló:", err);
      return res.status(500).json({ error: "No se pudo generar el expediente: " + err.message });
    }
  }
);

// ============================================================
// CONCILIADOR Firestore ↔ Notion — red de seguridad contra desfases.
// La capa en tiempo real ya existe (puente al pagar + guard de inmunidad en
// la ingesta); esto es el AUDITOR: cada día compara TODAS las ventas pagadas
// contra TODOS los leads del Pipeline y avisa por email si un cliente pagado
// sigue con lead activo (identidad duplicada, carrera, webhook perdido) o si
// una venta no dejó rastro en Notion. Matching TOLERANTE: email en minúsculas
// y últimos 10 dígitos del teléfono (más laxo que el puente, a propósito).
// ============================================================
const NOTION_PIPELINE_DB = "fc24dcdb-d9d3-4eaf-8525-fb15950c73f1";
const ESTADOS_NO_ACTIVOS = ["✅ Cerrado", "❌ Perdido"];

const norm10 = (p) => {
  const d = String(p || "").replace(/\D/g, "");
  return d.length >= 7 ? d.slice(-10) : null;
};
const normEmail = (e) => {
  const s = String(e || "").trim().toLowerCase();
  return s.includes("@") ? s : null;
};

async function leerLeadsPipeline() {
  const key = process.env.NOTION_API_KEY;
  if (!key) throw new Error("NOTION_API_KEY no configurada");
  const leads = [];
  let cursor = null;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await fetch(`https://api.notion.com/v1/databases/${NOTION_PIPELINE_DB}/query`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error("Notion query falló: " + (j.message || r.status));
    for (const p of (j.results || [])) {
      const pr = p.properties || {};
      leads.push({
        nombre: ((pr["Lead"] || {}).title || []).map((t) => t.plain_text).join("") || "(sin nombre)",
        estado: (((pr["Estado"] || {}).select) || {}).name || "",
        tel: norm10(((pr["Teléfono / WhatsApp"] || {}).phone_number)),
        email: normEmail(((pr["Email"] || {}).email)),
      });
    }
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return leads;
}

async function runConciliador() {
  const [snap, leads] = await Promise.all([db.collection("ventas").get(), leerLeadsPipeline()]);
  const hallazgos = [];
  let ventasPagadas = 0;
  snap.forEach((d) => {
    const v = d.data();
    if (v.paymentStatus !== "paid") return;
    ventasPagadas++;
    const emails = [v.email, v.userEmail, v.applicant && v.applicant.email].map(normEmail).filter(Boolean);
    const tels = [v.telefono, v.phone, v.whatsapp, v.applicant && v.applicant.phone].map(norm10).filter(Boolean);
    const match = leads.filter((l) => (l.email && emails.includes(l.email)) || (l.tel && tels.includes(l.tel)));
    const activos = match.filter((l) => !ESTADOS_NO_ACTIVOS.includes(l.estado));
    if (match.length === 0) {
      hallazgos.push(`⚠️ ${v.companyName || d.id} (RD$${v.totalAmount || "?"}): venta PAGADA sin ningún lead que coincida en el Pipeline (posible webhook perdido o contactos distintos). Contactos de la venta: ${[...emails, ...tels].join(", ") || "—"}.`);
    } else if (activos.length > 0) {
      hallazgos.push(`🚨 ${v.companyName || d.id}: CLIENTE PAGADO con lead(s) todavía ACTIVO(S) en el Pipeline: ${activos.map((l) => `«${l.nombre}» [${l.estado}]`).join(", ")} — cerrar/unificar (identidad duplicada o desfase).`);
    }
  });
  return { hallazgos, ventasPagadas, totalLeads: leads.length };
}

async function enviarReporteConciliador(res) {
  const cuerpo = res.hallazgos.length
    ? `El conciliador diario encontró ${res.hallazgos.length} desfase(s) entre Firestore (ventas) y Notion (Pipeline):\n\n` +
      res.hallazgos.map((h, i) => `${i + 1}. ${h}`).join("\n\n") +
      `\n\n(Revisadas ${res.ventasPagadas} ventas pagadas contra ${res.totalLeads} leads.)`
    : "";
  if (!cuerpo) return false;
  await transporter.sendMail({
    from: "Formalízate.app · Conciliador <ventas@formalizate.app>",
    to: "smartbizservicesrd@gmail.com",
    subject: `🧭 Conciliador: ${res.hallazgos.length} desfase(s) Firestore↔Notion`,
    text: cuerpo,
  });
  return true;
}

// Corre solo, cada día 7:00 AM (antes del reporte diario de las 8).
// Silencio = todo cuadra. Si falla, intenta avisar por email igual.
exports.conciliadorPipeline = onSchedule(
  { schedule: "0 7 * * *", timeZone: "America/Santo_Domingo", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    try {
      const res = await runConciliador();
      const enviado = await enviarReporteConciliador(res);
      console.log(`Conciliador: ${res.hallazgos.length} hallazgos (${res.ventasPagadas} ventas / ${res.totalLeads} leads)${enviado ? " — email enviado" : ""}`);
    } catch (err) {
      console.error("Conciliador falló:", err);
      try {
        await transporter.sendMail({
          from: "Formalízate.app · Conciliador <ventas@formalizate.app>",
          to: "smartbizservicesrd@gmail.com",
          subject: "🧭⚠️ El Conciliador diario FALLÓ",
          text: "Error: " + err.message,
        });
      } catch (e2) { console.error("Y el aviso de fallo también:", e2.message); }
    }
  }
);

// ============================================================
// CONTROL DE VENTAS SEMANAL — actualiza la tabla de Notion con datos reales
// (Firestore = ventas/ingreso · Pipeline = leads creados en la semana).
// Cada lunes finaliza la semana pasada y refresca la actual. Cero mantenimiento.
// ============================================================
const CONTROL_SEMANAL_DB = "1f32e056eeb1436782155a28c2a486d8";
const PIPELINE_DB_ID = "fc24dcdbd9d34eaf8525fb15950c73f1";

function semanaISO(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  const mon = new Date(t); mon.setUTCDate(t.getUTCDate() - 3);
  const end = new Date(mon); end.setUTCDate(mon.getUTCDate() + 7);
  return { etiqueta: t.getUTCFullYear() + "-W" + String(week).padStart(2, "0"), monday: mon.toISOString().slice(0, 10), start: mon, end };
}

async function notionApi(path, method, body) {
  const r = await fetch("https://api.notion.com/v1/" + path, {
    method,
    headers: { "Authorization": "Bearer " + process.env.NOTION_API_KEY, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
}

// Métricas web de la semana (GA4 sesiones + Search Console) usando la cuenta
// de servicio ga4-agent (llave en Secret Manager GA4_SA_KEY). Si Google falla,
// devuelve null y el update del funnel sigue sin las columnas web.
async function metricasWebSemana(w) {
  try {
    const { JWT } = require("google-auth-library");
    const sa = JSON.parse(process.env.GA4_SA_KEY);
    const client = new JWT({ email: sa.client_email, key: sa.private_key,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/webmasters.readonly"] });
    const tok = (await client.getAccessToken()).token;
    const endD = new Date(w.end); endD.setUTCDate(endD.getUTCDate() - 1);
    const endISO = endD.toISOString().slice(0, 10);
    const ga = await (await fetch("https://analyticsdata.googleapis.com/v1beta/properties/514186424:runReport", {
      method: "POST", headers: { "Authorization": "Bearer " + tok, "Content-Type": "application/json" },
      body: JSON.stringify({ dateRanges: [{ startDate: w.monday, endDate: endISO }], metrics: [{ name: "sessions" }] }),
    })).json();
    const ses = Number(((ga.rows || [])[0] || {}).metricValues?.[0]?.value || 0);
    const sc = await (await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Aformalizate.app/searchAnalytics/query", {
      method: "POST", headers: { "Authorization": "Bearer " + tok, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: w.monday, endDate: endISO }),
    })).json();
    const row = (sc.rows || [])[0] || {};
    return { ses, cl: Math.round(row.clicks || 0), im: Math.round(row.impressions || 0),
      pos: row.position ? Math.round(row.position * 10) / 10 : null };
  } catch (err) {
    console.warn("metricasWebSemana falló (se sigue sin web):", err.message);
    return null;
  }
}

async function actualizarSemanaControl(w) {
  // Ventas + ingreso desde Firestore (pagadas, por fecha)
  const snap = await db.collection("ventas").where("fecha", ">=", w.start).where("fecha", "<", w.end).get();
  let ventas = 0, ingreso = 0;
  snap.forEach((d) => { const v = d.data(); if (v.paymentStatus === "paid") { ventas++; ingreso += Number(v.totalAmount || 0); } });
  // Leads = páginas del Pipeline creadas en la semana
  let leads = 0, cursor = undefined;
  do {
    const q = await notionApi("databases/" + PIPELINE_DB_ID + "/query", "POST", {
      filter: { and: [
        { timestamp: "created_time", created_time: { on_or_after: w.start.toISOString() } },
        { timestamp: "created_time", created_time: { before: w.end.toISOString() } },
      ] }, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}),
    });
    leads += (q.json.results || []).length;
    cursor = q.json.has_more ? q.json.next_cursor : null;
  } while (cursor);
  // Buscar la fila de la semana (por Fecha inicio) y actualizar
  const find = await notionApi("databases/" + CONTROL_SEMANAL_DB + "/query", "POST", {
    filter: { property: "Fecha inicio de semana", date: { equals: w.monday } }, page_size: 1,
  });
  const row = (find.json.results || [])[0];
  if (!row) return { semana: w.etiqueta, error: "fila no encontrada" };
  const props = {
    "Leads inbound": { number: leads },
    "Ventas totales": { number: ventas },
    "Ventas inbound": { number: ventas },
    "Ingreso total (RD$)": { number: ingreso },
  };
  const web = await metricasWebSemana(w);
  if (web) {
    props["Sesiones web (GA4)"] = { number: web.ses };
    props["Clics SEO"] = { number: web.cl };
    props["Impresiones SEO"] = { number: web.im };
    if (web.pos !== null) props["Posición SEO"] = { number: web.pos };
  }
  await notionApi("pages/" + row.id, "PATCH", { properties: props });
  return { semana: w.etiqueta, leads, ventas, ingreso, web };
}

async function correrControlSemanal() {
  const hoy = new Date();
  const semanaPasada = new Date(hoy); semanaPasada.setUTCDate(hoy.getUTCDate() - 7);
  const res = [];
  res.push(await actualizarSemanaControl(semanaISO(semanaPasada))); // finaliza la que terminó
  res.push(await actualizarSemanaControl(semanaISO(hoy)));           // refresca la actual
  return res;
}

// Lunes 8:15am AST (después del reporte diario).
exports.controlSemanalAuto = onSchedule(
  { schedule: "15 8 * * 1", timeZone: "America/Santo_Domingo", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    try {
      const res = await correrControlSemanal();
      console.log("Control semanal actualizado:", JSON.stringify(res));
    } catch (err) { console.error("controlSemanalAuto falló:", err); }
  }
);

// Disparo manual (x-admin-token) para probar/rellenar al instante.
exports.controlSemanalRun = onRequest(
  { region: "us-central1", cors: true, timeoutSeconds: 300, memory: "512MiB" },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
    try { verifyAdminWrite(req); } catch (err) { return res.status(401).json({ error: err.message }); }
    try {
      const r = await correrControlSemanal();
      return res.json({ ok: true, semanas: r });
    } catch (err) {
      console.error("controlSemanalRun falló:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

// Disparo manual (x-admin-token). POST {enviarEmail?:true} → mismos chequeos al instante.
exports.conciliadorRun = onRequest(
  { region: "us-central1", cors: true, timeoutSeconds: 300, memory: "512MiB" },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
    try {
      verifyAdminWrite(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
    try {
      const r = await runConciliador();
      let emailEnviado = false;
      if ((req.body || {}).enviarEmail) emailEnviado = await enviarReporteConciliador(r);
      return res.json({ ok: true, ...r, emailEnviado });
    } catch (err) {
      console.error("conciliadorRun falló:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

// ============================================================
// MOTOR DE RECORDATORIOS — clientes atascados esperando SU acción
// ============================================================
// Persigue a los clientes cuyo expediente está EN PAUSA esperando algo de ellos
// (aprobar documentos, responder una objeción de ONAPI). Reenvía por correo +
// WhatsApp y, pasados unos días sin respuesta, te escala a ti para llamar. Sin
// esto, un cliente que no revisa el correo deja el expediente clavado por semanas.
const WAITING_STATES = {
  documentos_en_revision: {
    tipo: "recordatorio_documentos",
    template: "documentos_listos",
    resumen: "Documentos constitutivos sin aprobar",
    // Si el cliente ya actuó (aprobó / pidió cambios), no molestar.
    yaRespondio: (v) => ["approved", "changes_requested"].includes(v.docsApprovalStatus),
  },
  onapi_objetada: {
    tipo: "recordatorio_objecion",
    template: "onapi_objetada",
    resumen: "Objeción de ONAPI sin resolver",
    yaRespondio: () => false,
  },
};

const NUDGE_INTERVAL_HOURS = 48;   // no repetir un recordatorio antes de 48h
const ESCALATE_AFTER_HOURS = 96;   // a los ~4 días, avisar a SBS para llamar
const MAX_NUDGES = 3;              // tope anti-spam por cliente

function hoursSince(ts) {
  if (!ts) return Infinity;
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  const ms = Date.now() - d.getTime();
  return Number.isFinite(ms) ? ms / 36e5 : Infinity;
}

async function runRecordatorios({ dryRun = false, soloSaleId = null } = {}) {
  const snap = await db.collection("ventas").get();
  const nowIso = new Date().toISOString();
  const acciones = [];   // qué se hizo (o haría) por cliente — útil en dryRun
  const escalar = [];    // clientes que hay que llamar a mano
  let notificados = 0;

  for (const doc of snap.docs) {
    if (soloSaleId && doc.id !== soloSaleId) continue;
    const v = doc.data();
    const status = (v.status || "").toLowerCase().trim();
    const cfg = WAITING_STATES[status];
    if (!cfg) continue;                       // no está esperando al cliente
    const empresa = v.companyName || v.nombre || doc.id;
    if (v.nudgePaused === true) { acciones.push({ id: doc.id, empresa, skip: "pausado manualmente" }); continue; }
    if (cfg.yaRespondio(v))    { acciones.push({ id: doc.id, empresa, skip: "el cliente ya respondió" }); continue; }

    // Estado del recordatorio; se re-inicializa si el doc cambió de estado
    // (así no hace falta limpiar nada desde onVentaUpdate).
    let ns = v.nudgeState;
    if (!ns || ns.status !== status) ns = { status, since: nowIso, count: 0, lastAt: null };

    const horasEsperando  = hoursSince(ns.since);
    const horasDesdeUltimo = hoursSince(ns.lastAt);
    const debeEscalar = horasEsperando >= ESCALATE_AFTER_HOURS;

    if (debeEscalar) {
      const tels = [v.telefono, v.phone, v.whatsapp, v.applicant && v.applicant.phone].filter(Boolean);
      escalar.push({
        empresa, motivo: cfg.resumen,
        dias: Math.floor(horasEsperando / 24),
        tel: tels[0] || "—",
        email: v.email || v.userEmail || (v.applicant && v.applicant.email) || "—",
        recordatorios: ns.count,
      });
    }

    const puedeNotificar = ns.count < MAX_NUDGES && horasDesdeUltimo >= NUDGE_INTERVAL_HOURS;
    if (!puedeNotificar) {
      acciones.push({
        id: doc.id, empresa, escalado: debeEscalar,
        skip: ns.count >= MAX_NUDGES
          ? `tope de ${MAX_NUDGES} recordatorios alcanzado`
          : `dentro del intervalo (últ. hace ${Math.floor(horasDesdeUltimo)}h)`,
      });
      continue;
    }

    const email = v.email || v.userEmail || (v.applicant && v.applicant.email) || "";
    const phone = v.telefono || v.phone || v.whatsapp || (v.applicant && v.applicant.phone) || "";
    let nombre = "Cliente";
    if (v.applicant && v.applicant.names) nombre = `${v.applicant.names} ${v.applicant.surnames || ""}`.trim();
    else if (v.nombre) nombre = v.nombre;
    const plan = v.plan || v.packageName || "";
    const monto = getPrecio(plan, v.monto || v.totalAmount);
    const orderId = v.orderId || doc.id;
    const dashboardUrl = customerDashboardUrl(v.firestoreId || doc.id);

    acciones.push({ id: doc.id, empresa, notificaria: cfg.tipo, intento: ns.count + 1, email: email || "—", phone: phone || "—", escalado: debeEscalar });

    if (!dryRun) {
      if (email) {
        const tpl = getTemplate(cfg.template, { nombre, plan, monto, orderId, dashboardUrl, motivo: v.onapiObjecionMotivo });
        if (tpl) await sendEmail({ to: email, subject: `⏰ Recordatorio · ${tpl.subject}`, html: tpl.html });
      }
      await sendWhatsApp({ phone, nombre, empresa, tipo: cfg.tipo, motivo: v.onapiObjecionMotivo || "", dashboardUrl });
      await doc.ref.update({ nudgeState: { status, since: ns.since, count: ns.count + 1, lastAt: nowIso } });
      notificados++;
    }
  }

  let escalado = false;
  if (escalar.length && !dryRun) escalado = await enviarDigestRecordatorios(escalar);
  return { notificados, escalar, acciones, escalado, dryRun };
}

async function enviarDigestRecordatorios(escalar) {
  const filas = escalar.map((e, i) =>
    `${i + 1}. ${e.empresa} — ${e.motivo} · ${e.dias} día(s) esperando · ${e.recordatorios} recordatorio(s) enviados\n   Tel: ${e.tel} · Correo: ${e.email}`
  ).join("\n\n");
  try {
    await sendEmail({
      to: "ventas@formalizate.app",
      subject: `📞 ${escalar.length} cliente(s) atascado(s) — hay que llamarlos`,
      html: `<p>Estos expedientes llevan días en pausa esperando al cliente y ya recibieron recordatorios automáticos sin respuesta. <strong>Toca contacto humano (llamada o WhatsApp directo):</strong></p><pre style="font-family:Arial,sans-serif;font-size:13px;color:#333;white-space:pre-wrap;">${filas}</pre>`,
    });
    return true;
  } catch (err) {
    console.error("enviarDigestRecordatorios falló:", err.message);
    return false;
  }
}

// Corre cada día 8:30 AM (después del conciliador de las 7). Reenvía y escala.
exports.recordatoriosClientesBloqueados = onSchedule(
  { schedule: "30 8 * * *", timeZone: "America/Santo_Domingo", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    // Interruptor de seguridad: el cron NO envía nada hasta poner RECORDATORIOS_ENABLED='true'
    // en functions/.env + redeploy. Así se verifica el alcance (dryRun) antes de tocar clientes.
    if (process.env.RECORDATORIOS_ENABLED !== "true") {
      console.log("Recordatorios: cron DESACTIVADO (RECORDATORIOS_ENABLED != 'true')");
      return;
    }
    try {
      const r = await runRecordatorios({ dryRun: false });
      console.log(`Recordatorios: ${r.notificados} notificado(s), ${r.escalar.length} a escalar${r.escalado ? " (digest enviado)" : ""}`);
    } catch (err) {
      console.error("Recordatorios falló:", err);
    }
  }
);

// Disparo manual (x-admin-token). POST { dryRun?:true, saleId?:"..." }.
// dryRun=true (por defecto) → dice a QUIÉN notificaría SIN enviar nada. Úsalo primero.
exports.recordatoriosRun = onRequest(
  { region: "us-central1", cors: true, timeoutSeconds: 300, memory: "512MiB" },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
    try { verifyAdminWrite(req); } catch (err) { return res.status(401).json({ error: err.message }); }
    try {
      const { dryRun = true, saleId = null } = req.body || {};
      const r = await runRecordatorios({ dryRun: !!dryRun, soloSaleId: saleId });
      return res.json({ ok: true, ...r });
    } catch (err) {
      console.error("recordatoriosRun falló:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

// ============================================================
// IA: INTERPRETAR OBJECIÓN DE ONAPI PARA EL CLIENTE
// ============================================================
// Lee el oficio de objeción de ONAPI (PDF/imagen) con Gemini visión y redacta,
// en lenguaje simple, qué pasó y qué necesitamos del cliente. NO envía nada ni
// cambia estado: devuelve un BORRADOR para que el humano lo revise y apruebe.
// OJO: la guía legal es de apoyo; el mensaje final SIEMPRE lo aprueba un humano.
const ONAPI_GROUNDING = `
Eres un asistente de Formalízate.app (República Dominicana) que traduce objeciones de ONAPI sobre el NOMBRE COMERCIAL a lenguaje simple y cálido para un cliente sin formación legal.

MARCO LEGAL (Ley 20-00 de Propiedad Industrial de RD y su Reglamento, mod. por Decreto 260-18):
- Art. 113: el derecho sobre el nombre comercial nace con su primer uso; se protege aunque no se registre.
- Art. 114 (base de casi toda objeción): un nombre comercial NO puede (a) ser contrario a la moral o el orden público, ni (b) ser susceptible de crear confusión en el comercio o el público sobre la identidad, naturaleza o actividades de la empresa — incluye parecerse a un nombre o marca ya existente.
- Arts. 116-117: el registro es declarativo, da presunción de buena fe y dura 10 años renovables.

MOTIVOS TÍPICOS DE OBJECIÓN Y SU REMEDIO (guía práctica):
1. Confusión con un nombre/marca ya registrado (idéntico o muy parecido) -> remedio: proponer un nombre distinto (agregar o cambiar términos que lo diferencien).
2. Nombre genérico o meramente descriptivo (solo describe la actividad) -> remedio: añadir un elemento distintivo (de fantasía, un nombre propio, etc.).
3. Contrario a la moral o el orden público -> remedio: cambiar el término problemático.
4. Términos reservados o engañosos (p.ej. "banco", "seguros", "universidad", o que hagan creer algo que la empresa no es) -> remedio: quitar el término o presentar la autorización del ente que corresponda.
5. Faltas o errores formales en la solicitud -> remedio: corregir o completar el requisito.

REGLAS:
- Escribe en español dominicano, simple y humano, como a alguien sin conocimientos legales. Nada de jerga.
- NO inventes artículos ni cites números que no estén en el documento o en esta guía.
- Si el documento es ilegible, ambiguo, o el motivo no encaja con la guía, marca requiereRevisionAbogado=true y no afirmes con certeza.
- Los nombres alternos sugeridos deben evitar el motivo de la objeción.
`;

/** Llama a Gemini (visión) con un prompt + un documento en base64. Devuelve el texto. */
async function llamarGemini(promptText, base64, mimeType) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no configurada");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const parts = [{ text: promptText }];
  if (base64) parts.push({ inline_data: { mime_type: mimeType || "application/pdf", data: base64 } });
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error("Gemini " + resp.status + ": " + t.slice(0, 200));
  }
  const data = await resp.json();
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
}

// POST (x-admin-token) { saleId, fileBase64, mimeType } → BORRADOR (no envía, no cambia estado)
exports.analizarObjecionOnapi = onRequest(
  { region: "us-central1", cors: true, timeoutSeconds: 120, memory: "512MiB" },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
    try { verifyAdminWrite(req); } catch (err) { return res.status(401).json({ error: err.message }); }
    try {
      const { saleId, fileBase64, mimeType } = req.body || {};
      if (!saleId || !fileBase64) return res.status(400).json({ error: "saleId y fileBase64 requeridos" });

      // Contexto: el nombre objetado (Opción A) y las alternativas que el cliente
      // YA propuso al llenar su solicitud (Opción B/C). La idea NO es que la IA
      // invente nombres, sino que el cliente reconfirme entre los suyos o proponga otro.
      let empresa = "la empresa";
      let alternativas = [];
      try {
        const snap = await db.collection("ventas").doc(saleId).get();
        const v = snap.data() || {};
        empresa = v.companyName || v.nombre || empresa;
        alternativas = [v.altName1, v.altName2]
          .map((x) => String(x || "").trim())
          .filter((x) => x && !/^(n\/?a|na|-|—)$/i.test(x));
      } catch (e) { /* contexto opcional */ }

      const listaAlt = alternativas.length
        ? `El cliente YA propuso estas alternativas al llenar su solicitud: ${alternativas.map((a) => `"${a}"`).join(", ")}.`
        : "El cliente NO registró nombres alternativos en su solicitud.";

      const prompt = `${ONAPI_GROUNDING}

El nombre comercial objetado (Opción A) es: "${empresa}".
${listaAlt}

Analiza el documento de objeción de ONAPI adjunto y responde SOLO con un JSON con esta forma exacta:
{
  "mensajeCliente": "explicación en español simple y cálida (4-8 líneas): qué pasó con su nombre y por qué. AL FINAL, si el cliente tiene alternativas propias, pídele que CONFIRME con cuál de ellas seguimos o si prefiere proponer otra; NO inventes nombres nuevos. Si NO tiene alternativas, pídele que proponga 1-2 nombres.",
  "motivoTecnico": "el motivo en términos precisos (1-2 líneas, uso interno de SBS)",
  "nombresAlternosSugeridos": ["SOLO si el cliente no tiene alternativas propias; si ya las tiene, deja este arreglo vacío"],
  "nivelConfianza": "alto|medio|bajo",
  "requiereRevisionAbogado": true,
  "notaInterna": "cualquier salvedad o duda para el equipo SBS"
}`;

      const raw = await llamarGemini(prompt, fileBase64, mimeType);
      let draft;
      try { draft = JSON.parse(raw); }
      catch (e) { return res.status(502).json({ error: "La IA no devolvió JSON válido", raw: String(raw).slice(0, 500) }); }
      return res.json({ ok: true, draft });
    } catch (err) {
      console.error("analizarObjecionOnapi falló:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

// Auto-mueve la ficha del expediente a ✅ Completado cuando Firestore lo marca completado
exports.onVentaStatusComplete = onDocumentUpdated(
  {
    document: "ventas/{ventaId}",
    database: "formalizate-app-prod",
    region: "us-central1",
  },
  async (event) => {
    try {
      const before = event.data?.before?.data() || {};
      const after = event.data?.after?.data() || {};
      if (before.status === "completado" || after.status !== "completado") return;
      const email = after.email || after.userEmail || after.applicant?.email || "";
      const phone = after.telefono || after.phone || after.applicant?.phone || "";
      let nombre = "Cliente";
      if (after.applicant?.names) {
        nombre = `${after.applicant.names} ${after.applicant.surnames || ""}`.trim();
      } else if (after.nombre) {
        nombre = after.nombre;
      }
      const empresa = after.companyName || nombre;
      const plan = after.plan || after.packageName || "";
      await fetch(NOTION_BRIDGE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, nombre, empresa, plan, status: "completado", event: "completado" }),
      });
    } catch (error) {
      console.error("Puente Notion (onVentaStatusComplete) falló:", error);
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

    // 4. Documentos constitutivos listos para revisión/aprobación del cliente.
    //    SOLO en la transición real hacia ese estado: si el status ya estaba ahí
    //    (p. ej. solo cambió el pago), no se reenvía el correo "documentos listos".
    } else if (statusChanged && statusNew === "documentos_en_revision") {
      templateType = "documentos_listos";

    // 5. ONAPI aprobado
    } else if (statusNew === "onapi_listo") {
      templateType = "onapi_listo";

    // 5b. ONAPI OBJETÓ el nombre → expediente en pausa esperando al cliente.
    //     Solo en la transición real hacia ese estado (no en re-escrituras).
    } else if (statusChanged && statusNew === "onapi_objetada") {
      templateType = "onapi_objetada";

    // 6. Proceso completado
    } else if (statusNew === "completado") {
      templateType = "completado";

    // 7. Hitos intermedios — cada uno con su propio label
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

    // Regenerate a fresh customer token so the email button always works.
    // after.dashboardLink is never persisted to Firestore, so we can't rely on it.
    const firestoreId = after.firestoreId || event.params.ventaId;
    const customerSecret = process.env.CUSTOMER_MAGIC_SECRET;
    let dashboardUrl = CUSTOMER_DASHBOARD_URL;
    if (customerSecret && firestoreId) {
      const dashboardToken = signToken(
        { saleId: firestoreId, role: "customer", issuedAt: Math.floor(Date.now() / 1000) },
        customerSecret
      );
      dashboardUrl = `${CUSTOMER_DASHBOARD_URL}/?token=${dashboardToken}`;
    }

    if (email) {
      const template = getTemplate(templateType, { nombre, plan, monto, orderId, dashboardUrl, hitoLabel, motivo: after.onapiObjecionMotivo, mensajeCliente: after.onapiMensajeCliente });
      if (template) {
        await sendEmail({ to: email, subject: template.subject, html: template.html });
      }
    }

    // WhatsApp de refuerzo para la objeción de ONAPI: es urgente y el correo
    // solo no alcanza (justo el caso que nos deja expedientes clavados).
    if (templateType === "onapi_objetada") {
      const phone = after.telefono || after.phone || after.whatsapp || after.applicant?.phone || "";
      await sendWhatsApp({
        phone,
        nombre,
        empresa: after.companyName || nombre,
        tipo: "objecion_onapi",
        motivo: after.onapiObjecionMotivo || "",
        dashboardUrl,
      });
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
      const { saleId, saleData } = await verifyCustomerAccess(token, pin);
      const commentsRef = db.collection("ventas").doc(saleId).collection("comments");

      if (action === "list") {
        const snapshot = await commentsRef.orderBy("createdAt", "desc").limit(20).get();
        const comments = snapshot.docs
          .filter((doc) => doc.data().internal !== true) // ocultar notas internas de SBS
          .map((doc) => {
            const { internal, ...rest } = doc.data(); // no exponer el flag al cliente
            void internal;
            return {
              id: doc.id,
              ...rest,
              // Serializar Timestamp de Firestore a ISO string
              createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
            };
          });
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

        // Avisar a SBS por correo para que el expediente siga caminando.
        try {
          const nombre = saleData.applicant?.names
            ? `${saleData.applicant.names} ${saleData.applicant.surnames || ""}`.trim()
            : (saleData.nombre || "El cliente");
          const empresa = saleData.companyName || "su empresa";
          const orderId = saleData.orderId || saleId;
          await sendEmail({
            to: "ventas@formalizate.app",
            subject: `💬 Nuevo mensaje del cliente — ${empresa}`,
            html: `<p><strong>${nombre}</strong> respondió desde su panel sobre el expediente de <strong>${empresa}</strong> (Orden: ${orderId}):</p>
                   <blockquote style="border-left:3px solid #1D3557;padding-left:12px;color:#555;">${message.trim().replace(/\n/g, "<br>")}</blockquote>
                   <p>Revísalo y responde desde el panel de administración.</p>`,
          });
        } catch (mailErr) {
          console.error("customerComments: aviso a SBS falló (comentario sí se guardó):", mailErr);
        }

        return res.json({ ok: true });
      }

      return res.status(400).json({ error: "Acción no reconocida" });
    } catch (err) {
      console.warn("customerComments acceso denegado:", err.message);
      return res.status(401).json({ error: err.message || "Acceso inválido" });
    }
  }
);

/**
 * POST { token, pin, decision: 'approve' | 'request_changes', message? }
 * El cliente aprueba sus documentos constitutivos o solicita cambios.
 */
exports.customerApproveDocs = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { token, pin, decision, message } = req.body || {};
    if (!token || !pin || !decision) {
      return res.status(400).json({ error: "Parámetros faltantes" });
    }
    if (!["approve", "request_changes"].includes(decision)) {
      return res.status(400).json({ error: "Decisión no válida" });
    }

    try {
      const { saleId, saleData } = await verifyCustomerAccess(token, pin);
      const saleRef     = db.collection("ventas").doc(saleId);
      const commentsRef = saleRef.collection("comments");

      const nombre = saleData.applicant?.names
        ? `${saleData.applicant.names} ${saleData.applicant.surnames || ""}`.trim()
        : (saleData.nombre || "El cliente");
      const empresa = saleData.companyName || "su empresa";
      const orderId = saleData.orderId || saleId;

      if (decision === "approve") {
        await saleRef.update({
          docsApprovalStatus: "approved",
          docsApprovedAt:     FieldValue.serverTimestamp(),
          status:             "documentos_aprobados",
        });
        await commentsRef.add({
          message:    "✅ Aprobé mis documentos constitutivos.",
          authorRole: "customer",
          createdAt:  FieldValue.serverTimestamp(),
        });
        await sendEmail({
          to: "ventas@formalizate.app",
          subject: `✅ Documentos APROBADOS — ${empresa}`,
          html: `<p><strong>${nombre}</strong> aprobó sus documentos constitutivos.</p>
                 <p>Empresa: <strong>${empresa}</strong><br/>Orden: ${orderId}</p>
                 <p>Ya puedes continuar con la gestión de ONAPI.</p>`,
        });
        return res.json({ ok: true, docsApprovalStatus: "approved" });
      }

      // request_changes
      if (!message?.trim()) {
        return res.status(400).json({ error: "Indica qué cambios necesitas" });
      }
      await saleRef.update({ docsApprovalStatus: "changes_requested" });
      await commentsRef.add({
        message:    `✏️ Solicité cambios en mis documentos: ${message.trim()}`,
        authorRole: "customer",
        createdAt:  FieldValue.serverTimestamp(),
      });
      await sendEmail({
        to: "ventas@formalizate.app",
        subject: `✏️ Cambios solicitados en documentos — ${empresa}`,
        html: `<p><strong>${nombre}</strong> solicitó cambios en sus documentos constitutivos.</p>
               <p>Empresa: <strong>${empresa}</strong><br/>Orden: ${orderId}</p>
               <blockquote style="border-left:3px solid #E63A47;padding-left:12px;color:#555;">${message.trim()}</blockquote>`,
      });
      return res.json({ ok: true, docsApprovalStatus: "changes_requested" });
    } catch (err) {
      console.warn("customerApproveDocs error:", err.message);
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
/** Parsea una lista de emails separada por comas desde una env var. */
function parseEmailList(envVar) {
  return (process.env[envVar] || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Rol de un email según las allowlists: 'admin', 'viewer' o null. */
function roleForEmail(email) {
  const e = (email || "").toLowerCase().trim();
  if (parseEmailList("ADMIN_EMAILS").includes(e)) return "admin";
  if (parseEmailList("ADMIN_VIEWER_EMAILS").includes(e)) return "viewer";
  return null;
}

/**
 * Verifica el x-admin-token. Acepta rol 'admin' (acceso total) o 'viewer'
 * (solo lectura). Retorna el payload (con .role) si OK, lanza Error si no.
 */
function verifyAdminAccess(req) {
  const token = req.headers["x-admin-token"];
  if (!token) throw new Error("Token de admin requerido");

  const secret = process.env.ADMIN_MAGIC_SECRET;
  if (!secret) throw new Error("Configuración del servidor incompleta");

  const payload = verifyToken(String(token), secret);
  if (!payload || (payload.role !== "admin" && payload.role !== "viewer")) {
    throw new Error("Token inválido o expirado");
  }

  // Verificar expiración
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("Token expirado — solicita un nuevo enlace");
  }

  // El email debe seguir en la allowlist y su rol actual coincidir con el del
  // token (así, si cambias a alguien de lista, su token viejo deja de servir).
  const role = roleForEmail(payload.email);
  if (!role || role !== payload.role) throw new Error("Email no autorizado");

  return payload;
}

/**
 * Como verifyAdminAccess pero EXIGE rol 'admin' (escritura). Un viewer queda
 * bloqueado en el servidor aunque manipule la petición o el frontend.
 */
function verifyAdminWrite(req) {
  const payload = verifyAdminAccess(req);
  if (payload.role !== "admin") {
    throw new Error("Modo solo lectura: no tienes permiso para modificar");
  }
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

    const normalizedEmail = email.toLowerCase().trim();
    const role = roleForEmail(normalizedEmail);
    if (!role) {
      // No revelar si el email es válido o no (seguridad)
      console.warn(`adminSendMagicLink: email no autorizado: ${normalizedEmail}`);
      return res.json({ sent: true }); // Respuesta genérica
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      email: normalizedEmail,
      role, // 'admin' (acceso total) o 'viewer' (solo lectura)
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
      if (!payload || (payload.role !== "admin" && payload.role !== "viewer")) {
        return res.status(401).json({ error: "Token inválido" });
      }

      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        return res.status(401).json({ error: "Token expirado" });
      }

      const email = (payload.email || "").toLowerCase();
      const role = roleForEmail(email);
      if (!role || role !== payload.role) {
        return res.status(403).json({ error: "Email no autorizado" });
      }

      return res.json({ email: payload.email, name: payload.name || email, role });
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
      verifyAdminWrite(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId, status, paymentStatus, onapiObjecionMotivo, onapiNombreAlterno, onapiMensajeCliente, onapiObjecionDocUrl, nudgePaused } = req.body || {};
    if (!saleId) return res.status(400).json({ error: "saleId requerido" });

    const updates = { updatedAt: FieldValue.serverTimestamp() };
    if (status !== undefined) updates.status = status;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (onapiObjecionMotivo !== undefined) updates.onapiObjecionMotivo = onapiObjecionMotivo;
    if (onapiNombreAlterno !== undefined) updates.onapiNombreAlterno = onapiNombreAlterno;
    if (onapiMensajeCliente !== undefined) updates.onapiMensajeCliente = onapiMensajeCliente;
    if (onapiObjecionDocUrl !== undefined) updates.onapiObjecionDocUrl = onapiObjecionDocUrl;
    if (nudgePaused !== undefined) updates.nudgePaused = nudgePaused;

    if (Object.keys(updates).length === 1) {
      return res.status(400).json({ error: "Debe especificar al menos un campo a actualizar" });
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
      verifyAdminWrite(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId, field, url, path } = req.body || {};
    if (!saleId || !field) return res.status(400).json({ error: "saleId y field son requeridos" });

    const ALLOWED_FIELDS = [
      // Documentos constitutivos (revisión del cliente)
      "estatutosUrl", "asambleaUrl", "pdrUrl",
      // Trámites y certificaciones
      "paymentReceipt", "onapiCertificate", "registroMercantilUrl", "rncUrl",
      "bankLetterUrl", "tssUrl", "firmaDigitalUrl", "dominioUrl",
      "dgaUrl", "proveedorEstadoUrl", "webUrl",
    ];
    if (!ALLOWED_FIELDS.includes(field)) {
      return res.status(400).json({ error: `Campo no permitido: ${field}` });
    }

    try {
      // Si llega `path` (subida nueva), el backend genera la download URL.
      // Si llega `url` (o vacío, para borrar), se usa tal cual.
      let finalUrl = typeof url === "string" ? url : "";
      if (!finalUrl && path) {
        finalUrl = await buildDownloadUrl(path);
      }
      await db.collection("ventas").doc(saleId).update({
        [field]: finalUrl,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return res.json({ ok: true, url: finalUrl });
    } catch (err) {
      console.error("adminUpdateDocumentUrl error:", err);
      return res.status(500).json({ error: "Error actualizando documento" });
    }
  }
);

/**
 * POST (x-admin-token) + { saleId, field, fileName, contentBase64 }
 * Sube un documento del expediente vía Admin SDK (ignora las reglas de
 * Storage) → permite cerrar la escritura del bucket a clientes sin sesión.
 * Solo sube y devuelve el path; el frontend llama después a
 * adminUpdateDocumentUrl {saleId, field, path} para guardar la URL (flujo ya probado).
 */
exports.adminUploadDocument = onRequest(
  { region: "us-central1", cors: true, memory: "512MiB", timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
    try {
      verifyAdminWrite(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }
    const { saleId, field, fileName, contentBase64 } = req.body || {};
    const cleanSaleId = String(saleId || "").replace(/[^A-Za-z0-9_-]/g, "");
    if (!cleanSaleId || !field || !contentBase64) {
      return res.status(400).json({ error: "saleId, field y contentBase64 son requeridos" });
    }
    const ALLOWED_FIELDS = [
      "estatutosUrl", "asambleaUrl", "pdrUrl",
      "paymentReceipt", "onapiCertificate", "registroMercantilUrl", "rncUrl",
      "bankLetterUrl", "tssUrl", "firmaDigitalUrl", "dominioUrl",
      "dgaUrl", "proveedorEstadoUrl", "webUrl",
    ];
    if (!ALLOWED_FIELDS.includes(field)) {
      return res.status(400).json({ error: `Campo no permitido: ${field}` });
    }
    try {
      const ext = (String(fileName || "").split(".").pop() || "bin")
        .toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      const buffer = Buffer.from(String(contentBase64), "base64");
      if (!buffer.length) return res.status(400).json({ error: "Archivo vacío" });
      const MIME = {
        pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg",
        png: "image/png", webp: "image/webp",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
      const objectPath = `ventas/${cleanSaleId}/documents/${field}.${ext}`;
      await getStorage(app).bucket(STORAGE_BUCKET).file(objectPath).save(buffer, {
        metadata: { contentType: MIME[ext] || "application/octet-stream" },
      });
      return res.json({ ok: true, path: objectPath, size: buffer.length });
    } catch (err) {
      console.error("adminUploadDocument error:", err);
      return res.status(500).json({ error: "Error subiendo el documento" });
    }
  }
);

/**
 * POST (x-admin-token) + { saleId }
 * Reabre la aprobación tras "cambios solicitados": resetea docsApprovalStatus,
 * garantiza status=documentos_en_revision y REENVÍA al cliente el correo
 * "documentos listos" con la versión corregida (regenerando su token).
 * Sin esto el cliente queda atascado en la pantalla "Recibimos tu solicitud".
 */
exports.adminReopenDocsApproval = onRequest(
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
    // Re-verificar como escritura (verifyAdminAccess arriba solo confirmó identidad).
    try { verifyAdminWrite(req); } catch (err) { return res.status(401).json({ error: err.message }); }

    try {
      const saleRef = db.collection("ventas").doc(saleId);
      const snap = await saleRef.get();
      if (!snap.exists) return res.status(404).json({ error: "Venta no encontrada" });
      const data = snap.data();

      // status ya suele estar en documentos_en_revision (request_changes no lo cambia),
      // así que esta escritura NO dispara correo en onVentaUpdate (statusChanged=false).
      await saleRef.update({
        docsApprovalStatus: "pending_review",
        status: "documentos_en_revision",
        updatedAt: FieldValue.serverTimestamp(),
      });

      await saleRef.collection("comments").add({
        message: "🛠 Corregimos tus documentos según tu solicitud. Por favor revísalos y apruébalos cuando estés conforme.",
        authorRole: "admin",
        createdAt: FieldValue.serverTimestamp(),
      });

      // Reenviar el correo "documentos listos" (token fresco, igual que onVentaUpdate).
      const email = data.email || data.userEmail || data.applicant?.email;
      let nombre = "Cliente";
      if (data.applicant?.names) {
        nombre = `${data.applicant.names} ${data.applicant.surnames || ""}`.trim();
      } else if (data.nombre) {
        nombre = data.nombre;
      }
      const orderId = data.orderId || saleId;
      const plan = data.plan || data.packageName;
      const monto = getPrecio(plan, data.monto || data.totalAmount);

      const firestoreId = data.firestoreId || saleId;
      const customerSecret = process.env.CUSTOMER_MAGIC_SECRET;
      let dashboardUrl = CUSTOMER_DASHBOARD_URL;
      if (customerSecret && firestoreId) {
        const dashboardToken = signToken(
          { saleId: firestoreId, role: "customer", issuedAt: Math.floor(Date.now() / 1000) },
          customerSecret
        );
        dashboardUrl = `${CUSTOMER_DASHBOARD_URL}/?token=${dashboardToken}`;
      }

      if (email) {
        const template = getTemplate("documentos_listos", { nombre, plan, monto, orderId, dashboardUrl });
        if (template) {
          await sendEmail({ to: email, subject: template.subject, html: template.html });
        }
      }

      return res.json({ ok: true });
    } catch (err) {
      console.error("adminReopenDocsApproval error:", err);
      return res.status(500).json({ error: "Error reabriendo la aprobación" });
    }
  }
);

/**
 * POST (x-admin-token) + { saleId, links:[{label,url}], action:'save'|'send'|'verify' }
 * Firma digital de Persona Física: guarda los enlaces de verificación de identidad
 * (uno por socio/titular), y en 'send' notifica al cliente con esos enlaces.
 * No hay integración con la certificadora: el admin compra la firma manualmente y
 * pega aquí el enlace que recibe; el dashboard solo lo entrega y trackea el estatus.
 */
exports.adminUpdateFirmaDigital = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
      verifyAdminWrite(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId, links, action } = req.body || {};
    if (!saleId || !action) return res.status(400).json({ error: "saleId y action son requeridos" });

    const cleanLinks = Array.isArray(links)
      ? links
          .filter((l) => l && typeof l.url === "string" && l.url.trim())
          .map((l) => ({
            label: String(l.label || "Titular").slice(0, 80),
            url: String(l.url).trim().slice(0, 1000),
          }))
      : [];

    try {
      const saleRef = db.collection("ventas").doc(saleId);

      if (action === "verify") {
        await saleRef.update({
          firmaDigitalStatus: "verificada",
          firmaDigitalVerifiedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return res.json({ ok: true, firmaDigitalStatus: "verificada" });
      }

      const snap = await saleRef.get();
      const saleData = snap.data() || {};
      const update = {
        firmaDigitalLinks: cleanLinks,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (action === "send") {
        if (cleanLinks.length === 0) {
          return res.status(400).json({ error: "Agrega al menos un enlace antes de enviar" });
        }
        update.firmaDigitalStatus = "enlace_enviado";
        update.firmaDigitalSentAt = FieldValue.serverTimestamp();
      } else {
        update.firmaDigitalStatus = saleData.firmaDigitalStatus || "pendiente";
      }

      await saleRef.update(update);

      if (action === "send") {
        const email = saleData.email || saleData.userEmail || saleData.applicant?.email;
        const nombre = saleData.applicant?.names
          ? `${saleData.applicant.names} ${saleData.applicant.surnames || ""}`.trim()
          : (saleData.nombre || "Cliente");
        const empresa = saleData.companyName || "tu empresa";

        const firestoreId = saleData.firestoreId || saleId;
        const customerSecret = process.env.CUSTOMER_MAGIC_SECRET;
        let dashboardUrl = CUSTOMER_DASHBOARD_URL;
        if (customerSecret && firestoreId) {
          const t = signToken(
            { saleId: firestoreId, role: "customer", issuedAt: Math.floor(Date.now() / 1000) },
            customerSecret
          );
          dashboardUrl = `${CUSTOMER_DASHBOARD_URL}/?token=${t}`;
        }

        if (email) {
          const linksHtml = cleanLinks
            .map((l) => `<p style="margin:10px 0;"><strong>${l.label}:</strong><br/>
              <a href="${l.url}" style="color:#1D3557;font-weight:bold;">${l.url}</a></p>`)
            .join("");
          await sendEmail({
            to: email,
            subject: `🔐 Activa tu firma digital — ${empresa}`,
            html: `<p>Hola <strong>${nombre}</strong>,</p>
                   <p>El primer paso para constituir <strong>${empresa}</strong> es activar tu
                   <strong>firma digital de persona física</strong>. Ya la adquirimos por ti — solo
                   necesitas <strong>validar tu identidad</strong> (es 100% remoto y toma unos minutos).</p>
                   <p>Abre tu enlace de verificación${cleanLinks.length > 1 ? " (uno por socio)" : ""}:</p>
                   ${linksHtml}
                   <p style="margin-top:16px;">También puedes seguir tu proceso en tu panel:
                   <a href="${dashboardUrl}" style="color:#1D3557;">${dashboardUrl}</a></p>
                   <p>Cualquier duda, responde a este correo.</p>`,
          });
        }
      }

      return res.json({ ok: true });
    } catch (err) {
      console.error("adminUpdateFirmaDigital error:", err);
      return res.status(500).json({ error: "No se pudo guardar la firma digital" });
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
      verifyAdminWrite(req);
    } catch (err) {
      return res.status(401).json({ error: err.message });
    }

    const { saleId, message, internal } = req.body || {};
    if (!saleId || !message?.trim()) {
      return res.status(400).json({ error: "saleId y message son requeridos" });
    }
    const esInterna = !!internal; // nota interna: no se le muestra ni se le notifica al cliente

    try {
      const saleRef = db.collection("ventas").doc(saleId);
      await saleRef.collection("comments").add({
        message: message.trim(),
        authorRole: "admin",
        author: "Admin Team",
        internal: esInterna,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Notificar al cliente por correo SOLO si es un mensaje para él (no nota interna).
      if (!esInterna) try {
        const data = (await saleRef.get()).data() || {};
        const email = data.email || data.userEmail || data.applicant?.email;
        if (email) {
          const nombre = data.applicant?.names ? ` ${data.applicant.names}` : "";
          const empresa = data.companyName || "tu empresa";

          // Enlace CON token (si no, el panel muestra "Ups, algo salió mal").
          const firestoreId = data.firestoreId || saleId;
          const customerSecret = process.env.CUSTOMER_MAGIC_SECRET;
          let dashboardUrl = CUSTOMER_DASHBOARD_URL;
          if (customerSecret && firestoreId) {
            const t = signToken(
              { saleId: firestoreId, role: "customer", issuedAt: Math.floor(Date.now() / 1000) },
              customerSecret
            );
            dashboardUrl = `${CUSTOMER_DASHBOARD_URL}/?token=${t}`;
          }

          await sendEmail({
            to: email,
            subject: `Tienes un nuevo mensaje sobre tu expediente — ${empresa}`,
            html: `<p>Hola${nombre},</p>
                   <p>El equipo de Formalízate te ha enviado un mensaje sobre el expediente de <strong>${empresa}</strong>:</p>
                   <blockquote style="border-left:3px solid #1D3557;padding-left:12px;color:#555;">${message.trim().replace(/\n/g, "<br>")}</blockquote>
                   <p>Para responder, entra a tu panel y déjanos tu respuesta desde ahí (te pedirá tu PIN):</p>
                   <p><a href="${dashboardUrl}" style="color:#1D3557;font-weight:bold;">Entrar a mi panel</a></p>`,
          });
        }
      } catch (mailErr) {
        console.error("adminAddComment: aviso al cliente falló (comentario sí se guardó):", mailErr);
      }

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
