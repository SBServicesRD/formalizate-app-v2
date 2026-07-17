// ============================================================
// PLANTILLAS DE CORREO — sistema coherente
// ============================================================
// Un ÚNICO "shell" (membrete azul + "Hola {nombre}," + pie) envuelve todos los
// correos. El contenido se compone por PROPÓSITO:
//   • Transaccional (orden, pago) → incluye el bloque RECIBO (Orden + Servicio + Monto).
//   • Acción requerida / progreso → NO lleva precio; solo la referencia del
//     expediente + el mensaje + su botón. (El monto ahí es ruido.)
// Así el precio aparece SOLO donde tiene sentido.

function getTemplate(type, data) {
  const { nombre, plan, monto, orderId, dashboardUrl, dashboardPin, hitoLabel, motivo, mensajeCliente, resumeUrl } = data;

  const styles = {
    container: "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;",
    header: "background-color: #1D3557; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;",
    btn: "background-color: #E63A47; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px;",
    btnBlue: "background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 20px;",
    pin: "letter-spacing: 8px; font-size: 28px; font-weight: bold; color: #1D3557; background: #f0f4ff; border: 2px dashed #1D3557; padding: 12px 24px; border-radius: 8px; display: inline-block;",
  };

  // Shell coherente para TODOS los correos.
  const shell = (headerTitle, inner) => `
    <div style="${styles.container}">
      <div style="${styles.header}"><h2 style="margin:0;">${headerTitle}</h2></div>
      <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin-top:0;">Hola <strong>${nombre || "Cliente"}</strong>,</p>
        ${inner}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px;" />
        <p style="font-size:11px;color:#aaa;margin:0;">Equipo de Formalízate.app · ventas@formalizate.app</p>
      </div>
    </div>`;

  // Bloque RECIBO — SOLO correos transaccionales.
  const bloqueRecibo = `
    <div style="background:#f4f4f4;padding:10px;text-align:center;margin:4px 0 15px;font-weight:bold;color:#1D3557;">Orden: ${orderId || "—"}</div>
    <table style="width:100%;margin-bottom:20px;">
      <tr><td>Servicio:</td><td style="text-align:right"><strong>${plan || "—"}</strong></td></tr>
      <tr><td>Monto:</td><td style="text-align:right"><strong>RD$ ${monto || "—"}</strong></td></tr>
    </table>`;

  // Referencia ligera del expediente (acción/progreso) — SIN precio.
  const refExpediente = orderId
    ? `<p style="font-size:12px;color:#999;margin:0 0 14px;">Expediente: ${orderId}</p>` : "";

  // Sección PIN (solo si se envía dashboardPin — legado).
  const dashboardSection = dashboardUrl && dashboardPin ? `
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-weight: bold; color: #1D3557;">📊 Tu Panel de Seguimiento</p>
    <p style="font-size: 13px; color: #555;">Accede en tiempo real al estado de tu expediente con el enlace y PIN que te asignamos:</p>
    <div style="text-align: center; margin: 16px 0;"><a href="${dashboardUrl}" style="${styles.btnBlue}">Ver mi Expediente</a></div>
    <p style="text-align: center; font-size: 12px; color: #888; margin-bottom: 4px;">Tu PIN de acceso (guárdalo, es único):</p>
    <div style="text-align: center; margin-bottom: 16px;"><span style="${styles.pin}">${dashboardPin}</span></div>
    <p style="font-size: 11px; color: #aaa; text-align: center;">Si alguien más te pidió este PIN, no lo compartas. Es personal e intransferible.</p>
  ` : "";

  const cta  = (label) => `<center><a href="${dashboardUrl || "#"}" style="${styles.btn}">${label}</a></center>`;
  const ctaNav = (label) => `<center><a href="${dashboardUrl || "#"}" style="${styles.btnBlue}">${label}</a></center>`;

  const templates = {
    // ── Transaccionales (llevan RECIBO con precio) ──────────────────────────
    orden_recibida: {
      subject: "Orden Recibida - Validando Comprobante",
      html: shell("🔍 Validando tu Orden",
        `${bloqueRecibo}<div style="background-color:#fff3cd;padding:15px;border-radius:5px;color:#856404;">Hemos recibido tu comprobante. Nuestro equipo lo está verificando manualmente.</div>${dashboardSection}`),
    },
    pago_exitoso: {
      subject: "✅ Pago Confirmado - Iniciamos labores",
      html: shell("¡Pago Confirmado!",
        `${bloqueRecibo}<p>Tu pago ha sido procesado exitosamente. Ya hemos iniciado tu expediente legal.</p>${dashboardSection}`),
    },
    transferencia_validada: {
      subject: "✅ Transferencia Validada",
      html: shell("Pago Aprobado",
        `${bloqueRecibo}<p>Hemos confirmado tu transferencia bancaria.</p>${cta("Ver Estatus")}`),
    },
    // Venta nacida al pagar (borrador): recibo + la LLAVE para continuar el
    // expediente en cualquier momento y desde cualquier dispositivo.
    continua_expediente: {
      subject: "🔑 Pago registrado — continúa tu expediente cuando quieras",
      html: shell("¡Pago Registrado!",
        `${bloqueRecibo}<p>Tu pago quedó registrado y tu expediente está <strong>abierto y esperándote</strong>. Complétalo ahora o cuando te convenga: este enlace es tu llave personal — si cierras la página, se va la luz o cambias de dispositivo, te devuelve exactamente donde ibas, sin pagar nada de nuevo.</p><div style="text-align: center; margin: 16px 0;"><a href="${resumeUrl || "#"}" style="${styles.btn}">Continuar mi Expediente</a></div><p style="text-align: center; font-size: 12px; color: #888; margin-bottom: 4px;">Tu PIN de acceso (guárdalo, es único):</p><div style="text-align: center; margin-bottom: 16px;"><span style="${styles.pin}">${dashboardPin || "—"}</span></div><p style="font-size: 11px; color: #aaa; text-align: center;">Si alguien más te pidió este PIN, no lo compartas. Es personal e intransferible.</p>`),
    },

    // ── Acción / progreso (SIN precio) ──────────────────────────────────────
    documentos_listos: {
      subject: "📄 Tus documentos constitutivos están listos para revisar",
      html: shell("Tus documentos están listos",
        `${refExpediente}<p>Hemos preparado tus <strong>documentos constitutivos</strong> (estatutos / acta constitutiva). Revísalos en tu panel y, si todo está correcto, <strong>apruébalos con un clic</strong> para que sigamos avanzando. Si necesitas un cambio, puedes decírnoslo desde el mismo panel.</p><div style="background-color:#fff8e1;padding:12px 15px;border-radius:6px;color:#8a6d3b;font-size:13px;margin:16px 0;">ℹ️ El nombre comercial en los documentos es <strong>provisional</strong> mientras ONAPI lo aprueba. Si llegara a ser objetado, lo sustituiremos y te avisaremos antes de continuar.</div>${cta("Revisar y Aprobar")}${dashboardSection}`),
    },
    onapi_listo: {
      subject: "🚀 Nombre Comercial Aprobado (ONAPI)",
      html: shell("¡Nombre Aprobado!",
        `${refExpediente}<p>Buenas noticias: ONAPI ha concedido oficialmente el nombre de tu empresa.</p>${cta("Ver Documento")}`),
    },
    onapi_objetada: {
      subject: "⚠️ Acción requerida: ONAPI objetó el nombre comercial",
      html: shell("Necesitamos tu confirmación",
        `${refExpediente}<div style="background-color:#fdecea;padding:15px;border-radius:6px;color:#a11722;border-left:4px solid #E63A47;margin-bottom:16px;"><strong>ONAPI objetó el nombre comercial provisional.</strong> Es un paso normal del trámite: por lo general significa que ese nombre ya está registrado o no cumple algún requisito. Tu expediente queda <strong>en pausa</strong> hasta que nos confirmes cómo seguimos.</div>${mensajeCliente ? `<div style="font-size:14px;color:#444;line-height:1.6;margin:4px 0 16px;">${String(mensajeCliente).replace(/\n/g, "<br>")}</div>` : (motivo ? `<p style="font-size:14px;color:#555;"><strong>Detalle de ONAPI:</strong> ${motivo}</p>` : "")}<p>Entra a tu panel para responder y continuar sin perder tiempo.</p>${cta("Revisar y responder")}${dashboardSection}`),
    },
    hito_listo: {
      subject: `✅ Actualización: ${hitoLabel || "Nuevo hito completado"}`,
      html: shell("✅ Actualización de Expediente",
        `${refExpediente}<div style="background-color:#e8f5e9;padding:15px;border-radius:5px;color:#2e7d32;margin-bottom:16px;"><strong>${hitoLabel || "Hito completado"}</strong></div><p style="color:#555;">Continuamos avanzando con tu expediente. Te notificaremos en cada etapa.</p>${ctaNav("Ver Estado de mi Expediente")}${dashboardSection}`),
    },
    completado: {
      subject: "🎉 ¡Tu Empresa está Lista!",
      html: shell("¡Misión Cumplida!",
        `${refExpediente}<p>¡Felicidades! El proceso ha finalizado. Descarga tu RNC y Registro Mercantil.</p>${cta("Descargar Todo")}`),
    },
  };

  return templates[type];
}

module.exports = { getTemplate };
