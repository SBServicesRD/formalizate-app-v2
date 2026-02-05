import React, { useState } from 'react';

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-extrabold text-sbs-blue mb-6">Política de Privacidad</h1>
                <div className="prose prose-lg text-sbs-gray-700 max-w-none space-y-4">
                    <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-DO')}</p>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">1. Introducción</h2>
                    <p>
                        Bienvenido a Formalizate.app ("nosotros", "nuestro", "la plataforma"), un servicio operado por Smart Biz Services S.R.L. Respetamos su privacidad y nos comprometemos a proteger sus datos personales. Esta política de privacidad le informará sobre cómo cuidamos sus datos personales cuando visita nuestro sitio web y le informa sobre sus derechos de privacidad y cómo la ley lo protege.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">2. Datos que recopilamos sobre usted</h2>
                    <p>
                        Podemos recopilar, usar, almacenar y transferir diferentes tipos de datos personales sobre usted, que hemos agrupado de la siguiente manera:
                    </p>
                    <ul>
                        <li><strong>Datos de Identidad:</strong> incluye nombre, apellido, número de cédula o pasaporte.</li>
                        <li><strong>Datos de Contacto:</strong> incluye dirección de correo electrónico y números de teléfono.</li>
                        <li><strong>Datos Técnicos:</strong> incluye la dirección del protocolo de Internet (IP), sus datos de inicio de sesión, el tipo y la versión del navegador.</li>
                        <li><strong>Datos de la Empresa:</strong> incluye toda la información proporcionada en nuestros formularios relacionada con la constitución de su empresa.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-sbs-blue">3. Cómo se recopilan sus datos personales</h2>
                    <p>
                        Utilizamos diferentes métodos para recopilar datos de y sobre usted, incluso a través de:
                    </p>
                    <ul>
                        <li><strong>Interacciones directas:</strong> Puede darnos su identidad, contacto y datos financieros al completar formularios en Formalizate.app o al mantener correspondencia con nosotros por correo, teléfono, correo electrónico u otro medio.</li>
                        <li><strong>Tecnologías o interacciones automatizadas:</strong> A medida que interactúa con nuestro sitio web, podemos recopilar automáticamente Datos técnicos sobre su equipo, acciones de navegación y patrones.</li>
                    </ul>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">4. Cómo usamos sus datos personales</h2>
                    <p>
                        Solo usaremos sus datos personales cuando la ley nos lo permita. Con mayor frecuencia, utilizaremos sus datos personales en las siguientes circunstancias:
                    </p>
                     <ul>
                        <li>Para realizar el servicio para el cual nos ha contratado a través de Formalizate.app, es decir, la formalización de su empresa.</li>
                        <li>Donde sea necesario para nuestros intereses legítimos (o los de un tercero) y sus intereses y derechos fundamentales no anulen esos intereses.</li>
                        <li>Para cumplir con una obligación legal o regulatoria.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-sbs-blue">5. Seguridad de los datos</h2>
                    <p>
                       <strong>WEBSITE:</strong> Tomamos todas las medidas y precauciones razonables para proteger tu información personal y seguimos las mejores prácticas de la industria para asegurar que tu información no sea utilizada de manera inapropiada, alterada o destruida. Ciframos la información de tu tarjeta de crédito utilizando la tecnología de capa de puertos seguros (SSL) y la almacenamos con el cifrado AES-256. También seguimos todos los requerimientos del PCI-DSS.
                    </p>
                    <p className="mt-4">
                       <strong>PAGOS:</strong> Los métodos de pago utilizados por LA EMPRESA son servicios de terceros. Estos servicios de terceros, cumplen con todos los estándares de seguridad y cifrado para mantener tu información segura. Solo utilizarán la información necesaria para completar el proceso requerido. También recomendamos leer las Políticas de Privacidad de estos proveedores, para entender mejor cómo manejan la información suministrada.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">6. Contacto</h2>
                    <p>
                       Si tiene alguna pregunta sobre esta política de privacidad, contáctenos en: <a href="mailto:soporte@formalizate.app" className="text-sbs-blue-medium hover:underline">soporte@formalizate.app</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;