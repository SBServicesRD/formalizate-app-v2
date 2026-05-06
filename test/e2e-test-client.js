/**
 * E2E test: creates a fictitious client in Firestore and verifies
 * that the onVentaCreate Cloud Function writes orderId/firestoreId
 * and sends the confirmation email.
 *
 * Usage:
 *   node test/e2e-test-client.js [--keep]
 *
 * Requires Application Default Credentials:
 *   gcloud auth application-default login
 */

const admin = require("firebase-admin");
const readline = require("readline");

const FIRESTORE_DATABASE = "formalizate-app-prod";
const PROJECT_ID = "sbservicesrd";
const POLL_INTERVAL_MS = 5000;
const MAX_WAIT_MS = 60000;

// ── Init ──────────────────────────────────────────────────────────────────────
admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
db.settings({ databaseId: FIRESTORE_DATABASE });

// ── Test data ─────────────────────────────────────────────────────────────────
const testClient = {
  email: "juliomendozaestrella@gmail.com",
  userEmail: "juliomendozaestrella@gmail.com",
  nombre: "Julio Mendoza Estrella",
  applicant: {
    names: "Julio",
    surnames: "Mendoza Estrella",
    email: "juliomendozaestrella@gmail.com",
    phone: "8291234567",
    cedula: "402-3051234-5",
  },
  companyName: "TEST - Inversiones JME Demo, SRL",
  companyType: "SRL",
  plan: "Unlimitech",
  monto: "64,900",
  paymentMethod: "transfer",
  paymentStatus: "unpaid",
  partners: [
    { name: "Julio Mendoza Estrella", cedula: "402-3051234-5", nationality: "Dominicana", percentage: 60 },
    { name: "Carmen Rodríguez Test",  cedula: "001-0012345-6", nationality: "Dominicana", percentage: 40 },
  ],
  source: "E2E_TEST",
  _isTest: true,
  createdAt: new Date().toISOString(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function pollForUpdate(docRef) {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const snap = await docRef.get();
    const data = snap.data();
    if (data.orderId && data.firestoreId) return data;
    process.stdout.write(".");
  }
  return (await docRef.get()).data();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function runTest() {
  const keepFlag = process.argv.includes("--keep");

  console.log(`\n[E2E] Proyecto: ${PROJECT_ID} · DB: ${FIRESTORE_DATABASE}`);
  console.log("[E2E] Creando documento de prueba en colección 'ventas'...");

  const docRef = await db.collection("ventas").add(testClient);
  const docId = docRef.id;
  console.log(`[E2E] Documento creado: ${docId}`);
  console.log("[E2E] Esperando respuesta del trigger onVentaCreate", { maxWait: `${MAX_WAIT_MS / 1000}s` });

  const data = await pollForUpdate(docRef);
  console.log("\n");

  const ok   = (v) => v ? "✅" : "❌";
  const rows = [
    ["orderId",       data.orderId],
    ["firestoreId",   data.firestoreId],
    ["fechaCreacion", data.fechaCreacion ? "OK" : null],
    ["pinHash",       data.pinHash ? "OK (hash)" : null],
  ];

  console.log("=== REPORTE E2E TEST ===");
  console.log(`📄 Documento ID: ${docId}`);
  rows.forEach(([k, v]) => console.log(`${ok(v)} ${k}: ${v || "NO GENERADO"}`));
  console.log(`📧 Email destino: ${testClient.email}`);
  console.log("📧 Verificar bandeja para correo 'Orden Recibida - Validando Comprobante'");
  console.log("========================\n");

  if (!keepFlag) {
    const answer = await ask("¿Eliminar documento de prueba? (s/n) ");
    if (answer.toLowerCase() === "s") {
      await docRef.delete();
      console.log("[E2E] Documento eliminado.");
    } else {
      console.log("[E2E] Documento conservado.");
    }
  } else {
    console.log("[E2E] --keep activo: documento conservado.");
  }

  process.exit(0);
}

runTest().catch((err) => {
  console.error("[E2E] Error fatal:", err.message);
  process.exit(1);
});
