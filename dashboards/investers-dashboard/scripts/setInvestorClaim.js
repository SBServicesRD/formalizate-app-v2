const path = require('path');
const admin = require('firebase-admin');

const uid = process.argv[2];
if (!uid) {
  console.error('Uso: node setInvestorClaim.js <UID>');
  process.exit(1);
}

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, 'serviceAccountKey.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  });
} catch (error) {
  console.error('Error inicializando Firebase Admin SDK:', error);
  process.exit(1);
}

admin
  .auth()
  .setCustomUserClaims(uid, { role: 'investor' })
  .then(() => {
    console.log(`✅ Custom claim asignado: role=investor para UID ${uid}`);
    console.log('Nota: el usuario debe cerrar sesión y volver a iniciar sesión.');
  })
  .catch((error) => {
    console.error('❌ Error asignando el custom claim:', error);
    process.exit(1);
  });

