const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const crypto = require("crypto");

// Extraído de functions/index.js (dashboard de inversionistas)
setGlobalOptions({ region: "us-central1" });

const app = initializeApp();
const db = getFirestore(app, "formalizate-app-prod");

const UTILIDAD_NETA_POR_PLAN = {
  "Starter Pro": 8289,
  "Essential 360": 14053,
  "Unlimitech": 25945,
};

// Acceso permanente para inversionistas.
// Revocar eliminando el email de la lista activa.
const ACTIVE_INVESTORS = (process.env.INVESTOR_ACTIVE_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

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

function signMagicToken(payload, secret) {
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

function verifyMagicToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signature] = parts;
  const data = `${headerPart}.${payloadPart}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }
  try {
    const payloadJson = base64UrlDecode(payloadPart);
    const payload = JSON.parse(payloadJson);
    return payload;
  } catch (error) {
    console.error("Error decodificando token mágico:", error);
    return null;
  }
}

// 1. DASHBOARD DE INVERSIONISTAS
exports.investorsDashboard = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    const magicTokenHeader = req.headers["x-investor-token"] || req.headers["X-Investor-Token"];
    const magicToken = magicTokenHeader || req.query.token;
    if (!magicToken) {
      return res.status(401).json({ error: "Acceso inválido o expirado." });
    }
    const secret = process.env.INVESTOR_MAGIC_SECRET;
    if (!secret) {
      console.error("INVESTOR_MAGIC_SECRET no está configurada");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }
    const magicPayload = verifyMagicToken(String(magicToken), secret);
    const email = (magicPayload?.email || "").toLowerCase().trim();
    if (!magicPayload || magicPayload.role !== "investor" || !ACTIVE_INVESTORS.includes(email)) {
      return res.status(401).json({ error: "Acceso inválido o expirado." });
    }

    // Solo permitir GET
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    try {
      // Consultar todas las ventas
      const ventasRef = db.collection("ventas");
      const snapshot = await ventasRef.get();

      if (snapshot.empty) {
        return res.json({
          totalVentas: 0,
          ingresosBrutos: 0,
          utilidadNetaTotal: 0,
          ventasPorPlan: {},
          progresoPrimerasVentas: {
            actual: 0,
            meta: 120,
            porcentaje: 0,
          },
          comision25: 0,
          fechaUltimaVenta: null,
        });
      }

      // Filtrar ventas pagadas y calcular métricas
      let totalVentas = 0;
      let ingresosBrutos = 0;
      let utilidadNetaTotal = 0;
      const ventasPorPlan = {};
      let fechaUltimaVenta = null;

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Verificar si está pagada
        const isPaid =
          data.status === "pagado" ||
          data.paymentStatus === "paid" ||
          data.paymentStatus === "validated";

        if (!isPaid) return;

        totalVentas++;

        // Calcular ingresos
        const plan = data.plan || data.packageName || "Unknown";
        let monto = 0;

        // Intentar obtener el monto
        if (data.monto) {
          // Si es string, limpiar y convertir
          const montoStr = String(data.monto).replace(/[^\d]/g, "");
          monto = parseFloat(montoStr) || 0;
        } else if (data.totalAmount) {
          monto = typeof data.totalAmount === "number"
            ? data.totalAmount
            : parseFloat(String(data.totalAmount).replace(/[^\d]/g, "")) || 0;
        } else {
          // Usar precio oficial como fallback
          const precios = {
            "Starter Pro": 27900,
            "Essential 360": 41900,
            "Unlimitech": 64900,
          };
          monto = precios[plan] || 0;
        }

        ingresosBrutos += monto;

        // Agrupar por plan
        if (!ventasPorPlan[plan]) {
          ventasPorPlan[plan] = 0;
        }
        ventasPorPlan[plan]++;

        // Utilidad neta por plan (fija)
        if (UTILIDAD_NETA_POR_PLAN[plan]) {
          utilidadNetaTotal += UTILIDAD_NETA_POR_PLAN[plan];
        }

        // Fecha más reciente
        if (data.fechaCreacion) {
          const fecha = data.fechaCreacion.toDate
            ? data.fechaCreacion.toDate()
            : new Date(data.fechaCreacion);

          if (!fechaUltimaVenta || fecha > fechaUltimaVenta) {
            fechaUltimaVenta = fecha;
          }
        }
      });

      // IMPORTANTE: la comisión del inversionista se calcula sobre la utilidad neta, NO sobre ingresos brutos
      const comision25 = utilidadNetaTotal * 0.25;

      // Progreso hacia 120 ventas
      const progresoPrimerasVentas = {
        actual: totalVentas,
        meta: 120,
        porcentaje: Math.min((totalVentas / 120) * 100, 100),
      };

      // Preparar respuesta
      const response = {
        totalVentas,
        ingresosBrutos: Math.round(ingresosBrutos),
        utilidadNetaTotal: Math.round(utilidadNetaTotal),
        ventasPorPlan,
        progresoPrimerasVentas,
        comision25: Math.round(comision25),
        fechaUltimaVenta: fechaUltimaVenta
          ? fechaUltimaVenta.toISOString()
          : null,
      };

      return res.json(response);
    } catch (error) {
      console.error("Error en investorsDashboard:", error);
      return res.status(500).json({
        error: "Error interno del servidor al calcular métricas",
      });
    }
  }
);

// 2. AUTORIZACIÓN DE INVERSIONISTAS (ASIGNAR CLAIM POR EMAIL)
exports.investorAuthorize = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: ["INVESTOR_ALLOWED_EMAILS"],
  },
  async (req, res) => {
    // Solo permitir POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    // Validar ID token (Authorization: Bearer <token>)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado. Token faltante." });
    }
    const idToken = authHeader.replace("Bearer ", "").trim();
    let decodedToken;
    try {
      decodedToken = await getAuth(app).verifyIdToken(idToken);
    } catch (error) {
      console.warn("Token inválido en investorAuthorize:", error);
      return res.status(401).json({ error: "No autorizado. Token inválido." });
    }

    const email = (decodedToken.email || "").toLowerCase().trim();
    const allowedRaw = process.env.INVESTOR_ALLOWED_EMAILS;
    if (!allowedRaw) {
      console.error("INVESTOR_ALLOWED_EMAILS no está configurada en las variables de entorno");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }
    const allowedEmails = allowedRaw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!email || !allowedEmails.includes(email)) {
      return res.status(403).json({ error: "Acceso denegado. Este correo no está autorizado." });
    }

    try {
      const userRecord = await getAuth(app).getUser(decodedToken.uid);
      const currentClaims = userRecord.customClaims || {};
      if (currentClaims.role === "investor") {
        return res.json({ authorized: true, alreadyAuthorized: true });
      }
      await getAuth(app).setCustomUserClaims(decodedToken.uid, {
        ...currentClaims,
        role: "investor",
      });
      return res.json({ authorized: true });
    } catch (error) {
      console.error("Error asignando claim de inversionista:", error);
      return res.status(500).json({ error: "Error interno al asignar claim" });
    }
  }
);

// 3. MAGIC LINK - GENERAR TOKEN PARA INVERSIONISTAS
exports.generateInvestorMagicLink = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }
    const secret = process.env.INVESTOR_MAGIC_SECRET;
    if (!secret) {
      console.error("INVESTOR_MAGIC_SECRET no está configurada");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }
    const { email, name } = req.body || {};
    if (!email || !name) {
      return res.status(400).json({ error: "email y name son requeridos" });
    }
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      email,
      name,
      role: "investor",
      issuedAt: now,
    };
    const token = signMagicToken(payload, secret);
    const url = `https://formalizate.app/?view=investors&token=${token}`;
    return res.json({ url });
  }
);

// 4. MAGIC LINK - VERIFICAR TOKEN
exports.verifyInvestorMagicToken = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    const token = req.query.token || (req.body && req.body.token);
    if (!token) {
      return res.status(400).json({ valid: false, error: "Token faltante" });
    }
    const secret = process.env.INVESTOR_MAGIC_SECRET;
    if (!secret) {
      console.error("INVESTOR_MAGIC_SECRET no está configurada");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }
    const payload = verifyMagicToken(String(token), secret);
    const email = (payload?.email || "").toLowerCase().trim();
    if (!payload || payload.role !== "investor" || !ACTIVE_INVESTORS.includes(email)) {
      return res.json({ valid: false });
    }
    return res.json({
      valid: true,
      investor: {
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    });
  }
);

