const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
try {
  // If running locally, it might use GOOGLE_APPLICATION_CREDENTIALS or a local service account key.
  // We'll try to initialize with default credentials.
  const serviceAccount = require('../functions/serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {
  try {
    admin.initializeApp();
  } catch (err) {
    console.error("Error initializing Firebase Admin. Make sure you have valid credentials.");
    process.exit(1);
  }
}

const db = admin.firestore();

const testClient = {
  businessName: "TEST - Inversiones JME Demo, SRL",
  applicant: {
    name: "Julio Mendoza Estrella",
    cedula: "402-3051234-5",
    email: "juliomendozaestrella@gmail.com",
    phone: "8291234567"
  },
  userEmail: "juliomendozaestrella@gmail.com",
  email: "juliomendozaestrella@gmail.com",
  plan: "starter_pro",
  planType: "SRL",
  partners: [
    { name: "Julio Mendoza Estrella", cedula: "402-3051234-5", nationality: "Dominicana", percentage: 60 },
    { name: "Carmen Rodríguez Test", cedula: "001-0012345-6", nationality: "Dominicana", percentage: 40 }
  ],
  paymentMethod: "transfer",
  paymentStatus: "pending",
  amount: 27900,
  currency: "DOP",
  source: "E2E_TEST",
  isTest: true,
  createdAt: new Date().toISOString()
};

async function runTest() {
  try {
    console.log("Creando documento de prueba en Firestore (colección 'ventas')...");
    const docRef = await db.collection('ventas').add(testClient);
    const docId = docRef.id;
    console.log(`Documento creado con ID: ${docId}`);
    
    console.log("Esperando 10 segundos para permitir que las Cloud Functions procesen...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log("Leyendo documento actualizado...");
    const docSnap = await docRef.get();
    const data = docSnap.data();
    
    console.log("\n=== REPORTE E2E TEST ===");
    console.log(`📄 Documento ID: ${docId}`);
    console.log(`${data.orderId ? '✅' : '❌'} orderId: ${data.orderId || "NO GENERADO"}`);
    console.log(`${data.firestoreId ? '✅' : '❌'} firestoreId: ${data.firestoreId || "NO GENERADO"}`);
    console.log(`${data.fechaCreacion ? '✅' : '❌'} fechaCreacion: ${data.fechaCreacion || "NO GENERADO"}`);
    console.log(`📧 Email destino: juliomendozaestrella@gmail.com`);
    console.log(`📧 Verificar bandeja para correo "Orden Recibida - Validando Comprobante"`);
    console.log(`📋 Documento completo: ${JSON.stringify(data, null, 2)}`);
    console.log("=== FIN REPORTE ===\n");
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question("¿Eliminar documento de prueba? (s/n) ", async (answer) => {
      if (answer.toLowerCase() === 's') {
        await docRef.delete();
        console.log("Documento eliminado.");
      } else {
        console.log("Documento conservado.");
      }
      rl.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error("Error durante el test:", error);
    process.exit(1);
  }
}

runTest();
