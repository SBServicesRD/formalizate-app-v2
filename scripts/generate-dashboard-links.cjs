/**
 * Genera magic links + PINs para ventas existentes.
 * Uso: node scripts/generate-dashboard-links.cjs
 */
const admin = require('firebase-admin');
const crypto = require('crypto');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.settings({ databaseId: 'formalizate-app-prod' });

// ─── Constantes (deben coincidir con functions/index.js) ───────────────────
const CUSTOMER_MAGIC_SECRET = 'c213c08f1d7629210dbde5661e2bf67c5221d24b541e6086e715daa568f1c9a7';
const CUSTOMER_DASHBOARD_URL = 'https://formalizate-dash.web.app';
const PIN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePin(length = 6) {
  let pin = '';
  for (let i = 0; i < length; i++) pin += PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)];
  return pin;
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin.toUpperCase().trim()).digest('hex');
}

function base64UrlEncode(input) {
  return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function signToken(payload, secret) {
  const header  = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = base64UrlEncode(JSON.stringify(payload));
  const sig     = crypto.createHmac('sha256', secret).update(`${header}.${body}`)
    .digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return `${header}.${body}.${sig}`;
}

async function generateCustomerLink(searchTerm) {
  // Busca la venta más reciente que coincida con companyName o applicant.names
  const snapshot = await db.collection('ventas').get();
  let match = null;

  snapshot.forEach(doc => {
    const d = doc.data();
    const company  = (d.companyName || '').toLowerCase();
    const names    = (d.applicant?.names || d.nombre || '').toLowerCase();
    const email    = (d.applicant?.email || d.userEmail || '').toLowerCase();
    const term     = searchTerm.toLowerCase();

    if (company.includes(term) || names.includes(term) || email.includes(term)) {
      // Quedarse con el más reciente
      if (!match || (d.fechaCreacion?.toMillis?.() || 0) > (match.data.fechaCreacion?.toMillis?.() || 0)) {
        match = { id: doc.id, data: d };
      }
    }
  });

  if (!match) {
    console.log(`❌ No se encontró ninguna venta con término: "${searchTerm}"`);
    return null;
  }

  const pin = generatePin();
  const pinHash = hashPin(pin);
  const token = signToken({ saleId: match.id, role: 'customer', issuedAt: Math.floor(Date.now() / 1000) }, CUSTOMER_MAGIC_SECRET);
  const url = `${CUSTOMER_DASHBOARD_URL}/?token=${token}`;

  // Guardar el pinHash en Firestore
  await db.collection('ventas').doc(match.id).update({ pinHash });

  return {
    empresa: match.data.companyName || match.data.applicant?.names || match.id,
    saleId: match.id,
    orderId: match.data.orderId || '—',
    pin,
    url,
  };
}

async function main() {
  console.log('\n🔍 Buscando ventas...\n');

  // Cliente: Lumbre
  const lumbre = await generateCustomerLink('lumbre');
  if (lumbre) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 CLIENTE: ${lumbre.empresa}`);
    console.log(`   Orden:   ${lumbre.orderId}`);
    console.log(`   Sale ID: ${lumbre.saleId}`);
    console.log(`   PIN:     ${lumbre.pin}`);
    console.log(`   URL:     ${lumbre.url}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // También listar los inversionistas que hay en Firestore (para encontrar José Carlos)
  console.log('🔍 Buscando "jose carlos" en ventas (para identificar email)...\n');
  const jc = await generateCustomerLink('jose carlos');
  if (jc) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Nombre/Empresa: ${jc.empresa}`);
    console.log(`   Sale ID:        ${jc.saleId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
