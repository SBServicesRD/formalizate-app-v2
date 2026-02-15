const REQUIRED_VITE_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

function loadDotenvIfAvailable() {
  if (process.env.SKIP_DOTENV === "1") {
    return;
  }
  try {
    require("dotenv").config({ path: ".env" });
    require("dotenv").config({ path: ".env.local" });
    require("dotenv").config({ path: ".env.production" });
    require("dotenv").config({ path: ".env.production.local" });
  } catch (_error) {
    // dotenv is optional in CI if build env vars are already present.
  }
}

function missingVars() {
  return REQUIRED_VITE_VARS.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim() === "";
  });
}

loadDotenvIfAvailable();
const missing = missingVars();

if (missing.length > 0) {
  console.error("❌ Build cancelado: faltan variables VITE_* requeridas.");
  console.error(`   Variables faltantes: ${missing.join(", ")}`);
  console.error(
    "   Para Cloud Run con --source, configura también --set-build-env-vars o --build-env-vars-file."
  );
  process.exit(1);
}

console.log("✅ VITE_* requeridas presentes para build.");
