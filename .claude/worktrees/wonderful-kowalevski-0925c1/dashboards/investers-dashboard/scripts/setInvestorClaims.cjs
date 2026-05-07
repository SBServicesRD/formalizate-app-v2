// scripts/setInvestorClaims.cjs
// ⚠️ SCRIPT ADMINISTRATIVO PUNTUAL
// Asigna custom claim role: "investor" a correos específicos.
// Ejecutar manualmente y luego cerrar sesión / volver a iniciar sesión.

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('../serviceAccountKey.json'); // ajusta si cambia

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = getAuth(admin.app());

const investorEmails = [
  'checogomez50@gmail.com',
  'espiral313@gmail.com',
  'smartbizservicesrd@gmail.com',
];

async function assignClaims() {
  for (const email of investorEmails) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      const currentClaims = userRecord.customClaims || {};
      if (currentClaims.role === 'investor') {
        console.log(`ℹ️  Ya tenía role=investor: ${email}`);
        continue;
      }
      await auth.setCustomUserClaims(userRecord.uid, {
        ...currentClaims,
        role: 'investor',
      });
      console.log(`✅ Claim asignado a ${email} (uid: ${userRecord.uid})`);
    } catch (error) {
      console.error(`❌ Error con ${email}:`, error.message || error);
    }
  }
  console.log('Nota: los usuarios deben cerrar sesión y volver a iniciar sesión.');
}

assignClaims().catch((error) => {
  console.error('❌ Error ejecutando script:', error);
  process.exit(1);
});

