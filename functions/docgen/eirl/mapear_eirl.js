/* =====================================================================
   MAPEADOR  app Formalízate (doc `ventas`, companyType=EIRL)  →  datos EIRL
   Convierte el documento del caso al formato que consume
   generar_constitucion_eirl.js. Titular único (partners[0]).

   Reusa el motor de números/fechas en letras de la carpeta SRL
   (mapear_db.js: fechaPartes, enLetras) para no duplicar la lógica.

   Uso como módulo:  const { mapearEirl } = require("./mapear_eirl.js");
   ===================================================================== */
const path = require("path");
const SRL_LIB = path.join(__dirname, "..", "srl", "mapear_db.js"); // (bundle CF)

const { fechaPartes, enLetras, notariaPorRegion } = require(SRL_LIB);

const miles = (n) => Number(n).toLocaleString("en-US");
const pesos2 = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const enLetrasMin = (n) => enLetras(n).toLowerCase();

// ---------- gentilicio / estado civil / documento ----------
const GENT = { "República Dominicana": ["dominicano", "dominicana"], "Dominicana": ["dominicano", "dominicana"], "Haití": ["haitiano", "haitiana"], "Estados Unidos": ["estadounidense", "estadounidense"], "Venezuela": ["venezolano", "venezolana"], "España": ["español", "española"], "Italia": ["italiano", "italiana"], "Francia": ["francés", "francesa"], "China": ["chino", "china"], "Colombia": ["colombiano", "colombiana"] };
function gentilicio(pais, gen) {
  const g = GENT[pais];
  if (g) return g[gen === "F" ? 1 : 0];
  if (!pais || /^otro$/i.test(pais)) return "[COMPLETAR nacionalidad]";
  return pais; // país no mapeado: se deja para revisión visual
}
function civil(estado, gen) {
  const e = String(estado || "").toLowerCase();
  if (e.includes("solter")) return gen === "F" ? "soltera" : "soltero";
  if (e.includes("casad")) return gen === "F" ? "casada" : "casado";
  if (e.includes("viud")) return gen === "F" ? "viuda" : "viudo";
  if (e.includes("divorci")) return gen === "F" ? "divorciada" : "divorciado";
  if (e.includes("unión") || e.includes("union") || e.includes("libre")) return gen === "F" ? "soltera" : "soltero";
  return "[COMPLETAR estado civil]";
}
function profesion(p, gen) {
  let s = String(p || "").trim().toLowerCase();
  if (!s) return "empresari" + (gen === "F" ? "a" : "o");
  return s;
}
function documento(tipo, num, gen) {
  const t = String(tipo || "").toLowerCase();
  const port = "portador" + (gen === "F" ? "a" : "");
  if (t.includes("pasaporte")) return port + " del Pasaporte No. " + (num || "[COMPLETAR documento]");
  return port + " de la Cédula de Identidad y Electoral No. " + (num || "[COMPLETAR documento]");
}
function domicilio(p) {
  const parts = [
    [p.addressStreet, p.addressNumber && "No. " + p.addressNumber].filter(Boolean).join(" "),
    p.addressBuilding, p.addressSuite && (/apto/i.test(p.addressSuite) ? p.addressSuite : "Apto. " + p.addressSuite),
    p.addressSector && "sector " + p.addressSector, p.addressCity, p.addressProvince,
  ].map((x) => (x || "").trim()).filter((x) => x && !/^(n\/?a|m\/?a)$/i.test(x));
  return parts.join(", ");
}
function lugarCorto(city, prov) {
  city = (city || "").trim(); prov = (prov || "").trim();
  if (!city && !prov) return "[COMPLETAR ciudad, provincia]";
  if (/distrito\s*nacional/i.test(prov) || /santo domingo de guzm/i.test(city)) return (city || "Santo Domingo de Guzmán") + ", Distrito Nacional";
  return city + (prov ? ", provincia " + prov : "");
}
function lugarSociedad(city, prov) {
  const corto = lugarCorto(city, prov);
  if (corto.startsWith("[COMPLETAR")) return corto;
  return /Distrito Nacional/.test(corto) ? corto + ", capital de la República Dominicana" : corto + ", República Dominicana";
}
// objeto: quita el prefacio "La empresa tendrá como objeto..." y baja la 1ª letra
function objetoEirl(s) {
  let o = String(s || "").trim().replace(/\.+\s*$/, "");
  o = o.replace(/^la empresa tendr[aá] como objeto(\s+social)?\s+principal\s+/i, "");
  if (!o) return "[COMPLETAR objeto social]";
  return o.charAt(0).toLowerCase() + o.slice(1);
}

// =====================================================================
function mapearEirl(db, opts = {}) {
  const ok = (g) => (g === "F" || g === "M") ? g : null;
  const base = (db.partners || [])[0] || {};
  const tit = (db.titulars || [])[0] || {};
  // género: --genero (override) > venta (partner/titular) > "M" con aviso
  const gen = ok((opts.generos || [])[0]) || ok(base.genero) || ok(tit.genero) || "M";
  const sinGen = !ok((opts.generos || [])[0]) && !ok(base.genero) && !ok(tit.genero);

  const nombre = [base.names, base.surnames].filter(Boolean).join(" ").trim()
    || [tit.names, tit.surnames].filter(Boolean).join(" ").trim() || "[COMPLETAR nombre del titular]";
  // documento: prioriza el de `titulars` si viene con mejor formato
  const docTipo = base.documentType || tit.documentType;
  const docNum = tit.idNumber || base.idNumber;
  const docFrase = documento(docTipo, docNum, gen);
  const generales = gentilicio(base.nationality, gen) + ", mayor de edad, "
    + civil(base.maritalStatus, gen) + ", " + profesion(base.profession, gen) + ", " + docFrase;
  const dom = domicilio(base) || "[COMPLETAR domicilio del titular]";

  const titular = { nombre, genero: gen, generales, documento: docFrase, domicilio: dom };
  if (sinGen) titular._REVISAR_genero = "[COMPLETAR género M/F — la app no lo provee]";

  const capital = Number(db.socialCapital || 0);
  const nombreEmpresa = String(db.companyName || "[COMPLETAR]").replace(/,?\s*(E\.?I\.?R\.?L\.?|EIRL)\s*$/i, "").trim();
  const durNum = Number(db.managementDuration || 6);
  const fp = opts.fecha ? fechaPartes(opts.fecha) : null;
  const C = "[COMPLETAR a los NN días del mes de MES del año AAAA-en-letras]";

  // gerente = titular (los datos traen rol Gerente en el socio único)
  const gerente = { nombre: titular.nombre, genero: gen, generales: titular.generales, mismoQueTitular: true };
  const NT = notariaPorRegion(db.companyCity, db.companyProvince); // notario + testigo por región

  return {
    carpetaSalida: "EXPEDIENTE GENERADO - " + nombreEmpresa.toUpperCase() + " EIRL",
    plan: db.packageName || "[COMPLETAR plan contratado]",
    empresa: {
      nombre: nombreEmpresa,
      denominacion: nombreEmpresa + ", E.I.R.L.",
      onapiNumero: db.onapiNumero || "[COMPLETAR No. ONAPI]",
      ciudad: lugarSociedad(db.companyCity, db.companyProvince),
      domicilio: domicilio({ addressStreet: db.companyStreet, addressNumber: db.companyStreetNumber, addressBuilding: db.companyBuilding, addressSuite: db.companySuite, addressSector: db.companySector, addressCity: db.companyCity, addressProvince: db.companyProvince }),
      capitalLetras: enLetras(capital) + " PESOS DOMINICANOS (RD$" + pesos2(capital) + ")",
      objeto: objetoEirl(db.socialObject),
      duracionGerenteLetras: enLetrasMin(durNum) + " (" + durNum + ") años",
      ejercicioInicio: "primero (1ro) del mes de enero",
      ejercicioCierre: "treinta y uno (31) del mes de diciembre",
    },
    titular,
    gerente,
    fechas: {
      redaccionLarga: fp ? fp.larga : C,   // "a los X días del mes de MES del año ... (AAAA)"
    },
    poder: {
      ciudad: lugarCorto(db.companyCity, db.companyProvince),
      fechaLarga: fp ? fp.redaccion : C,
      testigo: NT.testigo,
    },
    notario: NT.notario,
  };
}

module.exports = { mapearEirl };
