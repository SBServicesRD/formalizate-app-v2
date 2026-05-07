import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-extrabold text-sbs-blue mb-6">Política de Privacidad</h1>
                <div className="prose prose-lg text-sbs-gray-700 max-w-none space-y-4">
                    <p><strong>Última actualización:</strong> 10 de febrero de 2026</p>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">1. Introducción y Marco Legal</h2>
                    <p>
                        Bienvenido a Formalizate.app ("nosotros", "nuestro", "la plataforma"), un servicio operado por Smart Biz Services S.R.L. Respetamos su privacidad y nos comprometemos a proteger sus datos personales de conformidad con la <strong>Ley No. 172-13 sobre Protección de Datos de Carácter Personal</strong> de la República Dominicana. Esta política de privacidad le informará sobre cómo recopilamos, usamos, almacenamos y protegemos sus datos personales cuando utiliza nuestro sitio web, y le informa sobre sus derechos de privacidad y cómo la ley lo protege.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">2. Datos que Recopilamos</h2>
                    <p>
                        Podemos recopilar, usar, almacenar y transferir diferentes tipos de datos personales sobre usted, que hemos agrupado de la siguiente manera:
                    </p>
                    <ul>
                        <li><strong>Datos de Identidad:</strong> nombre, apellido, número de cédula o pasaporte, fecha de nacimiento, estado civil, nacionalidad y profesión.</li>
                        <li><strong>Datos de Contacto:</strong> dirección de correo electrónico, números de teléfono, dirección física y código postal.</li>
                        <li><strong>Datos Técnicos:</strong> dirección IP, datos de inicio de sesión, tipo y versión del navegador, zona horaria y sistema operativo.</li>
                        <li><strong>Datos de la Empresa:</strong> toda la información proporcionada en nuestros formularios relacionada con la constitución de su empresa, incluyendo objeto social, capital social, estructura de socios, participaciones y datos de beneficiarios finales.</li>
                        <li><strong>Documentos de Identidad:</strong> copias digitales de cédulas de identidad, pasaportes y otros documentos oficiales requeridos para los trámites de constitución.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-sbs-blue">3. Cómo se Recopilan sus Datos</h2>
                    <p>
                        Utilizamos diferentes métodos para recopilar datos de y sobre usted:
                    </p>
                    <ul>
                        <li><strong>Interacciones directas:</strong> Usted nos proporciona sus datos al completar formularios en Formalizate.app, al registrarse, al realizar pagos o al mantener correspondencia con nosotros por correo electrónico, teléfono, WhatsApp u otro medio.</li>
                        <li><strong>Tecnologías automatizadas:</strong> A medida que interactúa con nuestro sitio web, podemos recopilar automáticamente datos técnicos sobre su equipo, acciones de navegación y patrones de uso.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-sbs-blue">4. Finalidades del Tratamiento</h2>
                    <p>
                        Utilizamos sus datos personales para las siguientes finalidades específicas:
                    </p>
                    <ul>
                        <li><strong>Ejecución del servicio contratado:</strong> Preparar y gestionar los documentos constitutivos de su empresa, realizar trámites ante ONAPI, Cámara de Comercio, DGII, TSS, DGA y demás entidades gubernamentales.</li>
                        <li><strong>Cumplimiento de obligaciones legales:</strong> Identificar beneficiarios finales conforme a la Ley No. 155-17 contra el Lavado de Activos; cumplir con obligaciones tributarias; responder a requerimientos de autoridades competentes.</li>
                        <li><strong>Comunicaciones del servicio:</strong> Enviarle actualizaciones sobre el estado de su trámite, confirmaciones de pago y notificaciones relevantes a su solicitud.</li>
                        <li><strong>Mejora de la plataforma:</strong> Analizar el uso del sitio para mejorar la experiencia del usuario (datos técnicos anonimizados).</li>
                    </ul>

                    <h2 className="text-xl font-bold text-sbs-blue">5. Base Legal del Tratamiento</h2>
                    <p>
                        El tratamiento de sus datos se fundamenta en las siguientes bases legales, según la Ley 172-13:
                    </p>
                    <ul>
                        <li><strong>Ejecución de un contrato:</strong> El tratamiento es necesario para prestar el servicio de constitución de empresas que usted ha contratado.</li>
                        <li><strong>Cumplimiento de obligaciones legales:</strong> Estamos obligados por ley a recopilar cierta información (p. ej., datos de beneficiarios finales bajo la Ley 155-17, información tributaria bajo el Código Tributario).</li>
                        <li><strong>Consentimiento:</strong> Para finalidades no cubiertas por las bases anteriores (como comunicaciones promocionales), solicitaremos su consentimiento expreso, el cual usted puede revocar en cualquier momento.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-sbs-blue">6. Transferencias de Datos y Terceros</h2>
                    <p>
                        Para la prestación del servicio, sus datos pueden ser compartidos con los siguientes terceros:
                    </p>
                    <ul>
                        <li><strong>Entidades gubernamentales:</strong> ONAPI, Cámara de Comercio, DGII, TSS, DGA, Ministerio de Trabajo y demás instituciones involucradas en el proceso de constitución y registro de su empresa.</li>
                        <li><strong>Notarías:</strong> Para la firma y legalización de documentos constitutivos.</li>
                        <li><strong>Pasarelas de pago:</strong> PayPal y otros procesadores de pago para gestionar sus transacciones de forma segura.</li>
                        <li><strong>Proveedores de infraestructura tecnológica:</strong> Utilizamos Firebase (Google Cloud Platform) para el almacenamiento de datos y la autenticación de usuarios. Estos servicios pueden almacenar datos en servidores ubicados fuera de la República Dominicana (principalmente en Estados Unidos). Google cumple con estándares internacionales de protección de datos y seguridad (ISO 27001, SOC 2, SOC 3).</li>
                    </ul>
                    <p>
                        Solo compartimos la información estrictamente necesaria para cada finalidad y exigimos a nuestros proveedores que mantengan estándares adecuados de protección de datos.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">7. Conservación de Datos</h2>
                    <p>
                        Conservamos sus datos personales durante el tiempo necesario para cumplir con las finalidades para las que fueron recopilados, incluyendo:
                    </p>
                    <ul>
                        <li><strong>Datos del servicio:</strong> Durante la vigencia de la relación contractual y por un periodo adicional de 10 años, conforme a las obligaciones de conservación de registros mercantiles y tributarios establecidas por la legislación dominicana.</li>
                        <li><strong>Datos de facturación y pagos:</strong> 10 años, conforme al Código Tributario (Ley 11-92).</li>
                        <li><strong>Datos técnicos y de navegación:</strong> Máximo 2 años desde su recopilación.</li>
                    </ul>
                    <p>
                        Transcurridos los plazos indicados, los datos serán eliminados o anonimizados de forma irreversible.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">8. Sus Derechos (Derechos ARCO)</h2>
                    <p>
                        De conformidad con la Ley No. 172-13, usted tiene los siguientes derechos sobre sus datos personales:
                    </p>
                    <ul>
                        <li><strong>Acceso:</strong> Derecho a conocer qué datos personales tenemos sobre usted y cómo los tratamos.</li>
                        <li><strong>Rectificación:</strong> Derecho a solicitar la corrección de datos inexactos o incompletos.</li>
                        <li><strong>Cancelación:</strong> Derecho a solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad para la que fueron recogidos, salvo que exista una obligación legal de conservarlos.</li>
                        <li><strong>Oposición:</strong> Derecho a oponerse al tratamiento de sus datos para determinadas finalidades, especialmente las relacionadas con comunicaciones comerciales.</li>
                    </ul>
                    <p>
                        <strong>Cómo ejercer sus derechos:</strong> Envíe un correo electrónico a <a href="mailto:soporte@formalizate.app" className="text-sbs-blue-medium hover:underline">soporte@formalizate.app</a> indicando: (1) su nombre completo, (2) número de cédula o pasaporte, (3) el derecho que desea ejercer, y (4) una descripción clara de su solicitud. Responderemos su solicitud en un plazo máximo de 15 días hábiles.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">9. Seguridad de los Datos</h2>
                    <p>
                        <strong>Plataforma:</strong> Implementamos medidas técnicas y organizativas para proteger sus datos personales, incluyendo: cifrado de todas las comunicaciones mediante protocolo HTTPS/SSL; almacenamiento seguro con cifrado AES-256; controles de acceso restringido a bases de datos (solo personal autorizado); autenticación segura con hashing de contraseñas; monitoreo continuo de la infraestructura.
                    </p>
                    <p className="mt-4">
                        <strong>Pagos:</strong> Los métodos de pago utilizados son servicios de terceros que cumplen con todos los estándares de seguridad PCI-DSS. Formalizate.app no almacena datos de tarjetas de crédito o débito; estos son procesados directamente por la pasarela de pago correspondiente. Recomendamos leer las Políticas de Privacidad de estos proveedores para entender cómo manejan la información suministrada.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">10. Contacto</h2>
                    <p>
                        Para cualquier consulta, solicitud o reclamo relacionado con esta Política de Privacidad o con el tratamiento de sus datos personales, puede contactarnos en:
                    </p>
                    <ul>
                        <li><strong>Correo electrónico:</strong> <a href="mailto:soporte@formalizate.app" className="text-sbs-blue-medium hover:underline">soporte@formalizate.app</a></li>
                        <li><strong>Responsable:</strong> Smart Biz Services S.R.L. – Departamento de Protección de Datos</li>
                    </ul>

                    <h2 className="text-xl font-bold text-sbs-blue">11. Cambios en esta Política</h2>
                    <p>
                        Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. Los cambios entrarán en vigor en la fecha indicada como "Última actualización" en la parte superior de este documento. Para cambios sustanciales, haremos esfuerzos razonables por notificar a los usuarios registrados. El uso continuado de la plataforma tras la publicación de cambios constituye la aceptación de la nueva Política.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;