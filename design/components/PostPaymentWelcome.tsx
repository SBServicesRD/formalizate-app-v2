import React from 'react';
import { CheckCircle } from 'lucide-react';

interface PostPaymentWelcomeProps {
    onStartForm: () => void;
}

const PostPaymentWelcome: React.FC<PostPaymentWelcomeProps> = ({ onStartForm }) => {
    return (
        <div className="text-center py-12 animate-fade-in-up">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-sbs-blue mb-4">¡Pago Confirmado!</h2>
            <p className="text-xl text-sbs-gray-600 mb-8 max-w-2xl mx-auto">
                Hemos recibido tu pago y tus documentos de identidad. <strong>Ya hemos iniciado la gestión en ONAPI.</strong>
            </p>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 max-w-3xl mx-auto mb-10 text-left">
                <h3 className="text-lg font-bold text-sbs-blue mb-2">¿Qué sigue ahora?</h3>
                <p className="text-sbs-gray-700 mb-4">
                    Mientras nosotros trabajamos en el registro del nombre, necesitamos que completes el <strong>Formulario Maestro</strong> con los detalles finales de tu empresa para redactar los Estatutos.
                </p>
                <div className="flex items-start p-3 bg-white rounded-lg border border-blue-100">
                    <span className="text-2xl mr-3">📝</span>
                    <p className="text-sm text-sbs-gray-600">
                        Tus datos previos ya están guardados. Completar este formulario final toma menos de 5 minutos.
                    </p>
                </div>
            </div>

            <button 
                onClick={onStartForm}
                className="px-12 py-5 bg-sbs-blue text-white rounded-full font-bold shadow-xl hover:shadow-glow-blue hover:-translate-y-0.5 transition-all duration-300 tracking-wide text-lg active:scale-95"
            >
                Completar Expediente Ahora
            </button>
        </div>
    );
};

export default PostPaymentWelcome;
