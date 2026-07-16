/* =====================================================================
   GENERADOR DE EXPEDIENTE — CONSTITUCIÓN DE E.I.R.L. (Ley 479-08 y 31-11)
   Lee datos (EIRL) y produce los 2 documentos .docx que redacta SBS,
   con estilo y textos legales CONGELADOS. Solo cambian los datos.

      1. Acto Constitutivo (Acto bajo firma privada) — 28 artículos
      2. Poder de Representación (PDR)

   Estándar de redacción tomado de: ENMARIE VARIEDADES, E.I.R.L. (Acto,
   firmado y en uso) y PDR CULINATUS/CRISOCOLA. Diseño = mismo premium SRL.

   Uso:  node generar_constitucion_eirl.js   (con DATOS_FILE y OUT_DIR por env)
   ===================================================================== */
const fs = require("fs");
const path = require("path");
// (bundle Cloud Functions) docx se resuelve desde functions/node_modules
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType, VerticalAlign,
  Header, Footer, PageNumber, TabStopType,
} = require("docx");

const D = JSON.parse(fs.readFileSync(process.env.DATOS_FILE || path.join(__dirname, "datos.json"), "utf8"));
const OUTDIR = process.env.OUT_DIR || path.join(__dirname, D.carpetaSalida || "EXPEDIENTE GENERADO");

// ---------- estilo (idéntico al generador SRL: sobrio premium) ----------
const FONT = "Cambria", META = "7A7A7A", RULE = "BFBFBF", RED = "C00000";
const MT = 1440, MS = 1814;
const PAGE = { size: { width: 12240, height: 15840 }, margin: { top: MT, right: MS, bottom: MT, left: MS } };
const CW = 12240 - 2 * MS;
const Q = (s) => "“" + s + "”";
const BODY = 21, T_EMPRESA = 30, T_DOC = 24;
const SC = 14;

function R(text, o = {}) { return new TextRun({ text: String(text), font: FONT, size: o.size || BODY, bold: !!o.bold, italics: !!o.italics, allCaps: !!o.caps, smallCaps: !!o.sc, characterSpacing: o.spacing, color: o.color || "000000" }); }
const RB = (t, o = {}) => R(t, { ...o, bold: true });
function F(value, o = {}) {
  const v = String(value == null ? "" : value);
  if (v.trim().startsWith("[COMPLETAR")) return new TextRun({ text: v, font: FONT, size: o.size || BODY, bold: true, color: RED });
  return R(v, o);
}
function P(runs, o = {}) {
  return new Paragraph({
    alignment: o.align || AlignmentType.JUSTIFIED,
    spacing: { after: o.after != null ? o.after : 90, before: o.before || 0, line: o.line || 240, lineRule: "auto" },
    indent: o.indent, numbering: o.numbering, border: o.border,
    pageBreakBefore: o.pageBreakBefore, keepNext: o.keepNext,
    children: Array.isArray(runs) ? runs : [runs],
  });
}
const SPACER = (h) => P([R("")], { after: h || 0 });

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const cellNone = { top: NB, bottom: NB, left: NB, right: NB };
function cell(kids, o = {}) {
  return new TableCell({
    width: { size: o.w, type: WidthType.DXA }, columnSpan: o.span,
    verticalAlign: o.valign || VerticalAlign.CENTER,
    margins: { top: 50, bottom: 50, left: 110, right: 110 },
    borders: o.borders || cellNone,
    children: Array.isArray(kids) ? kids : [kids],
  });
}
const firmaLinea = (o) => P([R(" ")], { align: AlignmentType.CENTER, after: 40, indent: { left: 360, right: 360 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 2 } }, ...(o || {}) });
function firmaCentrada(c, name, lines, extraSpace) {
  c.push(SPACER(extraSpace != null ? extraSpace : 300));
  c.push(firmaLinea({ indent: { left: 2400, right: 2400 } }));
  c.push(P([RB(name)], { align: AlignmentType.CENTER, after: 0 }));
  (lines || []).forEach((l) => c.push(P([R(l, { size: 18, color: META })], { align: AlignmentType.CENTER, after: 0 })));
}

const numbering = { config: [
  { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: FONT, size: BODY } } }] },
] };
function makeHeader(docName) {
  return new Header({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CW }],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
    spacing: { after: 200 },
    children: [R(DEN, { size: 17, italics: true, color: META }), R("\t", { size: 17 }), R(docName, { size: 17, sc: true, spacing: 20, color: META })],
  })] });
}
function makeFooter() {
  return new Footer({ children: [new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 160 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
    children: [R("— ", { size: 17, color: META }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, color: META }), R(" —", { size: 17, color: META })],
  })] });
}
function buildDocument(docName, children) {
  return new Document({ styles: { default: { document: { run: { font: FONT, size: BODY } } } }, numbering,
    sections: [{ properties: { page: PAGE }, headers: { default: makeHeader(docName) }, footers: { default: makeFooter() }, children }] });
}
function capitulo(c, roman, subtitulo) {
  c.push(P([RB(roman, { sc: true, spacing: SC + 6, size: 23 })], { align: AlignmentType.CENTER, before: 260, after: 30, keepNext: true }));
  c.push(P([R(subtitulo, { italics: true, color: "555555" })], { align: AlignmentType.CENTER, after: 70, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } } }));
}
function art(c, n, head, bodyRuns, o) {
  const h = String(head).replace(/\.\s*$/, "");
  c.push(P([RB("Artículo " + n + ". " + h + ".  ", { sc: true }), ...bodyRuns], { before: 60, ...(o || {}) }));
}
function artHead(c, n, head, introRuns) {
  const h = String(head).replace(/\.\s*$/, "");
  const lead = RB("Artículo " + n + ". " + h + ".  ", { sc: true });
  c.push(P(introRuns ? [lead, ...introRuns] : [lead], { before: 60, after: introRuns ? 40 : 30, keepNext: true }));
}
const bullets = (c, items) => items.forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
const letraList = (c, items) => items.forEach((it, i) => c.push(P([R("abcdefghijklmnop"[i] + ") " + it)], { indent: { left: 600, hanging: 300 }, after: 20 })));

// ---------- atajos de datos + género ----------
const E = D.empresa, T = D.titular, GER = D.gerente, PO = D.poder, NO = D.notario, FE = D.fechas;
const DEN = E.denominacion;
const PLAN = D.plan || "[COMPLETAR plan contratado]";
const upper = (s) => String(s).toUpperCase();
const FE_F = T.genero === "F";
const PROP = FE_F ? "La Propietaria" : "El Propietario";
const de_PROP = FE_F ? "de La Propietaria" : "del Propietario";
const a_PROP = FE_F ? "a La Propietaria" : "al Propietario";
const por_PROP = FE_F ? "por La Propietaria" : "por El Propietario";
const srSra = FE_F ? "la Sra." : "el Sr.";
const unicoProp = FE_F ? "cuya única propietaria es " : "cuyo único propietario es ";
const elSenor = FE_F ? "la señora" : "el señor";
const ElSenor = FE_F ? "la Señora" : "el Señor";
const domiciliadoR = FE_F ? "domiciliada y residente en " : "domiciliado y residente en ";
const domFrase = (dom) => domiciliadoR + dom + ", República Dominicana";
// Cláusula de comparecencia: acto y PDR se firman/legalizan en la jurisdicción del notario
// (D.N.); el titular domiciliado fuera consta "de tránsito" (Ley 140-15, Art. 19).
const TRANSITO_DN = T.transitoDN ? ", y accidentalmente de tránsito en la ciudad de Santo Domingo de Guzmán, Distrito Nacional" : "";
const LUGAR_FIRMA = D.lugarFirma || E.ciudad;

// =====================================================================
// DOC 1 — ACTO CONSTITUTIVO (Acto bajo firma privada)
// =====================================================================
function docActo() {
  const c = [];
  c.push(P([RB(DEN, { sc: true, spacing: SC, size: T_EMPRESA })], { align: AlignmentType.CENTER, after: 30 }));
  c.push(P([RB("Acto bajo firma privada de constitución de E.I.R.L.", { sc: true, spacing: SC, size: T_DOC, color: "333333" })], { align: AlignmentType.CENTER, after: 240, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 8 } } }));

  c.push(P([R("Quien suscribe, "), RB(upper(T.nombre)), R(", " + T.generales + ", " + domFrase(T.domicilio) + TRANSITO_DN + ", por medio del presente acto declaro la voluntad de constituir una empresa individual de responsabilidad limitada, la cual se regirá por los siguientes")]));
  c.push(P([RB("ESTATUTOS", { sc: true, spacing: SC })], { align: AlignmentType.CENTER, before: 40, after: 60 }));

  // ----- CAPÍTULO PRIMERO -----
  capitulo(c, "Capítulo Primero", "Denominación, objeto, duración y domicilio de la empresa");
  art(c, "1", "Denominación", [R("La denominación de la Empresa es "), RB(DEN), R(", " + unicoProp + srSra + " "), RB(upper(T.nombre)), R(", " + T.documento + ", " + domFrase(T.domicilio) + ".")]);
  art(c, "2", "Objeto", [R("El objeto principal de la Empresa es "), F(E.objeto), R(", así como toda clase de actividad relacionada con el objeto principal y de lícito comercio.")]);
  art(c, "3", "Duración", [R("La Empresa tendrá una duración ilimitada, iniciando sus actividades a partir de la fecha del depósito del presente acto en el Registro Mercantil. Los actos y contratos celebrados en su nombre antes de que aquella se inscriba en los Registros Públicos serán reconocidos como válidos y ratificados al adquirir la Empresa su personalidad jurídica plena.")]);
  art(c, "4", "Domicilio", [R("El domicilio de la Empresa se fija en " + E.domicilio + ", República Dominicana, pudiendo establecer sucursales o agencias dentro o fuera del territorio nacional.")]);

  // ----- CAPÍTULO SEGUNDO -----
  capitulo(c, "Capítulo Segundo", "Del capital, del aporte y de la responsabilidad");
  art(c, "5", "Capital", [R("El capital de la Empresa es de "), F(E.capitalLetras), R(", totalmente pagado y aportado " + por_PROP + " en efectivo.")]);
  art(c, "6", "Responsabilidad " + de_PROP, [R("La responsabilidad " + de_PROP + " queda limitada exclusivamente al capital aportado a la Empresa, conforme ha sido consignado en el presente documento. " + PROP + " no responderá personalmente ante los acreedores de la Empresa con sus demás bienes, propios o comunes, sino en los casos que determina la Ley. La Empresa será responsable de sus obligaciones con su propio patrimonio.")]);

  // ----- CAPÍTULO TERCERO -----
  capitulo(c, "Capítulo Tercero", "De los órganos de la empresa");
  art(c, "7", "Órganos de la Empresa", [R("Son órganos de la Empresa: a) " + PROP + "; b) El Gerente. " + PROP + " podrá asumir las funciones de Gerente o designar a una persona con adecuada remuneración para estos fines.")]);
  art(c, "8", "Órgano Máximo", [R(PROP + " es el órgano máximo de la Empresa y tiene a su cargo la decisión sobre los bienes y actividades de ésta.")]);
  artHead(c, "9", "Atribuciones " + de_PROP, [R("Corresponde " + a_PROP + ":")]);
  letraList(c, [
    "Aprobar o desaprobar las cuentas y el balance general de cada ejercicio;",
    "Disponer la aplicación de los beneficios netos luego de efectuar la cobertura de la participación de los trabajadores y de las reservas y provisiones legales;",
    "Designar y sustituir el Gerente, así como los liquidadores, otorgándoles los poderes requeridos para el cumplimiento de sus funciones, y asignarles salario;",
    "Modificar el acto de constitución de la Empresa;",
    "Decidir sobre los demás asuntos que requiera el interés de la Empresa o que la Ley señale.",
  ]);
  artHead(c, "10", "Responsabilidad " + de_PROP + " ante terceros", [R(PROP + " responderá personalmente ante terceros en forma limitada en los siguientes casos:")]);
  letraList(c, [
    "Cuando no se asigne el representante legal de la Empresa;",
    "Si hubiera efectuado retiros del patrimonio de la Empresa que no correspondan a beneficios debidamente comprobados;",
    "En todos los casos previstos en los artículos 509, 510 y 512 de las Leyes Nos. 479-08 y 31-11;",
    "Si, producida una pérdida del cincuenta por ciento (50%) o más del capital y transcurrido un ejercicio económico, persistiera tal situación sin haberse compensado el desmedro, y no se hubiera dispuesto la reducción del capital o la disolución de la Empresa.",
  ]);
  art(c, "11", "La Gerencia", [R("La Gerencia es el órgano administrativo de la Empresa y tiene la representación legal de la misma. La Gerencia será desempeñada por una persona natural, con capacidad para contratar, la que será designada " + por_PROP + ", quien le conferirá los mandatos, generales o especiales, que estime convenientes.")]);
  art(c, "12", "Duración y Cese del Gerente", [R("El cargo de Gerente es personal e indelegable y de duración " + E.duracionGerenteLetras + ". El nombramiento puede ser revocado en cualquier momento " + por_PROP + ". El cargo concluye, además, por: (a) renuncia; (b) muerte; (c) enfermedad que lo imposibilite para el ejercicio de sus funciones; y (d) incapacidad civil del Gerente.")]);
  artHead(c, "13", "Atribuciones del Gerente", [R("Corresponde al Gerente:")]);
  letraList(c, [
    "Organizar el régimen interno de la Empresa, contratando al personal necesario, fijándole sus remuneraciones y dando por terminados sus servicios;",
    "Realizar los actos jurídicos y celebrar los contratos que fueran necesarios para el cumplimiento de los fines de la Empresa;",
    "Representar a la Empresa, judicial y extrajudicialmente;",
    "Abrir y mantener una contabilidad organizada de conformidad con las disposiciones de la ley y los usos comerciales;",
    "Preparar o hacer preparar los estados financieros fiscales y el informe de gestión anual de la Empresa en los tres meses siguientes al cierre de cada gestión;",
    "Velar por la existencia, regularidad y veracidad de los libros y registros contables, formulando en su oportunidad las cuentas y el balance general;",
    "Dar cuenta " + a_PROP + ", periódicamente, de la marcha de la Empresa;",
    "Celebrar los actos o contratos siguientes: ceder, traspasar o gravar, a cualquier título, la propiedad intelectual y/o industrial; enajenar o gravar establecimientos de comercio propiedad de la Empresa; arrendar y subarrendar muebles o inmuebles de la Empresa; abrir y operar cuentas corrientes, de ahorros o depósitos a la vista y a plazo en instituciones bancarias y financieras en cualquier moneda; entre otros. Todas las acciones que involucren afectación del capital o de los bienes de la Empresa deben contar previamente con la autorización por escrito " + de_PROP + " para su validez;",
    "Estas atribuciones podrán ser ampliadas o limitadas " + por_PROP + ", lo cual hará constar por escrito.",
  ]);
  art(c, "14", "Responsabilidad del Gerente", [R("El Gerente responderá personalmente " + a_PROP + " y ante terceros por los daños y perjuicios que ocasione en el cumplimiento de sus funciones, siendo particularmente responsable por la conservación de los bienes de la Empresa consignados en los inventarios, así como de los fondos y, en general, del patrimonio de la Empresa, y por el uso indebido de los recursos de la Empresa en negocios distintos a su objeto. " + PROP + " será solidariamente responsable con el Gerente por los actos violatorios de la Ley que practique éste y que consten de su autorización, si no los impugna judicialmente. Las acciones de responsabilidad contra el Gerente prescriben conforme al tipo de infracción, en los plazos establecidos en el derecho común y en las Leyes Nos. 479-08 y 31-11.")]);
  art(c, "15", "Decisiones " + de_PROP, [R("Las decisiones " + de_PROP + " referentes a los asuntos que tengan que ver con los cambios de funciones o atribuciones del Gerente se harán constar por escrito; estos documentos serán archivados para ser utilizados como instrumentos operativos de la Empresa. En cada documento se anotará el lugar, la fecha y la hora en que se asienta, firmado " + por_PROP + " y por el Gerente, a partir de lo cual el mismo tiene fuerza legal. Las decisiones que impliquen una reducción o aumento de las atribuciones del Gerente y que estén permitidas dentro de los estatutos deben ser depositadas en el Registro Mercantil para conocimiento de los terceros, y, en caso de que modifiquen o alteren lo consignado en el presente documento, deberán ser rendidas en forma auténtica mediante declaración ante notario.")]);
  art(c, "16", "Nombramiento y Remoción del Gerente", [R("El nombramiento y remoción del Gerente y demás apoderados se hará " + por_PROP + " por escrito, en el que constarán las facultades que se le confieren, y serán registrados en el Registro Mercantil.")]);

  // ----- CAPÍTULO CUARTO -----
  capitulo(c, "Capítulo Cuarto", "De la modificación de los estatutos y del capital");
  art(c, "17", "Modificación de los Estatutos", [R("En cualquier tiempo puede " + PROP + " modificar los términos de los Estatutos de constitución de la Empresa, aumentar o reducir el capital, siguiendo en cada caso los procedimientos establecidos por las Leyes Nos. 479-08 y 31-11.")]);

  // ----- CAPÍTULO QUINTO -----
  capitulo(c, "Capítulo Quinto", "Del balance y la distribución de los beneficios");
  art(c, "18", "Estados Financieros y Balance", [R("Dentro del plazo de tres (3) meses, contados a partir del cierre del ejercicio fiscal de la Empresa, el Gerente debe presentar el informe de gestión anual y los estados financieros. Igualmente, deberá presentar " + a_PROP + " el Balance General y el Inventario que reflejen las ganancias y pérdidas y demás movimientos de la Empresa, sin que ello signifique un descargo sobre la responsabilidad que pudiera corresponderle.")]);
  art(c, "19", "Beneficios Netos", [R("Determinación de los beneficios netos. Se procederá al cálculo de la repartición de utilidades conforme a la Ley.")]);
  art(c, "20", "Reserva Legal", [R("De los beneficios líquidos que obtenga la Empresa se separará anualmente al menos el cinco por ciento (5%), hasta alcanzar el diez por ciento (10%) del capital, para formar el fondo de reserva legal de la Empresa.")]);
  art(c, "21", "Derecho a los Beneficios", [R(PROP + " tiene el derecho, luego de efectuadas las deducciones indicadas en las cláusulas que anteceden, a percibir los beneficios obtenidos, siempre que el valor del patrimonio de la Empresa no resulte inferior al capital.")]);
  art(c, "22", "Ejercicio Social", [R("El ejercicio social comenzará el día " + E.ejercicioInicio + " y terminará el día " + E.ejercicioCierre + " de cada año. Por excepción, el primer ejercicio social abarcará el tiempo comprendido entre la fecha de la constitución definitiva de la Empresa y el día " + E.ejercicioCierre + " del presente año.")]);

  // ----- CAPÍTULO SEXTO -----
  capitulo(c, "Capítulo Sexto", "Transformación, fusión, transferencia, disolución y liquidación");
  art(c, "23", "Transformación", [R("La transformación de la Empresa a sociedad de cualquier tipo puede ser acordada " + por_PROP + ", con arreglo a las disposiciones legales vigentes.")]);
  art(c, "24", "Fusión y Transferencia", [R("La fusión o transferencia de la Empresa se efectuará con arreglo a las disposiciones de la Ley. La fusión, transferencia y disolución se harán constar por escritura pública o acto bajo firma privada que se inscribirá en el Registro Mercantil.")]);
  artHead(c, "25", "Disolución", [R("La disolución de la Empresa procede:")]);
  letraList(c, [
    "Por voluntad del titular, con arreglo a los trámites de la Ley;",
    "Por conclusión de su objeto o imposibilidad de realizarlo;",
    "Por fusión, en los casos señalados por la Ley;",
    "Por quiebra de la Empresa;",
    "Por producirse pérdidas que reduzcan el patrimonio de la Empresa en más de cincuenta por ciento (50%), si, transcurrido un ejercicio económico, no se hubiese compensado el desmedro o reducido el capital;",
    "Por resolución judicial, en los casos señalados por la Ley.",
  ]);
  art(c, "26", "Liquidador", [R("El cargo de liquidador puede ser asumido " + por_PROP + ", el Gerente u otra persona que designe " + PROP + " o el Juez, en su caso. El cargo de liquidador puede ser revocado en cualquier momento " + por_PROP + " o por el Juez, en su caso. El liquidador ceñirá su actuación a las disposiciones establecidas en la Ley de la materia.")]);
  art(c, "27", "Remanente de la Liquidación", [R("Liquidada la Empresa y pagados sus acreedores, el titular tiene derecho al remanente de la liquidación, así como a los libros y documentos de la Empresa, por el término de cinco (5) años, bajo su responsabilidad.")]);
  art(c, "28", "Muerte del Titular", [R("La muerte del titular no disolverá ni liquidará la Empresa, la cual puede ser vendida, puesta en liquidación o transformada en cualquier tipo societario por sus herederos o continuadores jurídicos, según sea el caso, o atribuida a un causahabiente de conformidad con lo que dispone el artículo 464 de la Ley No. 479-08.")]);

  // ----- CAPÍTULO SÉPTIMO -----
  capitulo(c, "Capítulo Séptimo", "Disposiciones transitorias");
  c.push(P([RB("Único.  ", { sc: true }), R("Se designa como primer Gerente " + (FE_F ? "a la señora " : "al señor ")), RB(upper(GER.nombre)), R(", " + GER.generales + ", con las atribuciones señaladas en estos Estatutos y en la Ley.")], { before: 60 }));

  // firma del propietario
  firmaCentrada(c, upper(T.nombre), [FE_F ? "Propietaria" : "Propietario"], 320);

  // legalización notarial (un solo firmante)
  c.push(SPACER(220));
  c.push(P([R("Yo, "), RB(NO.nombre), R(", " + NO.credencial + ", "), RB("CERTIFICO Y DOY FE"), R(" que la firma que antecede fue puesta libre y voluntariamente en mi presencia por " + ElSenor + " "), RB(upper(T.nombre)), R(", de generales que constan, quien me asegura que es la firma que acostumbra a usar en todos sus actos, por lo que debe merecer entero crédito. En " + LUGAR_FIRMA + ", " + FE.redaccionLarga + ".")]));
  firmaCentrada(c, NO.nombre, ["Notario Público"], 280);
  return buildDocument("Acto Constitutivo", c);
}

// =====================================================================
// DOC 2 — PODER DE REPRESENTACIÓN (PDR)
// =====================================================================
function litItems(c, items, kind) {
  const letras = "abcdefghijklmnopqrstuvwxyz";
  items.forEach((runs, i) => {
    if (kind === "bullet") c.push(P(runs, { numbering: { reference: "bullets", level: 0 }, after: 20 }));
    else { const tag = kind === "abc" ? letras[i] + ") " : (i + 1) + ". "; c.push(P([R(tag), ...runs], { indent: { left: 600, hanging: 280 }, after: 20 })); }
  });
}
function docPoder() {
  const c = [];
  c.push(P([RB("Poder de Representación", { sc: true, spacing: SC, size: T_DOC })], { align: AlignmentType.CENTER, after: 240, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 8 } } }));
  c.push(P([RB("QUIEN SUSCRIBE: "), R(elSenor + " "), RB(upper(T.nombre)), R(", " + T.generales + ", " + domFrase(T.domicilio) + TRANSITO_DN + " (en adelante, el “PODERDANTE”).")]));
  c.push(P([RB("OTORGA PODER: "), R("Tan amplio y suficiente como en derecho sea necesario a la sociedad "), RB("SMART BIZ SERVICES, SRL"), R(", Registro Nacional de Contribuyentes (RNC) No. 1-31-68858-6, con domicilio social en la Calle Padres Paúles No. 61, Apto. 5-A, Ensanche Ozama, Santo Domingo Este, República Dominicana; debidamente representada por su Gerente General, el señor "), RB("JULIO DARWIN MENDOZA ESTRELLA"), R(", dominicano, mayor de edad, titular de la cédula de identidad y electoral No. 223-0072682-9 (en adelante, el “APODERADO”), para que, actuando en nombre y representación del PODERDANTE, tal como si fuera él mismo, pueda realizar, en el marco del plan de servicios “"), F(PLAN, { bold: true }), R("” contratado con dicha sociedad, de manera enunciativa, mas no limitativa, las siguientes acciones:")]));
  c.push(P([RB("PRIMERO: FACULTADES DE GESTIÓN ADMINISTRATIVA. "), R("Solicitar, depositar, tramitar, gestionar, modificar, retirar y firmar toda la documentación necesaria ante las autoridades competentes para:")], { after: 40 }));
  litItems(c, [
    [R("La constitución de empresas o sociedades bajo cualquier modalidad legal, incluyendo pero no limitado a la empresa "), RB(DEN), R(".")],
    [R("El registro, renovación y modificación de nombres comerciales, marcas, rótulos y cualquier otro signo distintivo.")],
    [R("La obtención, renovación y actualización de Registros Mercantiles.")],
    [R("La inscripción y actualización ante el Registro Nacional de Contribuyentes (RNC).")],
    [R("La gestión de registros de importación y exportación, firmas digitales y otros servicios relacionados ante la Dirección General de Aduanas (DGA) y las Cámaras de Comercio y Producción.")],
    [R("La inscripción, modificación y actualización ante el Registro de Proveedores del Estado (RPE) de la Dirección General de Contrataciones Públicas (DGCP).")],
  ], "abc");
  c.push(P([RB("SEGUNDO: AMPLIACIÓN DE FACULTADES. "), R("El APODERADO queda expresamente facultado para:")], { before: 40, after: 40 }));
  litItems(c, [
    [R("Subsanar errores u omisiones en los expedientes y documentos depositados.")],
    [R("Responder a requerimientos administrativos de cualquier índole realizados por las instituciones competentes.")],
    [R("Depositar y retirar documentos originales, copias certificadas, certificaciones y carnés.")],
    [R("Firmar formularios, declaraciones juradas, instancias y cualquier documento público o privado requerido para el cumplimiento del objeto de este poder.")],
    [R("Presentar declaraciones y cumplir las obligaciones tributarias de la empresa ante la Dirección General de Impuestos Internos (DGII), incluyendo la solicitud, gestión y activación de los Números de Comprobante Fiscal (NCF) y demás trámites de cumplimiento fiscal comprendidos en el plan contratado.")],
    [R("Recibir notificaciones, tanto en formato físico como electrónico, relacionadas con los trámites gestionados.")],
  ], "num");
  c.push(P([RB("TERCERO: ACCESO A PLATAFORMAS DIGITALES. "), R("Se autoriza de manera especial al APODERADO para utilizar y gestionar las plataformas digitales y portales transaccionales del Estado Dominicano en representación del PODERDANTE, incluyendo pero no limitado a:")], { before: 40, after: 40 }));
  litItems(c, [
    [R("Dirección General de Impuestos Internos (DGII - Oficina Virtual).")],
    [R("Tesorería de la Seguridad Social (TSS - Sistema Único de Información y Recaudo, SUIR).")],
    [R("Ministerio de Trabajo (SIRLA).")],
    [R("Ventanilla Única de Formalización (formalizate.gob.do).")],
    [R("Dirección General de Contrataciones Públicas (DGCP - Portal Transaccional).")],
  ], "bullet");
  c.push(P([RB("CUARTO: INSTITUCIONES COMPETENTES. "), R("Las facultades otorgadas podrán ser ejercidas ante la Oficina Nacional de la Propiedad Industrial (ONAPI), Cámaras de Comercio y Producción, Dirección General de Impuestos Internos (DGII), Ministerio de Trabajo, Tesorería de la Seguridad Social (TSS), Dirección General de Aduanas (DGA), Dirección General de Contrataciones Públicas (DGCP) y cualquier otra institución pública o privada competente para los fines del presente mandato.")], { before: 40 }));
  c.push(P([RB("QUINTO: DELEGACIÓN Y COLABORACIÓN. "), R("La sociedad "), RB("SMART BIZ SERVICES, SRL"), R(", a través de su Gerente General, podrá autorizar a sus colaboradores internos para realizar los trámites y gestiones aquí descritos mediante comunicación escrita, debidamente firmada y sellada por la sociedad, sin que esto implique una renuncia a las facultades aquí otorgadas.")]));
  c.push(P([RB("SEXTO: VIGENCIA Y ALCANCE. "), R("El presente poder tendrá vigencia desde la fecha de su firma y hasta la "), RB("entrega total del plan de servicios “"), F(PLAN, { bold: true }), RB("”"), R(" contratado por el PODERDANTE, comprendiendo todas las gestiones, inscripciones, registros y trámites —societarios, fiscales y laborales— que dicho plan incluye, o hasta la revocación expresa del PODERDANTE, lo que ocurra primero. Se faculta expresamente al APODERADO para realizar las gestiones futuras relacionadas con el nombre comercial y los registros sociales necesarios para asegurar la formalización y operatividad de la entidad conforme al plan contratado.")]));
  const tw = PO.testigo;
  c.push(P([RB("SÉPTIMO: TESTIGO INSTRUMENTAL. "), R("Asiste en calidad de testigo "), RB(upper(tw.nombre)), R(", " + tw.generales + ", con domicilio y residencia en " + tw.domicilio + ", testigo instrumental requerido al efecto, libre de las tachas y excepciones que establece la ley.")]));
  c.push(SPACER(60));
  c.push(P([R("Hecho, pasado y firmado en la ciudad de " + PO.ciudad + ", República Dominicana, " + PO.fechaLarga + ".")]));

  firmaCentrada(c, upper(T.nombre), ["Poderdante"], 220);
  firmaCentrada(c, "JULIO DARWIN MENDOZA ESTRELLA", ["Por SMART BIZ SERVICES, SRL (Apoderado)"], 160);
  firmaCentrada(c, upper(tw.nombre), ["Testigo"], 160);

  c.push(SPACER(200));
  c.push(P([RB("LEGALIZACIÓN DE FIRMAS")], { align: AlignmentType.CENTER, after: 120 }));
  const firmantes = [upper(T.nombre), "JULIO DARWIN MENDOZA ESTRELLA", upper(tw.nombre)];
  c.push(P([R("Yo, "), RB(NO.nombre), R(", " + NO.credencial + ", "), RB("CERTIFICO Y DOY FE"), R(" que las firmas que anteceden fueron puestas libre y voluntariamente en mi presencia por los señores " + firmantes.join(", ") + ", de generales que constan en este acto, quienes me han declarado bajo la fe del juramento que esas son las mismas firmas que acostumbran a usar en todos los actos de su vida pública y privada. En la ciudad de " + PO.ciudad + ", República Dominicana, " + PO.fechaLarga + ".")]));
  firmaCentrada(c, NO.nombre, ["Notario Público"], 280);
  return buildDocument("Poder de Representación", c);
}

// =====================================================================
const NF = E.nombre + " EIRL";
const files = [
  ["1. ACTO CONSTITUTIVO - " + NF + ".docx", docActo()],
  ["2. PODER DE REPRESENTACION (PDR) - " + NF + ".docx", docPoder()],
];
(async () => {
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  for (const [name, d] of files) {
    const buf = await Packer.toBuffer(d);
    fs.writeFileSync(path.join(OUTDIR, name), buf);
    console.log("OK  ->", name);
  }
  console.log("\nExpediente EIRL generado en:\n" + OUTDIR);
})().catch((e) => { console.error("ERROR:", e); process.exit(1); });
