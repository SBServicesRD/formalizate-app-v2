const admin = require("firebase-admin");

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
}

const projectId = process.env.FIREBASE_PROJECT_ID || "sbservicesrd";
admin.initializeApp({ projectId });
const db = admin.firestore();

const salesPlanCounts = [
  { plan: "Starter Pro", count: 3, monto: 27900 },
  { plan: "Essential 360", count: 7, monto: 41900 },
  { plan: "Unlimitech", count: 2, monto: 64900 },
];

const buildSales = () => {
  const ventas = [];
  salesPlanCounts.forEach(({ plan, count, monto }) => {
    for (let i = 0; i < count; i += 1) {
      ventas.push({
        plan,
        monto,
        status: "pagado",
        paymentStatus: "paid",
        fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
  return ventas;
};

const seed = async () => {
  const ventas = buildSales();
  const batch = db.batch();
  ventas.forEach((venta) => {
    const ref = db.collection("ventas").doc();
    batch.set(ref, venta);
  });

  await batch.commit();
  console.log(`Ventas insertadas: ${ventas.length}`);
};

seed().catch((error) => {
  console.error("Error insertando ventas:", error);
  process.exit(1);
});

