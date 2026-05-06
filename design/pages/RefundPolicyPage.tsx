import React from 'react';

const RefundPolicyPage: React.FC = () => {
    return (
        <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-extrabold text-sbs-blue mb-6">Política de Reembolso y Entrega</h1>
                <div className="prose prose-lg text-sbs-gray-700 max-w-none space-y-4">
                    <p><strong>Última actualización:</strong> 10 de febrero de 2026</p>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">1. General</h2>
                    <p>
                        En Formalizate.app (Smart Biz Services S.R.L.), nos esforzamos por brindar un servicio de alta calidad. Entendemos que pueden surgir circunstancias que requieran la cancelación de un servicio. Esta política describe nuestras pautas para reembolsos y entregas.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">2. Política de Entrega</h2>
                    <p>
                        El servicio inicia inmediatamente tras el pago en la plataforma. El tiempo de entrega estimado de los documentos constitutivos finales es de 10 a 15 días laborables, contados a partir de la recepción de los documentos firmados por el cliente.
                    </p>

                    <h2 className="text-xl font-bold text-sbs-blue">3. Costos no Reembolsables</h2>
                    <p>
                        Una vez que se ha realizado el pago y hemos comenzado el proceso de registro, incurrimos en costos directos que no son recuperables. Estos incluyen, entre otros, las tarifas gubernamentales pagadas a ONAPI para el registro del nombre comercial y a la Cámara de Comercio.
                    </p>
                    <ul>
                        <li><strong>Cancelación antes del registro del nombre:</strong> Si cancela su pedido antes de que hayamos enviado la solicitud de registro de nombre comercial a ONAPI, tiene derecho a un reembolso completo menos una tarifa administrativa de RD$ 1,500.</li>
                        <li><strong>Cancelación después del registro del nombre:</strong> Si cancela después de que el nombre comercial haya sido registrado pero antes de que los documentos se hayan depositado en la Cámara de Comercio, se reembolsará el monto total menos las tarifas de ONAPI y la tarifa administrativa.</li>
                        <li><strong>Cancelación posterior:</strong> No se realizarán reembolsos una vez que los documentos constitutivos hayan sido depositados en la Cámara de Comercio correspondiente.</li>
                    </ul>
                    
                    <h2 className="text-xl font-bold text-sbs-blue">4. Cómo Solicitar un Reembolso</h2>
                    <p>
                        Todas las solicitudes de cancelación y reembolso deben enviarse por escrito a nuestro correo electrónico de soporte: <a href="mailto:soporte@formalizate.app" className="text-sbs-blue-medium hover:underline">soporte@formalizate.app</a>. Por favor, incluya su nombre completo y el número de referencia de su pedido.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicyPage;