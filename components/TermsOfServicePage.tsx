import React from 'react';

const TermsOfServicePage: React.FC = () => {
    return (
        <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-extrabold text-sbs-blue mb-6">Términos y Condiciones de Servicio</h1>
                <div className="prose prose-lg text-sbs-gray-700 max-w-none space-y-4">
                    <p><strong>Última actualización:</strong> 10 de febrero de 2026</p>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">1. Aceptación de los Términos</h2>
                    <p>
                        Al utilizar los servicios de Formalizate.app, una plataforma de Smart Biz Services S.R.L. ("Compañía", "nosotros", "nuestro"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no puede acceder al servicio. Al marcar la casilla "He leído y acepto" o al utilizar la plataforma, usted suscribe electrónicamente este contrato, conforme a la Ley No. 126-02 sobre Comercio Electrónico, Documentos y Firmas Digitales de la República Dominicana, otorgándole la misma fuerza y efectos que una firma manuscrita.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">2. Naturaleza del Servicio</h2>
                    <p>
                        Formalizate.app es una plataforma digital de gestión de trámites operada por Smart Biz Services S.R.L. <strong>No somos un bufete de abogados ni prestamos servicios jurídicos directos.</strong> Actuamos como un intermediario especializado que facilita la preparación, gestión y presentación de documentos para la constitución de empresas en la República Dominicana, apoyados por abogados consultores internos que validan el trabajo realizado. El uso de esta plataforma no constituye una relación abogado-cliente.
                    </p>
                    <p>
                        Toda la información proporcionada a través de la plataforma tiene carácter orientativo y administrativo. Para decisiones legales complejas o situaciones particulares, recomendamos consultar con un abogado de su confianza.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">3. Descripción del Proceso</h2>
                    <p>
                        El servicio de constitución de empresas incluye, según el plan contratado, la gestión de los siguientes pasos:
                    </p>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li><strong>Registro de Nombre Comercial:</strong> Solicitud y obtención del nombre comercial ante la Oficina Nacional de la Propiedad Industrial (ONAPI).</li>
                        <li><strong>Preparación de Documentos Constitutivos:</strong> Redacción de Estatutos Sociales, Acta de Asamblea Constitutiva y Nómina de Socios, conforme a la Ley No. 479-08.</li>
                        <li><strong>Firma ante Notario:</strong> Los documentos constitutivos requieren ser firmados ante un notario público para su validez legal. Formalizate.app coordina este proceso; la firma puede realizarse de forma presencial o, cuando corresponda, mediante mecanismos legalmente válidos.</li>
                        <li><strong>Registro Mercantil:</strong> Depósito e inscripción de los documentos ante la Cámara de Comercio y Producción correspondiente.</li>
                        <li><strong>Trámites Fiscales:</strong> Gestión del Registro Nacional de Contribuyentes (RNC), habilitación de la Oficina Virtual DGII y solicitud de Comprobantes Fiscales (NCF) ante la Dirección General de Impuestos Internos (DGII).</li>
                        <li><strong>Trámites Adicionales (según plan):</strong> Registros laborales (TSS, Ministerio de Trabajo), Registro de Importador/Exportador (DGA), Registro de Proveedor del Estado (RPE), entre otros.</li>
                    </ol>
                    <p>
                        Los plazos de entrega son estimados (generalmente entre 10 y 15 días laborables tras la recepción de documentos firmados) y pueden variar dependiendo de la carga de trabajo de las entidades gubernamentales involucradas, causas de fuerza mayor o situaciones fuera de nuestro control.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">4. Tipos Societarios</h2>
                    <p>
                        Actualmente, Formalizate.app ofrece la constitución de <strong>Sociedades de Responsabilidad Limitada (S.R.L.)</strong>, reguladas por la Ley No. 479-08. La S.R.L. se constituye con un mínimo de 2 y un máximo de 50 socios, cuya responsabilidad está limitada al monto de sus aportes. El capital social se divide en cuotas o partes sociales. La administración puede estar a cargo de uno o más gerentes, sean socios o terceros.
                    </p>
                    <p>
                        En el futuro, la plataforma podrá habilitar otros tipos societarios contemplados en la Ley 479-08 (como EIRL, S.A., S.A.S., entre otros), los cuales se regirán por las disposiciones legales específicas aplicables a cada tipo.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">5. Responsabilidades del Usuario</h2>
                    <p>
                        Usted es el único responsable de la veracidad, exactitud e integridad de toda la información que nos proporciona a través de Formalizate.app. Usted garantiza que tiene la autoridad legal para proporcionar esta información y para constituir una entidad legal. La falsedad o inexactitud de los datos proporcionados podrá derivar en la cancelación del servicio sin derecho a reembolso, sin perjuicio de las acciones legales que correspondan.
                    </p>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">6. Pagos y Tarifas</h2>
                    <p>
                        Todas las tarifas de nuestros servicios se indican claramente en nuestro sitio web. Los precios publicados incluyen ITBIS y las tarifas gubernamentales estándar correspondientes al plan contratado. El pago debe realizarse en su totalidad antes de que comencemos a procesar su solicitud. Formalizate.app se reserva el derecho de ajustar sus tarifas cuando las entidades gubernamentales modifiquen sus costos oficiales, notificando previamente al usuario.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">7. Obligaciones Tributarias del Usuario</h2>
                    <p>
                        Formalizate.app gestiona la constitución de su empresa y los trámites iniciales ante la DGII (RNC, NCF, Oficina Virtual, entre otros, según el plan contratado). Sin embargo, <strong>la presentación periódica de declaraciones de impuestos, el cumplimiento fiscal continuo y la gestión tributaria posterior son responsabilidad exclusiva del usuario o de su contador/asesor fiscal.</strong> La emisión de comprobantes fiscales (NCF) se realiza dentro del sistema de facturación electrónica de la DGII (e-CF) y requiere un certificado digital vigente, el cual se incluye en todos nuestros planes.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">8. Cumplimiento Legal y Beneficiarios Finales</h2>
                    <p>
                        En cumplimiento de la Ley No. 155-17 contra el Lavado de Activos y el Financiamiento del Terrorismo, Formalizate.app recopila información sobre los socios, accionistas y beneficiarios finales de las empresas constituidas a través de la plataforma. Se entiende por beneficiario final a toda persona física que posea o controle, directa o indirectamente, el 20% o más de las participaciones de la sociedad, o que ejerza control efectivo sobre la misma.
                    </p>
                    <p>
                        Usted declara y garantiza que la información sobre socios y beneficiarios finales proporcionada es veraz y completa. Formalizate.app podrá solicitar documentación adicional cuando lo considere necesario para cumplir con sus obligaciones legales. La información proporcionada podrá ser reportada a las autoridades competentes cuando la ley así lo exija. La negativa a proporcionar información requerida podrá resultar en la suspensión o cancelación del servicio.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">9. Respaldo Legal y Limitación de Responsabilidad</h2>
                    <p>
                        Smart Biz Services S.R.L. cuenta con abogados expertos consultores que validan internamente todo el trabajo realizado a través de Formalizate.app, garantizando que cada documento cumpla con los estándares legales vigentes en República Dominicana. Nuestra responsabilidad total hacia usted por cualquier reclamo que surja de estos servicios no excederá la cantidad que usted nos pagó por el servicio contratado.
                    </p>
                    <p>
                        Formalizate.app no será responsable por: (a) rechazos o demoras causados por las entidades gubernamentales (ONAPI, Cámara de Comercio, DGII, TSS, DGA, etc.); (b) errores derivados de información falsa, incompleta o inexacta proporcionada por el usuario; (c) causas de fuerza mayor, incluyendo desastres naturales, fallos de infraestructura pública, cambios legislativos imprevistos o interrupciones en los servicios gubernamentales; (d) daños indirectos, consecuentes o lucro cesante.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">10. Propiedad Intelectual</h2>
                    <p>
                        La marca Formalizate.app, su logotipo, diseño, textos, código fuente, contenido y demás elementos del sitio web son propiedad exclusiva de Smart Biz Services S.R.L. o de sus licenciantes. Se concede al usuario una licencia limitada, no exclusiva, intransferible y revocable para utilizar la plataforma exclusivamente para los fines previstos en estos Términos.
                    </p>
                    <p>
                        Queda prohibido: reproducir, distribuir, modificar o crear obras derivadas del contenido del sitio; realizar ingeniería inversa del software; utilizar herramientas automatizadas de extracción de datos (scraping); o utilizar la marca o contenidos sin autorización previa y por escrito.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">11. Ley Aplicable y Jurisdicción</h2>
                    <p>
                        Estos Términos y Condiciones se regirán e interpretarán de conformidad con las leyes de la República Dominicana. Para cualquier controversia que surja de la interpretación, ejecución o terminación de estos Términos, las partes se someten a la jurisdicción exclusiva de los tribunales competentes del Distrito Nacional, República Dominicana, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">12. Cambios en los Términos</h2>
                    <p>
                        Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Los cambios entrarán en vigor en la fecha indicada como "Última actualización" en la parte superior de este documento. El uso continuado de la plataforma tras la publicación de cambios constituye la aceptación de los nuevos Términos. Para cambios sustanciales, haremos esfuerzos razonables por notificar a los usuarios registrados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;