import React from 'react';

const TermsOfServicePage: React.FC = () => {
    return (
        <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-extrabold text-sbs-blue mb-6">Términos y Condiciones de Servicio</h1>
                <div className="prose prose-lg text-sbs-gray-700 max-w-none space-y-4">
                    <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-DO')}</p>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">1. Aceptación de los Términos</h2>
                    <p>
                        Al utilizar los servicios de Formalizate.app, una plataforma de Smart Biz Services S.R.L. ("Compañía", "nosotros", "nuestro"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no puede acceder al servicio.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">2. Descripción del Servicio</h2>
                    <p>
                        Formalizate.app proporciona una plataforma en línea para facilitar la constitución de Sociedades de Responsabilidad Limitada (S.R.L.) en la República Dominicana. Actuamos como un intermediario para la preparación y presentación de documentos basados en la información que usted proporciona.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">3. Responsabilidades del Usuario</h2>
                    <p>
                        Usted es el único responsable de la veracidad, exactitud e integridad de toda la información que nos proporciona a través de Formalizate.app. Usted garantiza que tiene la autoridad legal para proporcionar esta información y para formar una entidad legal.
                    </p>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">4. Pagos y Tarifas</h2>
                    <p>
                        Todas las tarifas de nuestros servicios se indican claramente en nuestro sitio web. El pago debe realizarse en su totalidad antes de que comencemos a procesar su solicitud. Las tarifas pagadas a través de Formalizate.app incluyen nuestros honorarios de servicio y los impuestos gubernamentales correspondientes.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">5. Respaldo Legal y Limitación de Responsabilidad</h2>
                    <p>
                       Smart Biz Services S.R.L. cuenta con abogados expertos consultores que validan internamente todo el trabajo realizado a través de Formalizate.app, garantizando que cada documento cumpla con los estándares legales vigentes en República Dominicana. Nuestro servicio incluye la gestión integral y el procesamiento profesional de documentos constitutivos. Nuestra responsabilidad total hacia usted por cualquier reclamo que surja de estos servicios no excederá la cantidad que nos pagó por los servicios.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">6. Cambios en los Términos</h2>
                    <p>
                       Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;