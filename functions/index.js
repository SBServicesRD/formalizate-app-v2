const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

// Configuración Global
setGlobalOptions({ region: "us-central1" });

const app = initializeApp();
const db = getFirestore(app, "formalizate-app-prod");

// Configuración de GMAIL (Usando tu variable de entorno)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "smartbizservicesrd@gmail.com",
    pass: process.env.ZOHO_PASSWORD 
  },
});

const PRECIOS_OFICIALES = {
    "Starter Pro": "27,900",
    "Essential 360": "41,900",
    "Unlimitech": "64,900"
};

function getPrecio(plan, montoOriginal) {
    if (montoOriginal && montoOriginal !== "0" && montoOriginal !== undefined) {
        return montoOriginal;
    }
    if (plan && PRECIOS_OFICIALES[plan]) {
        return PRECIOS_OFICIALES[plan];
    }
    return "Consultar"; 
}
function generateOrderId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
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

function getDashboardUrl() {
  return "https://formalizate.app/login";
}

async function sendEmail(mailOptions) {
  try {
    const info = await transporter.sendMail({
      ...mailOptions,
      from: '"Formalízate.app" <smartbizservicesrd@gmail.com>', 
      replyTo: 'ventas@formalizate.app',
      bcc: "jmestrella@formalizate.app",
    });
      console.log("Correo enviado:", info.messageId);
      return true;
    } catch (error) {
      console.error("Error enviando correo:", error);
    return false;
  }
}

function getTemplate(type, data) {
  const { nombre, plan, monto, orderId, dashboardUrl } = data;
  const styles = {
    container: "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;",
    header: "background-color: #1D3557; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;",
    btn: "background-color: #E63A47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px;",
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

  const templates = {
    orden_recibida: {
      subject: "Orden Recibida - Validando Comprobante",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>🔍 Validando tu Orden</h2></div>${commonBody}<div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; color: #856404;">Hemos recibido tu comprobante. Nuestro equipo lo está verificando manualmente.</div><center><a href="${dashboardUrl}" style="${styles.btn}">Ir a mi Dashboard</a></center></div></div>`
    },
    pago_exitoso: {
      subject: "✅ Pago Confirmado - Iniciamos labores",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>¡Pago Confirmado!</h2></div>${commonBody}<p>Tu pago ha sido procesado exitosamente. Ya hemos iniciado tu expediente legal.</p><center><a href="${dashboardUrl}" style="${styles.btn}">Ver Progreso</a></center></div></div>`
    },
    transferencia_validada: {
      subject: "✅ Transferencia Validada",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>Pago Aprobado</h2></div>${commonBody}<p>Hemos confirmado tu transferencia bancaria.</p><center><a href="${dashboardUrl}" style="${styles.btn}">Ver Estatus</a></center></div></div>`
    },
    onapi_listo: {
      subject: "🚀 Nombre Comercial Aprobado (ONAPI)",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>¡Nombre Aprobado!</h2></div><div style="padding: 20px; border: 1px solid #ddd;"><p>Buenas noticias, <strong>${nombre}</strong>.</p><p>ONAPI ha concedido oficialmente el nombre de tu empresa.</p><center><a href="${dashboardUrl}" style="${styles.btn}">Ver Documento</a></center></div></div>`
    },
    completado: {
      subject: "🎉 ¡Tu Empresa está Lista!",
      html: `<div style="${styles.container}"><div style="${styles.header}"><h2>¡Misión Cumplida!</h2></div><div style="padding: 20px; border: 1px solid #ddd;"><p>Felicidades, <strong>${nombre}</strong>.</p><p>El proceso ha finalizado. Descarga tu RNC y Registro Mercantil.</p><center><a href="${dashboardUrl}" style="${styles.btn}">Descargar Todo</a></center></div></div>`
    }
  };
  return templates[type];
}

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
      const orderId = await generateUniqueOrderId();
      await event.data.ref.update({
        orderId: orderId,
        firestoreId: firestoreId,
        fechaCreacion: FieldValue.serverTimestamp(),
      });

      const email = data.email || data.userEmail || data.applicant?.email;
      
      let nombre = "Cliente";
      if (data.applicant && data.applicant.names) {
          nombre = `${data.applicant.names} ${data.applicant.surnames || ""}`.trim();
      } else if (data.nombre) {
          nombre = data.nombre;
      }

      const plan = data.plan || data.packageName || "Servicio";
      const monto = getPrecio(plan, data.monto || data.totalAmount);
      
      const metodoRaw = (data.metodoPago || data.paymentMethod || "").toLowerCase();
      let templateType = "orden_recibida"; 

      if (metodoRaw.includes("paypal") || metodoRaw.includes("card") || data.paymentStatus === 'paid') {
        templateType = "pago_exitoso";
      }

      if (email) {
        const template = getTemplate(templateType, { nombre, plan, monto, orderId, dashboardUrl: getDashboardUrl() });
        if (template) {
          await sendEmail({ to: email, subject: template.subject, html: template.html });
        }
      }
    } catch (error) {
      console.error("Error en onCreate:", error);
    }
  }
);

// 2. ACTUALIZACIÓN
exports.onVentaUpdate = onDocumentUpdated(
  {
    document: "ventas/{ventaId}",
    database: "formalizate-app-prod",
    region: "us-central1",
  },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === after.status && before.paymentStatus === after.paymentStatus) return null;

    const statusNew = after.status; 
    const payStatusNew = after.paymentStatus;
    const payStatusOld = before.paymentStatus;

    let templateType = null;

    if (payStatusOld !== 'paid' && (payStatusNew === 'paid' || payStatusNew === 'validated')) {
        templateType = "transferencia_validada";
    }
    else if (statusNew === "pagado") templateType = "transferencia_validada";
    else if (statusNew === "onapi_listo") templateType = "onapi_listo";
    else if (statusNew === "completado") templateType = "completado";

    if (!templateType) return null;

    const email = after.email || after.userEmail || after.applicant?.email;
    
    // Búsqueda inteligente de nombre también aquí
    let nombre = "Cliente";
    if (after.applicant && after.applicant.names) {
        nombre = `${after.applicant.names} ${after.applicant.surnames || ""}`.trim();
    } else if (after.nombre) {
        nombre = after.nombre;
    }

    const orderId = after.orderId || event.params.ventaId;
    const plan = after.plan || after.packageName;
    const monto = getPrecio(plan, after.monto || after.totalAmount);

    if (email) {
      const template = getTemplate(templateType, { 
        nombre, 
        plan, 
        monto, 
        orderId, 
        dashboardUrl: getDashboardUrl() 
      });
      await sendEmail({ to: email, subject: template.subject, html: template.html });
    }
  }
);