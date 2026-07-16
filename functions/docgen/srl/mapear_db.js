/* =====================================================================
   MAPEADOR  app Formalízate (doc de Firestore `ventas`)  →  datos.json
   Convierte el documento del caso al formato que consume
   generar_constitucion_srl.js. Calcula montos/cuotas/fechas EN LETRAS.

   Se usa de dos formas:
     1) Como MÓDULO:   const { mapear } = require("./mapear_db.js");
                       const datos = mapear(db, { fecha: new Date(), generos: ["F","M"] });
     2) Como CLI:      node mapear_db.js <archivo.json> [-w]
                       (-w sobreescribe datos.json; si no, escribe datos.MAPEADO.json)

   Lo único que la app NO provee y hay que pasar por fuera: el GÉNERO de cada
   socio (M/F) y la FECHA de la asamblea (si no se pasan: género=M y fechas [COMPLETAR]).
   ===================================================================== */
const fs = require("fs");
const path = require("path");

// ---------- números a letras (español, mayúsculas) ----------
const UNI = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE"];
const DEC = ["", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const CEN = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];
function centenas(n) {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  let s = "";
  const c = Math.floor(n / 100), r = n % 100;
  if (c) s += CEN[c] + (r ? " " : "");
  if (r <= 20) s += UNI[r];
  else { const d = Math.floor(r / 10), u = r % 10; s += (d === 2 ? "VEINTI" + UNI[u] : DEC[d] + (u ? " Y " + UNI[u] : "")); }
  return s.trim();
}
function enLetras(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "CERO";
  const millones = Math.floor(n / 1e6), milesN = Math.floor((n % 1e6) / 1000), resto = n % 1000;
  let p = [];
  if (millones) p.push(millones === 1 ? "UN MILLÓN" : centenas(millones) + " MILLONES");
  if (milesN) p.push(milesN === 1 ? "MIL" : centenas(milesN) + " MIL");
  if (resto) p.push(centenas(resto));
  return p.join(" ").replace(/\s+/g, " ").trim();
}
const fem = (s) => s.replace(/CIENTOS/g, "CIENTAS").replace(/UNO\b/g, "UNA"); // cuotas (femenino)
const miles = (n) => Number(n).toLocaleString("en-US");
const pesos2 = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cuotasLetras = (n) => fem(enLetras(n)) + " (" + miles(n) + ")";
const enLetrasMin = (n) => enLetras(n).toLowerCase();

// ---------- fecha → frases notariales en letras ----------
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function tituloCase(s) { return s.replace(/(^|\s)([a-záéíóúñ])/g, (m, sp, c) => sp + c.toUpperCase()).replace(/\bY\b/g, "y"); }
function parseFecha(f) {
  if (f instanceof Date) return f;
  const s = String(f).trim();
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);      // DD/MM/YYYY
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);          // YYYY-MM-DD
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(s); return isNaN(d) ? new Date() : d;
}
function fechaPartes(f) {
  const d = parseFecha(f), day = d.getDate(), mes = MESES[d.getMonth()], year = d.getFullYear();
  const card = day === 1 ? "" : enLetrasMin(day).replace(/veintiuno$/, "veintiún").replace(/\buno$/, "un");
  const diaLarga = day === 1 ? "al primer (1er) día" : "a los " + card + " (" + day + ") días";
  const diaCorta = day === 1 ? "primero (1ro)" : card + " (" + day + ")";
  const anioT = tituloCase(enLetrasMin(year)), anioL = enLetrasMin(year);
  return {
    larga: diaLarga + " del mes de " + mes + " del año " + anioT + " (" + year + ")",
    corta: diaCorta + " del mes de " + mes + " del año " + anioL + " (" + year + ")",
    redaccion: diaLarga + " del mes de " + mes + " del año " + anioL + " (" + year + ")",
  };
}

// ---------- nacionalidad / documento / generales ----------
const GENT = { "República Dominicana": ["dominicano", "dominicana"], "Dominicana": ["dominicano", "dominicana"], "Haití": ["haitiano", "haitiana"], "Estados Unidos": ["estadounidense", "estadounidense"], "Venezuela": ["venezolano", "venezolana"], "España": ["español", "española"], "Italia": ["italiano", "italiana"], "Francia": ["francés", "francesa"], "China": ["chino", "china"], "Honduras": ["hondureño", "hondureña"], "Colombia": ["colombiano", "colombiana"], "Puerto Rico": ["puertorriqueño", "puertorriqueña"], "Cuba": ["cubano", "cubana"], "México": ["mexicano", "mexicana"] };
function gentilicio(pais, gen) { const g = GENT[pais]; return g ? g[gen === "F" ? 1 : 0] : (pais || "[COMPLETAR nacionalidad]"); }
function civil(estado, gen) {
  const e = String(estado || "").toLowerCase();
  if (e.includes("solter")) return gen === "F" ? "soltera" : "soltero";
  if (e.includes("casad")) return gen === "F" ? "casada" : "casado";
  if (e.includes("viud")) return gen === "F" ? "viuda" : "viudo";
  if (e.includes("divorci")) return gen === "F" ? "divorciada" : "divorciado";
  return "[COMPLETAR estado civil]";
}
function documento(tipo, num, gen) {
  const t = String(tipo || "").toLowerCase();
  if (t.includes("pasaporte")) return "portador" + (gen === "F" ? "a" : "") + " del Pasaporte No. " + (num || "[COMPLETAR]");
  return "titular de la Cédula de Identidad y Electoral No. " + (num || "[COMPLETAR]");
}
function domicilio(p) {
  const parts = [
    [p.addressStreet, p.addressNumber && "No. " + p.addressNumber].filter(Boolean).join(" "),
    p.addressBuilding, p.addressSuite && "Apto. " + p.addressSuite,
    p.addressSector && "sector " + p.addressSector, p.addressCity, p.addressProvince,
  ].map((x) => (x || "").trim()).filter((x) => x && x.toLowerCase() !== "n/a" && x.toLowerCase() !== "m/a");
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

// ---------- notario único (política SBS jul-2026) ----------
// UN SOLO notario para TODOS los expedientes, sin importar la provincia de la empresa:
// Franklin (D.N.). Base legal: Ley 140-15 Art. 19 — la competencia territorial obliga al
// NOTARIO (instrumentar dentro de su demarcación), no a las partes; la restricción estricta
// es solo para actos sobre inmuebles. Los actos se firman/legalizan EN el D.N. y los
// firmantes domiciliados fuera llevan la cláusula "accidentalmente de tránsito" (práctica
// ya usada y aceptada en expedientes SBS: Culinatus, Crisocola).
const NOTARIO_UNICO = { nombre: "LIC. FRANKLIN M. ARAUJO CANELA", jurisdiccion: "Distrito Nacional", credencial: "Notario Público de los del número para el Distrito Nacional, con Colegiatura No. 3083" };
const TESTIGO_UNICO = { nombre: "Lucero López-Penha Ureña", genero: "F", generales: "dominicana, mayor de edad, portadora de la Cédula de Identidad y Electoral No. 402-2302707-5", domicilio: "Calle Puerto Rico No. 131, Alma Rosa II, Santo Domingo Este, provincia Santo Domingo, y accidentalmente de tránsito en la ciudad de Santo Domingo de Guzmán, Distrito Nacional, República Dominicana" };
// Lugar único de firma/legalización = jurisdicción del notario.
const LUGAR_FIRMA = "Santo Domingo de Guzmán, Distrito Nacional";
const esDN = (prov) => /distrito\s*nacional/i.test(String(prov || ""));
// (Reserva, por si se reactivan notarios regionales:
//  Vladimir De León Pérez col. 2583 + Xiomara Reyes Reyes [prov. Santo Domingo];
//  Felix Felipe Col. Notarios 1222 + Eridania Guzmán Duarte [Puerto Plata].)
function notariaPorRegion() {
  return { notario: NOTARIO_UNICO, testigo: TESTIGO_UNICO };
}

const valorNominal = 100; // RD$100 por cuota (estándar SBS)
// VOTOS = CUOTAS (Art. 113 SRL, sin tope). La asamblea es ORDINARIA (no constitutiva).
const votosDe = (cuotas) => miles(cuotas);

// =====================================================================
// FUNCIÓN PRINCIPAL: mapea el doc de la venta -> datos para el generador
//   opts.generos : array M/F por socio (ej. ["F","M","M"]). Si falta uno -> "M" + aviso.
//   opts.fecha   : Date o "DD/MM/YYYY" de la asamblea. Si falta -> [COMPLETAR].
// =====================================================================
function mapear(db, opts = {}) {
  const generos = opts.generos || [];
  const partners = db.partners || [];
  const ok = (g) => (g === "F" || g === "M") ? g : null;
  const socios = partners.map((p, i) => {
    // prioridad: flag --genero (override) > género guardado en la venta > "M" (con aviso)
    const gen = ok(generos[i]) || ok(p.genero) || "M";
    const sinGen = !ok(generos[i]) && !ok(p.genero);
    const roles = (p.roles || []).map((r) => String(r).toLowerCase());
    const cuotas = Number(p.shares || 0);
    const s = {
      nombre: [p.names, p.surnames].filter(Boolean).join(" ").trim(),
      genero: gen,
      generales: gentilicio(p.nationality, gen) + ", mayor de edad, " + civil(p.maritalStatus, gen) + ", " + documento(p.documentType, p.idNumber, gen),
      domicilio: domicilio(p) || "[COMPLETAR domicilio]",
      cuotas: miles(cuotas),
      cuotasLetras: cuotasLetras(cuotas),
      votos: votosDe(cuotas),
      porcentaje: (p.percentage != null ? p.percentage : "[COMPLETAR]") + "%",
      valorPagado: pesos2(cuotas * valorNominal),
      gerente: roles.includes("gerente"),
      preside: roles.includes("gerente"),
      // Cláusula "de tránsito" en el PDR: solo si su domicilio consta y está fuera del D.N.
      transitoDN: !!p.addressProvince && !esDN(p.addressProvince),
    };
    if (sinGen) s._REVISAR_genero = "[COMPLETAR género M/F — la app no lo provee]";
    return s;
  });
  let yaPreside = false;
  socios.forEach((s) => { if (s.preside && !yaPreside) yaPreside = true; else s.preside = false; });
  if (!yaPreside && socios[0]) socios[0].preside = true;

  const capital = Number(db.socialCapital || 0);
  const totalCuotas = capital / valorNominal;
  const nombre = String(db.companyName || "[COMPLETAR]").replace(/,?\s*(S\.?R\.?L\.?|SRL)\s*$/i, "").trim();
  const fp = opts.fecha ? fechaPartes(opts.fecha) : null;
  const C = "[COMPLETAR a los NN días del mes de MES del año AAAA-en-letras]";
  const NT = notariaPorRegion(db.companyCity, db.companyProvince); // notario + testigo por región

  return {
    carpetaSalida: "EXPEDIENTE GENERADO - " + nombre.toUpperCase() + " SRL",
    plan: db.packageName || "[COMPLETAR plan contratado]",
    sociedad: {
      nombre, nombreComercial: nombre,
      onapiNumero: db.onapiNumero || "[COMPLETAR No. ONAPI]",
      ciudad: lugarSociedad(db.companyCity, db.companyProvince),
      domicilio: domicilio({ addressStreet: db.companyStreet, addressNumber: db.companyStreetNumber, addressBuilding: db.companyBuilding, addressSuite: db.companySuite, addressSector: db.companySector, addressCity: db.companyCity, addressProvince: db.companyProvince }) + ", República Dominicana",
      capital: "RD$" + pesos2(capital),
      capitalLetras: enLetras(capital) + " PESOS DOMINICANOS (RD$" + pesos2(capital) + ")",
      totalCuotas: miles(totalCuotas),
      totalCuotasLetras: cuotasLetras(totalCuotas),
      totalVotos: votosDe(totalCuotas),
      valorNominalLetras: "CIEN PESOS DOMINICANOS (RD$100.00)",
      objetoIntro: db.socialObject ? db.socialObject.replace(/^\s*la (sociedad|empresa|compañía|compania)\s+(tiene|tendrá|tendra)\s+(como|por)\s+objeto(\s+social)?(\s+principal)?\s*:?\s*/i, "") : "[COMPLETAR objeto social]",
      objetoItems: [],
      ejercicioInicio: "primero (1ro) de enero",
      ejercicioCierre: "treinta y uno (31) de diciembre",
    },
    socios,
    gerencia: {
      todosLosSocios: socios.length > 0 && socios.every((s) => s.gerente),
      duracionLetras: db.managementDuration ? enLetrasMin(db.managementDuration) + " (" + db.managementDuration + ") años" : "seis (6) años",
      poderesBancariosTodos: !/solo el gerente/i.test(db.bankPowers || ""),
      poderesBancariosConjuntos: /conjunt|mancomun|ambas firmas/i.test(db.bankPowers || ""),
      firmaLegalConjunta: /conjunt|mancomun|ambas firmas/i.test(db.legalSignaturePowers || ""),
    },
    fechas: {
      asambleaLarga: fp ? fp.larga : C,
      asambleaCorta: fp ? fp.corta : C,
      horaApertura: "tres horas de la tarde (03:00 p.m.)",
      horaCierre: "cinco horas de la tarde (05:00 p.m.)",
      redaccionLarga: fp ? fp.redaccion : C,
    },
    poder: {
      // El PDR se firma y legaliza en la jurisdicción del notario único (D.N.),
      // no en la ciudad de la empresa. Los socios de fuera llevan "de tránsito".
      ciudad: LUGAR_FIRMA,
      vigenciaLetras: "noventa (90) días",
      testigo: NT.testigo,
      fechaLarga: fp ? fp.redaccion : C,
    },
    notario: NT.notario,
  };
}

module.exports = { mapear, fechaPartes, enLetras, notariaPorRegion };

// ---------- CLI ----------
if (require.main === module) {
  const inFile = process.argv[2];
  const write = process.argv.includes("-w") || process.argv.includes("--write");
  if (!inFile) { console.error("Uso: node mapear_db.js <archivo.json> [-w]"); process.exit(1); }
  const db = JSON.parse(fs.readFileSync(path.resolve(inFile), "utf8"));
  const datos = mapear(db, {});
  const outName = write ? "datos.json" : "datos.MAPEADO.json";
  fs.writeFileSync(path.join(__dirname, outName), JSON.stringify(datos, null, 2), "utf8");
  console.log("Escrito: " + outName + "\nREVISAR: género de socios, fechas en letras, No. ONAPI.");
}
