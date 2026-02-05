

import React, { useState } from 'react';
import { FormData } from '../types';
import { Building, ChevronDown } from 'lucide-react';

interface StepTypeSelectionProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    nextStep: () => void;
}

const COMING_SOON_TYPES = [
    {
        title: "E.I.R.L. – Empresa Individual de Responsabilidad Limitada",
        description: "La estructura ideal para emprendedores individuales que quieren operar sin socios, pero con protección patrimonial. Te permite separar tus bienes personales de los del negocio, mantener control total y crecer de manera formal, ordenada y segura."
    },
    {
        title: "S.A. – Sociedad Anónima",
        description: "El tipo societario diseñado para empresas de mayor tamaño, expansión o proyectos que requieren inversionistas y estructuras corporativas más robustas. Permite emitir acciones, tener un Consejo de Administración y acceder a operaciones bancarias y comerciales de alto volumen."
    },
    {
        title: "S.A.S. – Sociedad por Acciones Simplificada",
        description: "La forma más flexible y moderna de hacer empresa en República Dominicana. Perfecta para startups, negocios innovadores y proyectos que necesitan levantar capital o escalar rápido. Combina la protección limitada de la S.R.L. con la estructura accionaria de la S.A., pero con menos formalidades."
    },
    {
        title: "S.A.P. – Sociedad Anónima de Participación Pública",
        description: "El modelo corporativo utilizado por empresas que cotizan en bolsa o administran capital abierto al público. Diseñada para instituciones de gran envergadura, con exigencias estrictas de transparencia, gobernanza y supervisión. Es la estructura de las grandes empresas públicas y emisoras de valores."
    },
    {
        title: "Sociedad en Nombre Colectivo",
        description: "Una sociedad tradicional basada en la confianza absoluta entre los socios, quienes responden ilimitada y solidariamente por las obligaciones sociales. Requiere alta integridad entre los participantes y se utiliza generalmente para negocios familiares o profesionales muy específicos."
    },
    {
        title: "Sociedad en Comandita Simple",
        description: "Una estructura híbrida que combina socios gestores (con responsabilidad ilimitada) y socios comanditarios (con responsabilidad limitada). Permite que unos aporten capital sin involucrarse en la gestión, mientras otros administran con libertad operativa."
    },
    {
        title: "Sociedad en Comandita por Acciones",
        description: "Similar a la comandita simple, pero su capital está dividido en acciones. Es útil cuando se requiere inversión de terceros sin otorgarles control operativo, manteniendo la gestión exclusivamente en manos de los socios gestores."
    },
    {
        title: "Sociedad Extranjera Registrada",
        description: "Empresas constituidas fuera del país que desean operar en República Dominicana. La ley les permite registrarse, establecer sucursales y participar en actividades comerciales bajo un marco jurídico claro y reconocido internacionalmente."
    }
];

const StepTypeSelection: React.FC<StepTypeSelectionProps> = ({ formData, updateFormData, nextStep }) => {
    const [showOthers, setShowOthers] = useState(false);

    const handleSRL = () => {
        updateFormData({ companyType: 'SRL' });
        nextStep();
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-sbs-blue mb-3">Estructura Empresarial</h2>
                <p className="text-text-secondary text-sm font-light">
                    Selecciona el vehículo legal para tu negocio.
                </p>
            </div>

            {/* Opción Principal SRL */}
            <div 
                className="group bg-white border border-premium-border rounded-[2rem] p-6 sm:p-10 shadow-premium-card hover:shadow-premium-hover hover:border-sbs-blue/30 transition-all duration-500 cursor-pointer relative overflow-hidden"
                onClick={handleSRL}
            >
                <div className="absolute top-0 right-0 bg-premium-surface-subtle border-b border-l border-premium-border text-sbs-blue text-[10px] font-bold px-5 py-2 rounded-bl-2xl uppercase tracking-widest">Recomendado</div>
                
                <div className="flex flex-col sm:flex-row items-start relative z-10 gap-4 sm:gap-0">
                    <div className="bg-blue-50 p-5 rounded-2xl sm:mr-8 border border-blue-50 group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
                        <Building className="w-8 h-8 text-sbs-blue" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-3xl font-bold text-text-primary group-hover:text-sbs-blue transition-colors mb-3">S.R.L. – Sociedad de Responsabilidad Limitada</h3>
                        <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 font-light">
                            El tipo de empresa más práctico y seguro para emprendedores en República Dominicana. Protege tu patrimonio personal y te permite operar con credibilidad formal desde el primer día.
                        </p>
                        <span className="text-sbs-blue text-sm font-bold flex items-center group-hover:translate-x-2 transition-transform">
                            Seleccionar Estructura <span className="ml-2">&rarr;</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Otras Opciones (Acordeón) */}
            <div className="mt-10 text-center">
                <button 
                    onClick={() => setShowOthers(!showOthers)}
                    className="text-gray-400 hover:text-sbs-blue font-medium text-xs transition-colors focus:outline-none flex items-center justify-center mx-auto"
                >
                    <span className="mr-2">{showOthers ? 'Ocultar opciones' : 'Ver otros tipos societarios'}</span>
                    <ChevronDown className={`w-3 h-3 transform transition-transform ${showOthers ? 'rotate-180' : ''}`} />
                </button>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showOthers ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                    <div className="grid gap-4">
                        {COMING_SOON_TYPES.map((type, index) => (
                            <div key={index} className="p-6 border border-gray-100 rounded-2xl bg-gray-50 opacity-80 cursor-not-allowed text-left hover:border-gray-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-700 text-lg">{type.title}</h4>
                                    <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded font-bold uppercase tracking-wider whitespace-nowrap ml-4 h-fit">Próximamente</span>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed font-light">{type.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepTypeSelection;