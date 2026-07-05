/* =====================================================================
   GENERADOR DE EXPEDIENTE — CONSTITUCIÓN DE SRL (Ley 479-08)
   Lee "datos.json" y produce los 3 documentos .docx que redacta SBS,
   con estilo y textos legales CONGELADOS. Solo cambian los datos.

      1. Estatutos Sociales
      2. Nómina y Asamblea General Ordinaria (designa gerentes + poder bancario)
      3. Poder de Representación (PDR)

   Estándar de redacción tomado de: LUMBRE, S.R.L. (Estatutos + Nómina/Acta)
   y PDR REVISADO LIGA PLÁTANO BALL (Poder, versión completa).

   Uso:  node generar_constitucion_srl.js
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType, VerticalAlign,
  Header, Footer, PageNumber, TabStopType,
} = require("docx");

const D = JSON.parse(fs.readFileSync(process.env.DATOS_FILE || path.join(__dirname, "datos.json"), "utf8"));
const OUTDIR = process.env.OUT_DIR || path.join(__dirname, D.carpetaSalida || "EXPEDIENTE GENERADO");

// ---------- estilo (sobrio premium: Cambria, Carta, márgenes amplios) ----
// El aire va en los MÁRGENES, no entre líneas: cuerpo denso, encabezados a
// renglón seguido, filetes finos, monocromo. Texto legal intacto.
const FONT = "Cambria", META = "7A7A7A", RULE = "BFBFBF", RED = "C00000";
const MT = 1440, MS = 1814; // superior/inferior 2.54 cm · laterales 3.2 cm (columna estrecha = elegancia)
const PAGE = { size: { width: 12240, height: 15840 }, margin: { top: MT, right: MS, bottom: MT, left: MS } };
const CW = 12240 - 2 * MS;
const Q = (s) => "“" + s + "”";              // comillas tipográficas
const BODY = 21, T_EMPRESA = 30, T_DOC = 24, T_ART = 21;
const SC = 14; // espaciado de caracteres para versalitas de títulos

// ---------- runs ----------
function R(text, o = {}) { return new TextRun({ text: String(text), font: FONT, size: o.size || BODY, bold: !!o.bold, italics: !!o.italics, allCaps: !!o.caps, smallCaps: !!o.sc, characterSpacing: o.spacing, color: o.color || "000000" }); }
const RB = (t, o = {}) => R(t, { ...o, bold: true });
// Campo variable: rojo+negrita si empieza con "[COMPLETAR", normal en otro caso
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

// ---------- tablas (filetes finos, sin rellenos pesados) ----------
const RUL = { style: BorderStyle.SINGLE, size: 6, color: "000000" };  // filete de regla (~0.75 pt)
const HAIR = { style: BorderStyle.SINGLE, size: 2, color: "999999" }; // filete fino de fila
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const cellNone = { top: NB, bottom: NB, left: NB, right: NB };
function cell(kids, o = {}) {
  return new TableCell({
    width: { size: o.w, type: WidthType.DXA }, columnSpan: o.span,
    shading: o.shade ? { fill: o.shade, type: ShadingType.CLEAR, color: "auto" } : undefined,
    verticalAlign: o.valign || VerticalAlign.CENTER,
    margins: { top: 50, bottom: 50, left: 110, right: 110 },
    borders: o.borders || cellNone,
    children: Array.isArray(kids) ? kids : [kids],
  });
}
// Línea de firma: filete fino centrado (no guiones), nombre debajo y calidad en gris.
const firmaLinea = (o) => P([R(" ")], { align: AlignmentType.CENTER, after: 40, indent: { left: 360, right: 360 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 2 } }, ...(o || {}) });
function sigCell(name, lines, w) {
  const kids = [SPACER(220), firmaLinea(), P([RB(name)], { align: AlignmentType.CENTER, after: 0 })];
  (lines || []).forEach((ln) => kids.push(P([R(ln, { size: 18, color: META })], { align: AlignmentType.CENTER, after: 0 })));
  return cell(kids, { w, borders: cellNone, valign: VerticalAlign.TOP });
}
// bloque de firmas en parejas (2 columnas)
function firmasGrid(c, firmantes) {
  const colW = Math.floor(CW / 2);
  for (let i = 0; i < firmantes.length; i += 2) {
    const left = firmantes[i], right = firmantes[i + 1];
    c.push(new Table({
      width: { size: CW, type: WidthType.DXA }, columnWidths: [colW, colW], borders: noBorders,
      rows: [new TableRow({ children: [
        sigCell(left.nombre, [left.calidad], colW),
        right ? sigCell(right.nombre, [right.calidad], colW) : cell([P([R("")])], { w: colW, borders: cellNone }),
      ] })],
    }));
  }
}
function firmaCentrada(c, name, lines, extraSpace) {
  c.push(SPACER(extraSpace != null ? extraSpace : 300));
  c.push(firmaLinea({ indent: { left: 2400, right: 2400 } }));
  c.push(P([RB(name)], { align: AlignmentType.CENTER, after: 0 }));
  (lines || []).forEach((l) => c.push(P([R(l, { size: 18, color: META })], { align: AlignmentType.CENTER, after: 0 })));
}

// ---------- títulos ----------
const numbering = { config: [
  { reference: "orden", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 600, hanging: 320 } }, run: { font: FONT, size: BODY } } }] },
  { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: FONT, size: BODY } } }] },
] };
// ---------- encabezado / pie discretos (gris, filete fino, "— N —") ----------
function makeHeader(docName) {
  return new Header({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CW }],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
    spacing: { after: 200 },
    children: [
      R(SRL, { size: 17, italics: true, color: META }),
      R("\t", { size: 17 }),
      R(docName, { size: 17, sc: true, spacing: 20, color: META }),
    ],
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

// ---------- atajos de datos ----------
const S = D.sociedad, FE = D.fechas, PO = D.poder, NO = D.notario, GE = D.gerencia;
const SRL = S.nombre + ", S.R.L.";
const PLAN = D.plan || "[COMPLETAR plan contratado]"; // Starter Pro / Essential 360 / Unlimitech
const dot = (s) => (String(s).endsWith(".") ? String(s) : String(s) + "."); // evita doble punto
const socios = D.socios;
const presidente = socios.find((s) => s.preside) || socios.find((s) => s.gerente) || socios[0];
const gerentes = GE.todosLosSocios ? socios.slice() : socios.filter((s) => s.gerente);
const trato = (p) => (p.genero === "F" ? "la señora" : "el señor");
const calidad = (p) => (p.genero === "F" ? "Socia" : "Socio");
const Trato = (p) => (p.genero === "F" ? "La señora" : "El señor");
const upper = (s) => String(s).toUpperCase();

// "la señora X, el señor Y y la señora Z"  (con tratamiento individual)
function listaConTrato(personas) {
  const runs = [];
  personas.forEach((p, i) => {
    if (i > 0) runs.push(R(i === personas.length - 1 ? " y " : ", "));
    runs.push(R(trato(p) + " ")); runs.push(RB(upper(p.nombre)));
  });
  return runs;
}
// "AMELIA, VIRGILIO y YURITZA" (solo nombres en versalitas/negrita)
function listaNombres(personas) {
  const runs = [];
  personas.forEach((p, i) => {
    if (i > 0) runs.push(R(i === personas.length - 1 ? " y " : ", "));
    runs.push(RB(upper(p.nombre)));
  });
  return runs;
}
// generales completas de un socio: "Nombre, dominicana, ..., con domicilio y residencia en ..."
const generalesSocio = (p) => p.generales + ", con domicilio y residencia en " + p.domicilio;

// =====================================================================
// DOC 1 — ESTATUTOS SOCIALES
// =====================================================================
function docEstatutos() {
  const c = [];
  c.push(P([RB(SRL, { sc: true, spacing: SC, size: T_EMPRESA })], { align: AlignmentType.CENTER, after: 30 }));
  c.push(P([RB("Estatutos Sociales", { sc: true, spacing: SC, size: T_DOC, color: "333333" })], { align: AlignmentType.CENTER, after: 240, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 8 } } }));
  c.push(P([R("En la ciudad de " + S.ciudad + ", los comparecientes:")]));
  socios.forEach((p, i) => {
    const fin = i === socios.length - 1 ? ";" : (i === socios.length - 2 ? "; y" : ";");
    c.push(P([RB(p.nombre), R(", " + generalesSocio(p) + ", República Dominicana" + fin)]));
  });
  c.push(P([RB("HAN CONVENIDO"), R(" fundar y constituir una Sociedad de Responsabilidad Limitada de acuerdo con las leyes de la República Dominicana, para lo cual consienten en aprobar y suscribir los siguientes Estatutos Sociales:")]));

  // ----- TÍTULO PRIMERO -----
  titulo(c, "Título Primero", "Denominación social, domicilio, objeto y duración");
  art(c, "1", "Denominación Social", [R("Bajo la denominación social " + Q(S.nombre + ", S.R.L.") + ", se constituye una Sociedad de Responsabilidad Limitada que se rige por las disposiciones de la Ley No. 479-08 sobre Sociedades Comerciales y Empresas Individuales de Responsabilidad Limitada, sus modificaciones y los presentes estatutos.")]);
  art(c, "2", "Tipo Social", [R("La sociedad se encuentra organizada como Sociedad de Responsabilidad Limitada (S.R.L.) de acuerdo con las leyes de la República Dominicana, para lo cual se suscriben los presentes estatutos a que están sometidos los propietarios de las cuotas sociales.")]);
  art(c, "3", "Domicilio", [R("El domicilio de la sociedad se establece en la " + S.domicilio + ", pudiendo ser trasladado a otro lugar dentro de la República Dominicana; también podrá establecer sucursales y dependencias en cualquier localidad del país, de acuerdo con las necesidades y requerimientos de la sociedad.")]);
  // Artículo 4 — Objeto (intro + items + cierre estándar)
  c.push(P([RB("Artículo 4. Objeto.  ", { sc: true }), R("La sociedad tiene como objeto social principal "), F(S.objetoIntro)], { before: 60 }));
  if (Array.isArray(S.objetoItems) && S.objetoItems.length) {
    c.push(P([R("Para cumplir con este objetivo, la sociedad se dedicará a:")], { after: 40 }));
    S.objetoItems.forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  }
  c.push(P([R("Como consecuencia de los objetos antes indicados y sin que su enumeración pueda ser considerada como limitativa, la sociedad puede ejercer todas las operaciones que se relacionen directa o indirectamente con el objeto antes mencionado o que fueran de naturaleza tal que favorezcan y faciliten el desarrollo del objeto social.")], { before: 40 }));
  art(c, "5", "Duración", [R("La duración de la sociedad es por tiempo ilimitado. Solo podrá disolverse por Resolución de la Asamblea General Extraordinaria convocada por los socios que representen cuando menos el cincuenta y un por ciento (51%) del capital social.")]);

  // ----- TÍTULO SEGUNDO -----
  titulo(c, "Título Segundo", "Del capital de la sociedad y de las cuotas sociales");
  c.push(P([RB("Artículo 6. Capital Social.  ", { sc: true }), R("El capital social de la empresa se establece en "), F(S.capitalLetras), R(" dividido en "), F(S.totalCuotasLetras), R(" cuotas sociales con un valor nominal de " + S.valorNominalLetras + " cada una, las cuales están completamente pagadas. Los socios declaran que, al momento de la suscripción de los presentes estatutos sociales, las cuotas sociales estaban divididas de la siguiente manera:")], { before: 60, after: 80, keepNext: true }));
  tablaDistribucion(c);
  art(c, "7", "Derecho de las Cuotas Sociales", [R("Cada cuota da derecho a su propietario a una parte proporcional en la repartición de los beneficios, así como en los activos en caso de liquidación o partición de la sociedad.")]);
  artHead(c, "8", "Forma de las Cuotas", [R("Las cuotas se dividirán en partes iguales e indivisibles, representadas por un certificado de cuotas no negociable, que indicará:")]);
  ["Número de certificado.", "Nombre del titular.", "Cantidad de cuotas que posee.", "Valor nominal de las cuotas.", "Capital social de la sociedad.", "Fecha de emisión."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  c.push(P([R("El certificado de cuotas será emitido por el Gerente de la Sociedad, quien deberá conservar en el domicilio de la Sociedad un Registro de los certificados de cuotas. Este Registro podrá ser conservado de forma electrónica. Las cuotas sociales podrán ser cedidas mediante las disposiciones establecidas más adelante.")], { before: 40 }));
  c.push(P([RB("Artículo 9. Transferencias de Cuotas.  ", { sc: true }), R("El socio que desee ceder sus cuotas deberá notificarlo por escrito a la sociedad y a los socios, ya sea de manera física o electrónica. Los socios tendrán 15 días para manifestar su decisión; en caso contrario, se entenderá como consentimiento.")], { before: 60 }));
  c.push(P([R("El Gerente de la sociedad deberá convocar a los socios a una Asamblea General Extraordinaria dentro de un periodo no mayor a ocho (8) días contados a partir de la recepción de la comunicación enviada por el socio que desea ceder sus cuotas, en la cual deben estar representadas al menos la mitad más uno (50% + 1) de las cuotas sociales. El certificado transferido será cancelado y depositado en los archivos de la sociedad y sustituido por el expedido a favor del o de los cesionarios.")]));
  art(c, "10", "Sujeción de los socios a los Estatutos", [R("La suscripción o la adquisición de una o más cuotas presupone por parte de su tenedor su conformidad de atenerse a las cláusulas estatutarias y a las resoluciones y acuerdos de las Asambleas Generales de Socios y del Gerente, en consonancia con los presentes estatutos.")]);
  art(c, "11", "Libro de Cuotas", [R("En el libro de cuotas se hará constancia del nombre, la dirección y el número de cuotas que posee cada titular de cuotas. Las convocatorias a las Asambleas y pagos de dividendos se enviarán a los socios a la dirección que consta en el mencionado libro de cuotas.")]);
  art(c, "12", "Pérdida del Certificado de Cuotas", [R("En caso de pérdida de certificados de cuotas, el dueño, para obtener la expedición de los certificados sustituyentes, deberá notificar a la sociedad, por acto de alguacil, la pérdida ocurrida, el pedimento de anulación de los certificados perdidos y la expedición de los certificados sustituyentes. El peticionario publicará un extracto de la notificación conteniendo las menciones esenciales, en un periódico de circulación nacional, una vez por semana, durante cuatro (4) semanas consecutivas. Transcurridos diez (10) días de la última publicación, si no hubiere oposición, se expedirá al solicitante un nuevo certificado, mediante la entrega de ejemplares del periódico en que se hubieren hecho las publicaciones, debidamente certificados por el editor. Los certificados perdidos se considerarán nulos. Si hubiere oposición, la sociedad no entregará los certificados sustituyentes hasta que el asunto sea resuelto entre el reclamante y el oponente por sentencia judicial que haya adquirido la autoridad de la cosa irrevocablemente juzgada o por transacción, desistimiento o aquiescencia. Los certificados de cuotas sociales que se emitan en el caso de que trata el presente artículo deberán llevar la mención de que sustituyen los extraviados.")]);
  art(c, "13", "Aumento y Reducción de Capital Social", [R("El capital social podrá ser aumentado o reducido por modificación estatutaria y mediante la decisión de una Asamblea General Extraordinaria convocada para estos fines.")]);
  art(c, "14", "No Disolución de la Sociedad por Muerte u Otra Causa", [R("La sociedad no se disolverá por fallecimiento, interdicción o quiebra de uno o varios socios. Los herederos, causahabientes o acreedores de un socio no podrán solicitar la colocación de sellos sobre los bienes de la sociedad, ni exigir su partición o licitación, ni interferir en su administración. Ellos deberán remitirse, para el ejercicio de sus derechos, a los inventarios sociales y a las deliberaciones de la Asamblea General y decisiones del Gerente.")]);
  art(c, "15", "Limitación Pecuniaria de los socios", [R("Los socios no están obligados, aun respecto de los terceros, sino hasta la concurrencia del monto de sus cuotas. Los socios no pueden ser sometidos a ninguna llamada de fondo ni a restitución de intereses o dividendos regularmente percibidos.")]);

  // ----- TÍTULO TERCERO -----
  titulo(c, "Título Tercero", "De la dirección, asambleas y administración de la sociedad");
  art(c, "16", "Dirección y Administración de la Sociedad", [R("La dirección y administración de la sociedad estará a cargo de uno o más Gerentes, quienes deben ser personas físicas y pueden ser o no socios. Los Gerentes ejercerán las funciones establecidas en los presentes estatutos y en la Ley.")]);
  c.push(P([RB("Artículo 17. División de las Asambleas.  ", { sc: true }), R("La Asamblea General de Socios es el órgano supremo de la sociedad; podrá acordar y ratificar actos u operaciones de ésta. Sus resoluciones son obligatorias para todos los socios, incluyendo a los disidentes y ausentes.")], { before: 60 }));
  c.push(P([R("Las Asambleas Generales se dividen en Ordinaria y Extraordinaria:")], { after: 40 }));
  c.push(P([RB("Ordinarias: "), R("Sus decisiones se refieren a hechos de gestión o de administración o a un hecho de interpretación de los Estatutos Sociales.")], { after: 20 }));
  c.push(P([RB("Extraordinarias: "), R("Se refieren a decisiones sobre la modificación de los estatutos.")]));
  art(c, "18", "Fecha y Lugar de Reunión", [R("La Asamblea General Ordinaria Anual se reunirá dentro de los 120 días del cierre del ejercicio social de cada año, en el domicilio social de la sociedad, o en otro lugar del territorio nacional siempre que se haya indicado en la convocatoria de la Asamblea.")]);
  art(c, "19", "Convocatoria", [R("Las Asambleas, Ordinarias o Extraordinarias, se convocarán con al menos 10 días de antelación, mediante comunicación física, electrónica, o a través de un aviso en un periódico de circulación nacional. Sin embargo, podrán reunirse sin convocatoria cuando todos los socios estén presentes o representadas.")]);
  artHead(c, "20", "Quórum y Composición");
  c.push(P([RB("Asamblea General Ordinaria y Asamblea General Ordinaria Anual: "), R("Deliberarán válidamente con socios que representen por lo menos el 51% de las cuotas sociales.")], { after: 20 }));
  c.push(P([RB("Asamblea General Extraordinaria: "), R("Estará compuesta por socios que representen cuando menos la mitad más uno (50% + 1) del capital social de la Sociedad.")], { after: 20 }));
  c.push(P([R("Si no se reúne el quórum exigido, podrá ser convocada nuevamente una o más veces, y podrá deliberar con los socios presentes, sin importar el número de votantes. Todos los socios quedarán sometidos a las resoluciones de las asambleas generales, aunque no hayan participado.")]));
  c.push(P([RB("Artículo 21. Directiva y Orden del Día.  ", { sc: true }), R("Las Asambleas Generales estarán presididas por el Gerente de la sociedad, que deberá ser socio de ésta. Si más de un Gerente o ninguno de ellos fuese socio, la Asamblea estará presidida por el socio que represente la mayor cantidad de las cuotas sociales. Si uno o más socios poseen la misma cantidad de cuotas sociales, será presidida por el socio de mayor edad.")], { before: 60 }));
  c.push(P([RB("Orden del Día:")], { after: 20 }));
  ["Todas las Asambleas deberán contener un orden del día que indique los puntos a tratar.",
   "El orden del día será redactado por el Gerente o la persona que preside la Asamblea.",
   "La Asamblea solo deliberará sobre las proposiciones que estén contenidas en el orden del día.",
   "El Gerente o la persona que preside la Asamblea estará obligado a incluir en el orden del día toda proposición emanada de un socio que represente el 10% del total de las cuotas sociales, siempre que haya sido consignada por escrito y entregada con cinco (5) días de antelación a la Asamblea.",
   "Toda proposición que fuere una consecuencia directa de la discusión provocada por un artículo del Orden del Día deberá ser sometida a votación."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  artHead(c, "22", "Votos y Apoderados de los socios");
  ["Cada cuota da derecho a un voto.",
   "Las resoluciones se tomarán por los votos de la mayoría de los socios presentes o debidamente representados.",
   "En caso de empate, el voto del Gerente de la Asamblea será decisivo si el mismo es socio de la Sociedad. De lo contrario, será decisivo el voto del socio que represente el mayor número de cuotas."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  art(c, "23", "Representación de Socios", [R("Los socios tienen derecho de asistir y de hacerse representar en las Asambleas por cualquier persona, mediante poder que emane de sí mismo. En este caso, el poder deberá depositarse en el domicilio de la sociedad, a más tardar el día anterior al fijado para la reunión. El mandatario no puede hacerse sustituir.")]);
  artHead(c, "24", "Atribuciones Asamblea General Ordinaria Anual", [R("Estas asambleas tienen la función de estatuir sobre todas las cuestiones que vayan más allá de la competencia del Gerente, otorgándole los poderes necesarios y determinando de manera absoluta el desempeño de los negocios sociales.")]);
  c.push(P([R("Son atribuciones de la Asamblea General Ordinaria Anual las siguientes:")], { after: 40 }));
  ["Elegir al Gerente y al Comisario de Cuentas, cuando corresponda, y fijarles su remuneración en caso de que corresponda.",
   "Revocar y sustituir en cualquier época al Gerente cuando corresponda.",
   "Conocer del informe anual del Gerente, así como los estados, cuentas y balances, y aprobarlos o desaprobarlos.",
   "Conocer del informe del Comisario de Cuentas, si hubiera, sobre la situación de la sociedad, el balance y las cuentas presentadas por el Gerente.",
   "Discutir, aprobar o rechazar las cuentas mencionadas en el literal precedente, examinar los actos de gestión del Gerente y Comisarios y darles descargo si procede.",
   "Disponer lo relativo a las utilidades, a la repartición o no de los beneficios, su forma de pago o el destino que debe dárseles.",
   "Regularizar cualquier nulidad, omisión o error cometidos en la deliberación de una Asamblea General Ordinaria anterior."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  artHead(c, "25", "Atribuciones Asamblea General Ordinaria No Anual", [R("Este tipo de Asamblea conoce y decide de todos los actos y operaciones que se refieren a la administración de la Sociedad.")]);
  c.push(P([R("Son atribuciones de la Asamblea General Ordinaria No Anual las siguientes:")], { after: 40 }));
  ["Ejercer las atribuciones de la Asamblea General Ordinaria cuando no se haya reunido dicha Asamblea o cuando no haya resuelto algunos asuntos de su competencia.",
   "Remover al Gerente antes del término para el cual ha sido nombrado y llenar definitivamente las vacantes que se produzcan.",
   "Acordar la participación de la Sociedad en la constitución de consorcios, asociaciones, sociedades en participación según convenga a los intereses de la Sociedad.",
   "Autorizar la apertura de sucursales y el nombramiento de representantes en cualquier ciudad de la República Dominicana."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  artHead(c, "26", "Atribuciones Asamblea General Extraordinaria", [R("Estas asambleas tienen la función de estatuir sobre todas las cuestiones que vayan más allá de la competencia del Gerente, otorgándole los poderes necesarios para tomar decisiones estratégicas que afecten la estructura y el funcionamiento de la sociedad.")]);
  c.push(P([R("Son atribuciones de la Asamblea General Extraordinaria las siguientes:")], { after: 40 }));
  ["Aumentar o disminuir el capital social.",
   "Unirse o fusionarse con otra sociedad constituida o que se constituya.",
   "Disolver la sociedad o limitar o reducir su término de duración.",
   "Enajenar o transferir todo el activo de la Sociedad.",
   "Modificar cualquier artículo de los presentes estatutos."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  art(c, "27", "Asambleas Combinadas", [R("La Asamblea General puede ser Ordinaria y Extraordinaria a la vez, si reúne las condiciones indicadas en los presentes estatutos. En ese caso, la asamblea será combinada tratando los asuntos que le competen a cada una por separado.")]);
  art(c, "28", "Actas de las Asambleas Generales", [R("De cada reunión, el Gerente redactará un acta. Las copias de estas actas servirán de prueba de las deliberaciones de la Asamblea y de los poderes otorgados tanto en justicia como frente a cualquier tercero.")]);

  // ----- TÍTULO CUARTO -----
  titulo(c, "Título Cuarto", "De la gerencia, responsabilidades y obligaciones");
  const actuacionGerentes = GE.firmaLegalConjunta
    ? "los cuales actuarán de manera conjunta y mancomunada en nombre y representación de la sociedad, requiriéndose la firma de " + (gerentes.length > 2 ? "todos los gerentes" : "ambos gerentes") + " para obligarla válidamente"
    : "los cuales podrán actuar de manera individual en nombre y representación de la sociedad";
  art(c, "29", "Gerentes", [R("La sociedad designará a uno o varios gerentes, " + actuacionGerentes + ". Deben ser personas físicas, socios o no de la sociedad, y tendrán una duración de " + GE.duracionLetras + ". Los gerentes deberán actuar de acuerdo con lo que establece la ley y los presentes estatutos. Solo podrán ser gerentes aquellas personas a las que se les esté permitido ejercer el comercio. El gerente tiene la dirección de la sociedad durante el periodo en que la Asamblea General de Socios no esté deliberando y, durante este periodo, está en la obligación de resolver cualquier asunto que no sea de atribución de la Asamblea General.")]);
  artHead(c, "30", "Poderes, Deberes y Obligaciones de los Gerentes", [R("Los gerentes tienen la facultad de:")]);
  ["Autorizar o aprobar los contratos celebrados a nombre de la sociedad;",
   "Cumplir y ejecutar cualquier mandato o acuerdo de la Asamblea General y estos estatutos;",
   "Otorgar toda clase de nombramientos, mandatos y poderes, sean permanentes o por un objeto determinado;",
   "Adquirir o arrendar para la sociedad todos los bienes muebles e inmuebles, derechos y privilegios que considere convenientes;",
   "Representar la sociedad frente a cualquier persona pública o privada;",
   "Abrir, mantener o cerrar cuentas bancarias y determinar quién estará autorizado a firmar en representación de la sociedad: giros, pagarés, recibos, aceptaciones, cesiones, cheques, descargos, contratos y documentos de toda clase;",
   "Nombrar y revocar a los empleados y mandatarios, fijar su remuneración, así como las otras condiciones de su admisión y despido;",
   "Fijar los gastos generales;",
   "Recibir y pagar cualquier suma en capital, intereses y accesorios;",
   "Autorizar la apertura de sucursales y el nombramiento de representantes en cualquier ciudad de la República;",
   "Decidir acerca de las construcciones de inmuebles para la sociedad y de sus mejoras;",
   "Garantizar empréstitos con toda clase de seguridades, ya sea prenda con desapoderamiento y prenda sin desapoderamiento, hipotecas o anticresis;",
   "Adoptar acuerdos en todos los asuntos que cualquiera de sus miembros someta a su consideración, siempre que no estén atribuidos a la Asamblea General;",
   "Representar la sociedad en justicia, como demandante o demandada, y obtener sentencias; dar aquiescencia, desistir o hacerlas ejecutar por todos los medios y vías de derecho; autorizar todo acuerdo, transacción o compromiso; representar a la sociedad en todas las operaciones de quiebra; y",
   "Autorizar las persecuciones judiciales de cualquier naturaleza que juzgue necesarias; nombrar y revocar apoderados especiales que representen a la sociedad en las acciones que intente y determinar su retribución; proveer la defensa de la sociedad en toda acción o procedimiento que se siga contra ella."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  c.push(P([R("La enumeración que antecede es enunciativa y no limitativa y por lo tanto el gerente tiene facultades y poderes suficientes para realizar todos los actos ya fueren administrativos o de disposición necesarios para la consecución de la sociedad.")], { before: 40 }));
  art(c, "31", "Responsabilidad de los Gerentes.", [R("Los gerentes solo responden individual o solidariamente por la fiel ejecución de sus mandatos y no contraen obligaciones individuales o solidarias relativas a los compromisos sociales.")]);
  artHead(c, "32", "Excepciones", [R("A menos que exista autorización expresa y unánime de la Asamblea General de Socios, los gerentes no podrán:")]);
  ["Tomar en préstamo dinero o bienes de la sociedad;",
   "Usar cualquier tipo de servicios, bienes o créditos de la sociedad en provecho propio o de un pariente o sociedades vinculadas;",
   "Usar en beneficio propio o de terceros relacionados las oportunidades comerciales de las que tuvieran conocimiento debido a su cargo y que a la vez pudieran constituir un perjuicio para la sociedad;",
   "Divulgar los negocios de la sociedad ni la información social a la que tenga acceso y que no haya sido divulgada oficialmente por la sociedad; y",
   "Recibir de la sociedad ninguna remuneración, permanente o no, salvo las establecidas por la ley."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  artHead(c, "33", "Comisario de Cuentas", [R("En caso de que la sociedad decida nombrar un Comisario de Cuentas, este será designado mediante la Asamblea General Ordinaria. Por excepción, el primer Comisario de Cuentas, si los socios deciden nombrarlo, será designado por medio de los presentes estatutos sociales. El Comisario de Cuentas deberá tener un grado de licenciatura en contabilidad, administración de empresas, finanzas o economía, con no menos de tres (3) años de experiencia en su profesión, y será nombrado para dos (2) ejercicios sociales. Son atribuciones del Comisario de Cuentas:")]);
  ["Presentar a la Asamblea General de Socios un informe escrito sobre la situación económica de la sociedad, dictaminando sobre la memoria, el inventario, el balance y el estado de resultado;",
   "Remitir un informe sobre las partidas del balance y de los demás documentos contables que considere deban ser modificados;",
   "Informar por escrito al Gerente cuando determine la existencia de hechos que por su naturaleza pongan en riesgo la continuidad de la sociedad; y",
   "Dictaminar sobre los proyectos que modifiquen los estatutos sociales, emisión de bonos, transformación, fusión, aumento o disminución de capital, y disolución anticipada que se planteen en la Asamblea General Extraordinaria."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  art(c, "34", "Responsabilidad del Comisario de Cuentas.", [R("El Comisario de Cuentas será responsable frente a la sociedad y a terceros de las consecuencias perjudiciales cometidas en el ejercicio de sus funciones.")]);
  art(c, "35", "Registros Contables.", [R("Los gerentes deberán conservar en el domicilio de la sociedad un libro registro en el cual consten de manera cronológica todas las operaciones comerciales realizadas por la sociedad. Estos registros servirán de base para la elaboración de los estados financieros de la sociedad.")]);

  // ----- TÍTULO QUINTO -----
  titulo(c, "Título Quinto", "Ejercicio social, fondo de reserva y dividendos");
  art(c, "36", "Ejercicio Social.", [R("El ejercicio social comenzará el día " + S.ejercicioInicio + " y terminará el día " + S.ejercicioCierre + " de cada año. Por excepción, el primer ejercicio social abarcará el tiempo comprendido entre la fecha de la constitución definitiva de la sociedad y el día " + S.ejercicioCierre + " del presente año.")]);
  art(c, "37", "Fondo de Reserva Legal.", [R("La sociedad tendrá un fondo de reserva legal que estará integrado por la separación anual de por lo menos el cinco por ciento (5%) de los beneficios netos obtenidos, hasta que la reserva alcance una décima (1/10) parte del capital social de la sociedad.")]);
  art(c, "38", "Dividendos, Reservas y Reinversiones.", [R("Las utilidades que obtenga la sociedad, una vez cubiertos los gastos de administración y operación, así como las aportaciones al fondo de reserva legal, deberán ser distribuidas entre los socios a título de dividendos.")]);

  // ----- TÍTULO SEXTO -----
  titulo(c, "Título Sexto", "Transformación, fusión y escisión de la sociedad");
  art(c, "39", "Transformación, Fusión y Escisión.", [R("La transformación, la fusión y la escisión de la sociedad serán decididas mediante una Asamblea General Extraordinaria y de conformidad con lo establecido en la Ley No. 479-08 y sus modificaciones.")]);

  // ----- TÍTULO SÉPTIMO -----
  titulo(c, "Título Séptimo", "Disolución y liquidación de la sociedad");
  artHead(c, "40", "Disolución y Liquidación de la Sociedad", [R("La sociedad podrá disolverse cuando se reúna por lo menos una de las siguientes condiciones:")]);
  ["Impedimento para desarrollar el objeto social para el cual fue constituida;",
   "Imposibilidad del funcionamiento adecuado de la sociedad, producto de suspensión en sus funciones de la Gerencia misma;",
   "Inactividad durante por lo menos tres (3) años consecutivos del objeto social; y",
   "Reducción de una cantidad inferior al cincuenta por ciento (50%) del capital social en relación con el patrimonio de los activos de la sociedad."]
    .forEach((it) => c.push(P([R(it)], { numbering: { reference: "bullets", level: 0 }, after: 20 })));
  c.push(P([R("Adicionalmente, los socios podrán, mediante resolución de una Asamblea General Extraordinaria, decretar la disolución de la sociedad. En caso de proceder la disolución de la sociedad, la Asamblea General Extraordinaria regulará el modo de hacer su liquidación y nombrará a las personas que se encarguen de ésta, cesando el Gerente desde entonces en sus funciones. Cuando la sociedad se encuentre en estado de liquidación, el liquidador presidirá la Asamblea General Extraordinaria, la cual se regirá por lo establecido en los presentes estatutos.")], { before: 40 }));
  c.push(P([R("Después del pago de todo el pasivo, obligaciones, cuotas y cargas de la sociedad, el producto neto de la liquidación será empleado en reembolsar las sumas en capital liberado y no amortizado que representen las cuotas sociales. En caso de que sobrare algún excedente, éste será repartido entre los socios en partes iguales.")]));

  // cierre + firmas
  c.push(SPACER(120));
  c.push(P([RB("REDACTADO, LEÍDO Y APROBADO"), R(" en la ciudad de " + S.ciudad + ", " + FE.redaccionLarga + ".")]));
  c.push(SPACER(200));
  firmasGrid(c, socios.map((s) => ({ nombre: s.nombre, calidad: calidad(s) })));
  return buildDocument("Estatutos Sociales", c);
}

// Divisor de TÍTULO: versalita espaciada + subtítulo en cursiva, con filete corto.
function titulo(c, roman, subtitulo) {
  c.push(P([RB(roman, { sc: true, spacing: SC + 6, size: 23 })], { align: AlignmentType.CENTER, before: 260, after: 30, keepNext: true }));
  c.push(P([R(subtitulo, { italics: true, color: "555555" })], { align: AlignmentType.CENTER, after: 70, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } } }));
}
// Encabezado de artículo "a renglón seguido" (versalita) + cuerpo en el mismo párrafo.
function art(c, n, head, bodyRuns, o) {
  const h = String(head).replace(/\.\s*$/, "");
  c.push(P([RB("Artículo " + n + ". " + h + ".  ", { sc: true }), ...bodyRuns], { before: 60, ...(o || {}) }));
}
// Encabezado de artículo que precede a una lista (no hay renglón seguido posible).
function artHead(c, n, head, introRuns) {
  const h = String(head).replace(/\.\s*$/, "");
  const lead = RB("Artículo " + n + ". " + h + ".  ", { sc: true });
  c.push(P(introRuns ? [lead, ...introRuns] : [lead], { before: 60, after: introRuns ? 40 : 30, keepNext: true }));
}
// Tabla de filetes finos: regla arriba/abajo del encabezado, filete fino por fila,
// regla sobre el total. Sin rellenos ni bordes verticales. Cifras alineadas a la derecha.
function tablaDistribucion(c) {
  const wN = 4200, wC = 1400, wP = 1100, wV = 1912;
  const HB = { top: RUL, bottom: RUL, left: NB, right: NB };
  const RBd = { top: NB, bottom: HAIR, left: NB, right: NB };
  const TB = { top: RUL, bottom: NB, left: NB, right: NB };
  const H = (t, w, al) => cell([P([R(t, { size: 18, sc: true, spacing: 10, color: "444444" })], { align: al, after: 0 })], { w, borders: HB });
  const C = (runs, w, al, bd) => cell([P(runs, { align: al, after: 0 })], { w, borders: bd });
  const L = AlignmentType.LEFT, RA = AlignmentType.RIGHT;
  const rows = [new TableRow({ tableHeader: true, children: [H("Socio", wN, L), H("Cuotas", wC, RA), H("%", wP, RA), H("Valor pagado (RD$)", wV, RA)] })];
  socios.forEach((s) => rows.push(new TableRow({ children: [
    C([R(s.nombre)], wN, L, RBd), C([R(s.cuotas)], wC, RA, RBd),
    C([R(String(s.porcentaje).replace("%", ""))], wP, RA, RBd), C([R(s.valorPagado)], wV, RA, RBd),
  ] })));
  rows.push(new TableRow({ children: [
    C([RB("Total")], wN, L, TB), C([RB(S.totalCuotas)], wC, RA, TB),
    C([RB("100")], wP, RA, TB), C([RB(S.capital.replace("RD$", ""))], wV, RA, TB),
  ] }));
  c.push(new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [wN, wC, wP, wV], borders: noBorders, rows }));
}

// =====================================================================
// DOC 2 — NÓMINA Y ASAMBLEA GENERAL ORDINARIA
// =====================================================================
const banner = (c, after) => {
  c.push(P([RB(SRL, { sc: true, spacing: SC, size: 27 })], { align: AlignmentType.CENTER, after: 20 }));
  c.push(P([R("Capital social: " + S.capital, { italics: true, color: "555555", size: 20 })], { align: AlignmentType.CENTER, after: after != null ? after : 130 }));
};

function docNominaAsamblea() {
  const c = [];
  // ---------- NÓMINA DE PRESENCIA ----------
  banner(c);
  c.push(P([RB("NÓMINA DE PRESENCIA LEVANTADA EN OCASIÓN DE LA CELEBRACIÓN DE LA ASAMBLEA GENERAL ORDINARIA DE LA ENTIDAD DE COMERCIO " + Q(SRL) + " DE FECHA " + upper(FE.asambleaCorta) + ".")], { after: 160 }));
  nominaTabla(c);
  c.push(SPACER(120));
  firmasGrid(c, socios.map((s) => ({ nombre: s.nombre, calidad: calidad(s) })));
  c.push(SPACER(120));
  firmaCentrada(c, presidente.nombre, ["Presidente de la Asamblea"], 200);
  c.push(SPACER(160));
  c.push(P([R("Yo, "), RB(upper(presidente.nombre)), R(", "), RB("CERTIFICO Y DOY FE"), R(", que " + FE.asambleaLarga + ", fue levantada la presente Nómina de Presencia de los socios de la empresa " + Q(SRL) + " en ocasión de la celebración de la ASAMBLEA GENERAL ORDINARIA.")]));

  // ---------- ACTA DE ASAMBLEA ----------
  c.push(P([R("")], { pageBreakBefore: true, after: 0 }));
  banner(c);
  c.push(P([RB("ACTA DE LA ASAMBLEA GENERAL ORDINARIA DE SOCIOS DE LA ENTIDAD DE COMERCIO " + Q(SRL) + " CELEBRADA EN FECHA " + upper(FE.asambleaCorta) + ".")], { after: 160 }));
  c.push(P([R("En la ciudad de " + S.ciudad + ", " + FE.asambleaLarga + ", siendo las " + FE.horaApertura + ", atendiendo a la convocatoria cursada por la sociedad " + Q(SRL) + ", una compañía constituida, organizada y existente de conformidad con las leyes de la República Dominicana, con domicilio social en la " + S.domicilio + ", los titulares de las cuotas sociales de la compañía, cuyas generales de Ley figuran en la Nómina de Presencia, que constituyen el capital social de las mismas, se dieron cita para la celebración de la ASAMBLEA GENERAL ORDINARIA de Socios.")]));
  c.push(P([R("A esos efectos, " + trato(presidente) + " "), RB(upper(presidente.nombre)), R(", socio que representa la mayor proporción del capital social y quien preside la presente asamblea conforme al artículo 21 de los Estatutos Sociales, preparó la nómina de presencia, en la cual se hizo constar que los socios presentes participan de la misma; en consecuencia, comprueba que el quórum es más que suficiente para proceder y proseguir el curso de la ASAMBLEA GENERAL ORDINARIA, dando así cumplimiento a las disposiciones estatutarias, de conformidad con el aviso de convocatoria que forma parte de la presente Junta.")]));
  c.push(P([R("Acto seguido, " + trato(presidente) + " "), RB(upper(presidente.nombre)), R(", luego de verificar y comprobar con la nómina de presencia que estaban reunidos todos los socios que constituyen el capital social de la misma, declaró formalmente abierta la ASAMBLEA GENERAL ORDINARIA de la compañía " + Q(SRL) + " y declaró que el orden del día era el siguiente:")]));
  // orden del día
  c.push(P([R("Aprobar la validez de la Asamblea para sesionar como ASAMBLEA GENERAL ORDINARIA.")], { numbering: { reference: "orden", level: 0 }, after: 20 }));
  c.push(P([R("Hacer constar la suscripción de los Estatutos Sociales que rigen la Sociedad de Responsabilidad Limitada.")], { numbering: { reference: "orden", level: 0 }, after: 20 }));
  c.push(P([R("Designar a los gerentes de la sociedad por un período de " + GE.duracionLetras + ".")], { numbering: { reference: "orden", level: 0 }, after: 20 }));
  c.push(P([R("Autorizar y otorgar poder especial a "), ...autorizadosBanco(), R(", " + bancoPre() + "abrir y manejar cuentas bancarias a nombre de la sociedad.")], { numbering: { reference: "orden", level: 0 }, after: 20 }));
  c.push(P([R("Autorizar a los gerentes a realizar los trámites de matriculación de la sociedad " + SRL + " ante el Registro Mercantil y la DGII.")], { numbering: { reference: "orden", level: 0 }, after: 20 }));
  c.push(P([R("Cualquier otro asunto de interés y que sea de competencia de la ASAMBLEA GENERAL ORDINARIA de Socios.")], { numbering: { reference: "orden", level: 0 }, after: 20 }));

  c.push(P([R("Acto seguido, " + trato(presidente) + " "), RB(upper(presidente.nombre)), R(", en su calidad de presidente de la asamblea, después de haber constatado el quórum requerido para esta ASAMBLEA GENERAL ORDINARIA de Socios y firmada la Nómina de los socios que encabeza la presente acta, se dio lectura al orden del día antes descrito, que pasó a su conocimiento y difusión. La Asamblea renunció formalmente sin reservas al plazo y a las formalidades de la convocatoria previstas por la Ley y en las disposiciones establecidas en los estatutos de esta sociedad comercial, por lo que, a unanimidad, se decide continuar con el conocimiento del orden del día fijado por el presidente de la asamblea.")], { before: 80 }));
  c.push(P([R("Después de un intercambio de impresiones entre los socios presentes, fueron aprobadas a unanimidad de votos las siguientes resoluciones:")]));

  // PRIMERA
  res(c, "PRIMERA", [R("Tomar acta y dar constancia de que está presente el quórum reglamentario exigido en los Estatutos Sociales para la celebración de las Asambleas Generales Ordinarias, por encontrarse presente más de la mitad (1/2) del capital social —en este caso, la totalidad (100%)— presente o debidamente representado y, en consecuencia, declarar la validez de la presente Asamblea para deliberar y tomar decisiones válidas como Asamblea General Ordinaria. Se aprueba la Nómina de Socios presentes y representados.")]);
  // SEGUNDA
  res(c, "SEGUNDA", [R("La Asamblea General Ordinaria "), RB("HACE CONSTAR"), R(" que los socios han suscrito los "), RB("ESTATUTOS SOCIALES"), R(" que rigen la Sociedad " + SRL + ", de fecha " + upper(FE.asambleaCorta) + ", los cuales constituyen el acto fundacional de la sociedad.")]);
  // TERCERA
  res(c, "TERCERA", [R("La Asamblea General Ordinaria "), RB("DESIGNA"), R(" como " + (gerentes.length > 1 ? "gerentes" : "gerente") + ", por el período de " + GE.duracionLetras + " conforme a los artículos 100 de la Ley No. 479-08 y 29 de los Estatutos Sociales, a "), ...listaNombres(gerentes), R(", " + (gerentes.length > 1 ? "quienes firman" : "quien firma") + " al pie del presente documento en señal de aceptación al cargo.")]);
  // CUARTA
  res(c, "CUARTA", [R("Se autoriza a "), ...autorizadosBanco(), R(", " + bancoPre() + "solicitar la apertura de cuentas bancarias y su correspondiente manejo, suscripción de préstamos, tarjetas de crédito, líneas de crédito, garantías prendarias, pagos de cheques, giros, letras de cambios y pagarés, a nombre y en representación de la compañía, así como también a realizar cualquier otro tipo de actividad bancaria necesaria para el óptimo desenvolvimiento de esta sociedad de comercio.")]);
  // QUINTA
  c.push(resTitle("QUINTA"));
  c.push(P([R("La Asamblea General Ordinaria "), RB("AUTORIZA"), R(" a los gerentes a realizar todos los trámites de matriculación de la sociedad " + SRL + " por ante el Registro Mercantil de la Cámara de Comercio y Producción correspondiente, así como su inscripción en el Registro Nacional de Contribuyentes (RNC) de la Dirección General de Impuestos Internos (DGII) y cualquier otra formalidad de registro requerida, conforme a la Ley No. 479-08, la Ley sobre Registro Mercantil y sus modificaciones.")]));
  c.push(aprobada());
  c.push(P([R("Acto seguido, el PRESIDENTE de la Asamblea invitó a los presentes a avocarse al punto No. 6, para tratar cualquier otro asunto de interés. Ofreció la palabra a los socios presentes, y en vista de que no hicieron uso de ella, declaró cerrada la sesión, siendo las " + FE.horaCierre + ", el día, mes y año antes señalados, de la cual se levantó la presente acta. La cual fue leída por todos los socios presentes y la cual fue firmada por los mismos, en señal de aprobación.")], { before: 40 }));

  c.push(SPACER(160));
  firmasGrid(c, socios.map((s) => ({ nombre: s.nombre, calidad: calidad(s) })));
  c.push(SPACER(120));
  firmaCentrada(c, presidente.nombre, ["Presidente de la Asamblea"], 200);
  c.push(SPACER(160));
  c.push(P([R("Yo, "), RB(upper(presidente.nombre)), R(", en mi condición de Presidente de la Asamblea, Certifico y Doy Fe que la presente acta es fiel y conforme a su original, en ocasión de la ASAMBLEA GENERAL ORDINARIA celebrada " + FE.asambleaLarga + ", de la compañía " + Q(SRL) + ", cuyo contenido es el detallado precedentemente.")]));
  return buildDocument("Nómina y Asamblea Ordinaria", c);
}

function autorizadosBancoLista() { return GE.poderesBancariosTodos ? socios : gerentes; }
function autorizadosBanco() { return listaNombres(autorizadosBancoLista()); }
// Prefijo "para que … " hasta justo antes del verbo de la acción bancaria.
// Soporta: mancomunado (firma conjunta), independiente, o un único autorizado.
function bancoPre() {
  const n = autorizadosBancoLista().length;
  if (GE.poderesBancariosConjuntos) {
    const quienes = n > 2 ? "todos los autorizados" : "ambos";
    return "para que, de manera conjunta y mancomunada —requiriéndose la firma de " + quienes + "—, puedan ";
  }
  const indep = GE.poderesBancariosTodos ? "de manera independiente " : "";
  const verbo = (n > 1 || GE.poderesBancariosTodos) ? "puedan" : "pueda";
  return "para que " + indep + verbo + " ";
}
const resTitle = (ord) => P([RB(ord + " RESOLUCIÓN:")], { before: 120, after: 40, keepNext: true });
const aprobada = () => P([RB("Esta resolución fue aprobada a unanimidad de votos.")], { align: AlignmentType.CENTER, before: 40, after: 120 });
function res(c, ord, runs) { c.push(resTitle(ord)); c.push(P(runs)); c.push(aprobada()); }

function nominaTabla(c) {
  const wG = 5012, wC = 1800, wV = 1800;
  const grid = { top: HAIR, bottom: HAIR, left: HAIR, right: HAIR };
  const head = (t, w) => cell([P([R(t, { size: 17, sc: true, spacing: 8, color: "444444" })], { align: AlignmentType.CENTER, after: 0 })], { w, borders: { top: RUL, bottom: RUL, left: HAIR, right: HAIR } });
  const banda = cell([P([RB(Q(SRL) + " · Capital social: " + S.capital, { size: 19, sc: true, spacing: 8 })], { align: AlignmentType.CENTER, after: 0 })], { w: CW, span: 3, borders: { top: RUL, bottom: RUL, left: NB, right: NB } });
  const rows = [
    new TableRow({ children: [banda] }),
    new TableRow({ tableHeader: true, children: [head("Datos generales de los socios", wG), head("Cuotas sociales", wC), head("Votos", wV)] }),
  ];
  socios.forEach((s) => rows.push(new TableRow({ children: [
    cell([P([R(s.nombre + ", " + s.generales + ", con domicilio y residencia en " + s.domicilio + ".", { size: 19 })], { after: 0, line: 230 })], { w: wG, borders: grid }),
    cell([P([R(s.cuotas)], { align: AlignmentType.CENTER, after: 0 })], { w: wC, borders: grid }),
    cell([P([R(s.votos)], { align: AlignmentType.CENTER, after: 0 })], { w: wV, borders: grid }),
  ] })));
  const plural = socios.every((s) => s.genero === "F") ? "Cantidad de socias" : "Cantidad de socios";
  rows.push(new TableRow({ children: [head(plural, wG), head("Cantidad de cuotas", wC), head("Cantidad de votos", wV)] }));
  rows.push(new TableRow({ children: [
    cell([P([RB(String(socios.length))], { align: AlignmentType.CENTER, after: 0 })], { w: wG, borders: grid }),
    cell([P([RB(S.totalCuotas)], { align: AlignmentType.CENTER, after: 0 })], { w: wC, borders: grid }),
    cell([P([RB(S.totalVotos)], { align: AlignmentType.CENTER, after: 0 })], { w: wV, borders: grid }),
  ] }));
  c.push(new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [wG, wC, wV], borders: { top: HAIR, bottom: HAIR, left: HAIR, right: HAIR, insideHorizontal: HAIR, insideVertical: HAIR }, rows }));
}

// =====================================================================
// DOC 3 — PODER DE REPRESENTACIÓN (PDR) — versión revisada/completa
// =====================================================================
function docPoder() {
  const c = [];
  c.push(P([RB("Poder de Representación", { sc: true, spacing: SC, size: T_DOC })], { align: AlignmentType.CENTER, after: 240, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 8 } } }));
  // QUIENES SUSCRIBEN
  const susc = [RB("QUIENES SUSCRIBEN: ")];
  socios.forEach((p, i) => {
    if (i > 0) susc.push(R(i === socios.length - 1 ? "; y " : "; "));
    susc.push(RB(upper(p.nombre)));
    susc.push(R(", " + p.generales.replace(/^domini(cano|cana)/, p.genero === "F" ? "dominicana" : "dominicano") + ", con domicilio y residencia en " + p.domicilio));
  });
  susc.push(R(" (en adelante, " + (socios.length > 1 ? 'los "PODERDANTES"' : 'el "PODERDANTE"') + ")."));
  c.push(P(susc));
  // OTORGAN PODER
  c.push(P([RB((socios.length > 1 ? "OTORGAN" : "OTORGA") + " PODER: "), R("Tan amplio y suficiente como en derecho sea necesario a la sociedad "), RB("SMART BIZ SERVICES, SRL"), R(", Registro Nacional de Contribuyentes (RNC) No. 1-31-68858-6, con domicilio social en la Calle Padres Paules No. 61, Apto. 5-A, Ensanche Ozama, Santo Domingo Este, República Dominicana; debidamente representada por su Gerente General, el señor "), RB("JULIO DARWIN MENDOZA ESTRELLA"), R(", dominicano, mayor de edad, titular de la cédula de identidad y electoral No. 223-0072682-9 (en adelante, el “APODERADO”), para que, actuando en nombre y representación de " + (socios.length > 1 ? "los PODERDANTES" : "el PODERDANTE") + ", tal como si " + (socios.length > 1 ? "fueran ellos mismos" : "fuera él mismo") + ", pueda realizar, en el marco del plan de servicios “"), F(PLAN, { bold: true }), R("” contratado con dicha sociedad, de manera enunciativa, mas no limitativa, las siguientes acciones:")]));
  // PRIMERO
  c.push(P([RB("PRIMERO: FACULTADES DE GESTIÓN ADMINISTRATIVA. "), R("Solicitar, depositar, tramitar, gestionar, modificar, retirar y firmar toda la documentación necesaria ante las autoridades competentes para:")], { after: 40 }));
  litItems(c, [
    [R("La constitución de empresas o sociedades bajo cualquier modalidad legal, incluyendo pero no limitado a la sociedad "), RB(SRL)],
    [R("El registro, renovación y modificación de nombres comerciales, marcas, rótulos y cualquier otro signo distintivo.")],
    [R("La obtención, renovación y actualización de Registros Mercantiles.")],
    [R("La inscripción y actualización ante el Registro Nacional de Contribuyentes (RNC).")],
    [R("La gestión de registros de importación y exportación, firmas digitales y otros servicios relacionados ante la Dirección General de Aduanas (DGA) y las Cámaras de Comercio y Producción.")],
    [R("La inscripción, modificación y actualización ante el Registro de Proveedores del Estado (RPE) de la Dirección General de Contrataciones Públicas (DGCP).")],
  ], "abc");
  // SEGUNDO
  c.push(P([RB("SEGUNDO: AMPLIACIÓN DE FACULTADES. "), R("El APODERADO queda expresamente facultado para:")], { before: 40, after: 40 }));
  litItems(c, [
    [R("Subsanar errores u omisiones en los expedientes y documentos depositados.")],
    [R("Responder a requerimientos administrativos de cualquier índole realizados por las instituciones competentes.")],
    [R("Depositar y retirar documentos originales, copias certificadas, certificaciones y carnés.")],
    [R("Firmar formularios, declaraciones juradas, instancias y cualquier documento público o privado requerido para el cumplimiento del objeto de este poder.")],
    [R("Presentar declaraciones y cumplir las obligaciones tributarias de la sociedad ante la Dirección General de Impuestos Internos (DGII), incluyendo la solicitud, gestión y activación de los Números de Comprobante Fiscal (NCF) y demás trámites de cumplimiento fiscal comprendidos en el plan contratado.")],
    [R("Recibir notificaciones, tanto en formato físico como electrónico, relacionadas con los trámites gestionados.")],
  ], "num");
  // TERCERO
  c.push(P([RB("TERCERO: ACCESO A PLATAFORMAS DIGITALES. "), R("Se autoriza de manera especial al APODERADO para utilizar y gestionar las plataformas digitales y portales transaccionales del Estado Dominicano en representación de " + (socios.length > 1 ? "los PODERDANTES" : "el PODERDANTE") + ", incluyendo pero no limitado a:")], { before: 40, after: 40 }));
  litItems(c, [
    [R("Dirección General de Impuestos Internos (DGII - Oficina Virtual).")],
    [R("Tesorería de la Seguridad Social (TSS - Sistema Único de Información y Recaudo, SUIR).")],
    [R("Ministerio de Trabajo (SIRLA).")],
    [R("Ventanilla Única de Formalización (formalizate.gob.do).")],
    [R("Dirección General de Contrataciones Públicas (DGCP - Portal Transaccional).")],
  ], "bullet");
  // CUARTO
  c.push(P([RB("CUARTO: INSTITUCIONES COMPETENTES. "), R("Las facultades otorgadas podrán ser ejercidas ante la Oficina Nacional de la Propiedad Industrial (ONAPI), Cámaras de Comercio y Producción, Dirección General de Impuestos Internos (DGII), Ministerio de Trabajo, Tesorería de la Seguridad Social (TSS), Dirección General de Aduanas (DGA), Dirección General de Contrataciones Públicas (DGCP) y cualquier otra institución pública o privada competente para los fines del presente mandato.")], { before: 40 }));
  // QUINTO
  c.push(P([RB("QUINTO: DELEGACIÓN Y COLABORACIÓN. "), R("La sociedad "), RB("SMART BIZ SERVICES, SRL"), R(", a través de su Gerente General, podrá autorizar a sus colaboradores internos para realizar los trámites y gestiones aquí descritos mediante comunicación escrita, debidamente firmada y sellada por la sociedad, sin que esto implique una renuncia a las facultades aquí otorgadas.")]));
  // SEXTO
  c.push(P([RB("SEXTO: VIGENCIA Y ALCANCE. "), R("El presente poder tendrá vigencia desde la fecha de su firma y hasta la "), RB("entrega total del plan de servicios “"), F(PLAN, { bold: true }), RB("”"), R(" contratado por " + (socios.length > 1 ? "los PODERDANTES" : "el PODERDANTE") + ", comprendiendo todas las gestiones, inscripciones, registros y trámites —societarios, fiscales y laborales— que dicho plan incluye, o hasta la revocación expresa de " + (socios.length > 1 ? "los PODERDANTES" : "el PODERDANTE") + ", lo que ocurra primero. Se faculta expresamente al APODERADO para realizar las gestiones futuras relacionadas con el nombre comercial y los registros sociales necesarios para asegurar la formalización y operatividad de la entidad conforme al plan contratado.")]));
  // SÉPTIMO
  const tw = PO.testigo;
  c.push(P([RB("SÉPTIMO: TESTIGO INSTRUMENTAL. "), R("Asiste en calidad de testigo "), RB(upper(tw.nombre)), R(", " + tw.generales + ", con domicilio y residencia en " + tw.domicilio + ", testigo instrumental requerido al efecto, libre de las tachas y excepciones que establece la ley.")]));
  c.push(SPACER(60));
  c.push(P([R("Hecho, pasado y firmado en la ciudad de " + PO.ciudad + ", República Dominicana, " + PO.fechaLarga + ".")]));

  // firmas: poderdantes (2 col) + apoderado + testigo
  c.push(SPACER(200));
  firmasGrid(c, socios.map((s) => ({ nombre: s.nombre, calidad: "Poderdante" })));
  c.push(SPACER(160));
  firmaCentrada(c, "JULIO DARWIN MENDOZA ESTRELLA", ["Por SMART BIZ SERVICES, SRL (Apoderado)"], 120);
  c.push(SPACER(160));
  firmaCentrada(c, tw.nombre, ["Testigo"], 120);

  // legalización notarial
  c.push(SPACER(200));
  c.push(P([RB("LEGALIZACIÓN DE FIRMAS")], { align: AlignmentType.CENTER, after: 120 }));
  const firmantes = socios.map((s) => upper(s.nombre)).concat(["JULIO DARWIN MENDOZA ESTRELLA", upper(tw.nombre)]);
  c.push(P([R("Yo, "), RB(NO.nombre), R(", " + NO.credencial + ", "), RB("CERTIFICO Y DOY FE"), R(" que las firmas que anteceden fueron puestas libre y voluntariamente en mi presencia por los señores " + firmantes.join(", ") + ", de generales que constan en este acto, quienes me han declarado bajo la fe del juramento que esas son las mismas firmas que acostumbran a usar en todos los actos de su vida pública y privada. En la ciudad de " + PO.ciudad + ", República Dominicana, " + PO.fechaLarga + ".")]));
  firmaCentrada(c, NO.nombre, ["Notario Público"], 280);
  return buildDocument("Poder de Representación", c);
}

function litItems(c, items, kind) {
  const ref = kind === "bullet" ? "bullets" : null;
  const letras = "abcdefghijklmnopqrstuvwxyz";
  items.forEach((runs, i) => {
    if (ref) {
      c.push(P(runs, { numbering: { reference: "bullets", level: 0 }, after: 20 }));
    } else {
      const tag = kind === "abc" ? letras[i] + ") " : (i + 1) + ". ";
      c.push(P([R(tag), ...runs], { indent: { left: 600, hanging: 280 }, after: 20 }));
    }
  });
}

// =====================================================================
const NF = S.nombre + " SRL"; // base de nombre de archivo (sin puntos)
const files = [
  ["1. ESTATUTOS SOCIALES - " + NF + ".docx", docEstatutos()],
  ["2. NOMINA Y ASAMBLEA GENERAL ORDINARIA - " + NF + ".docx", docNominaAsamblea()],
  ["3. PODER DE REPRESENTACION (PDR) - " + NF + ".docx", docPoder()],
];
(async () => {
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
  for (const [name, d] of files) {
    const buf = await Packer.toBuffer(d);
    fs.writeFileSync(path.join(OUTDIR, name), buf);
    console.log("OK  ->", name);
  }
  console.log("\nExpediente generado en:\n" + OUTDIR);
})().catch((e) => { console.error("ERROR:", e); process.exit(1); });
