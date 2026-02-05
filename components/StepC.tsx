
import React, { useMemo, useState } from 'react';
import { FormData } from '../types';
import { validateCedula, validateRequired, formatCedula } from '../utils/validation';
import { Users, Briefcase, ChevronDown, Clock } from 'lucide-react';

interface StepCProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    nextStep: () => void;
    prevStep: () => void;
}

const StepC: React.FC<StepCProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- STYLES PREMIUM REFINED ---
    const inputClass = "w-full px-5 py-4 rounded-xl bg-white border border-gray-200 text-text-primary placeholder-gray-400 focus:outline-none focus:border-sbs-blue focus:ring-4 focus:ring-sbs-blue/10 transition-all duration-300 shadow-sm text-base font-medium disabled:bg-gray-50";
    const labelClass = "block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest";
    
    const handleManagerTypeChange = (type: 'Socio' | 'Tercero') => {
        updateFormData({ manager: { type, name: '', idNumber: '', nationality: 'República Dominicana' } });
        setErrors({});
    };

    const handleSocioManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPartnerName = e.target.value;
        const partner = formData.partners.find(p => `${p.names} ${p.surnames}` === selectedPartnerName);
        if (partner) {
            updateFormData({ manager: { ...formData.manager, name: `${partner.names} ${partner.surnames}`, idNumber: partner.idNumber } });
        }
    };
    
     const handleThirdPartyManagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        let finalValue = value;
        if (name === 'idNumber') {
            finalValue = formatCedula(value);
        }

        updateFormData({ manager: { ...formData.manager, [name]: finalValue } });
        
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: ''}))
        }
    };

    const handleThirdPartyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let error = '';
        if (!validateRequired(value)) {
            error = 'Este campo es requerido.';
        } else if (name === 'idNumber' && !validateCedula(value)) {
            error = 'Formato de cédula inválido.';
        }
        setErrors(prev => ({...prev, [name]: error}));
    }

    const isFormValid = useMemo(() => {
        const { manager } = formData;
        if (!validateRequired(manager.name)) return false;
        if (!validateRequired(manager.idNumber)) return false;
        if (!validateCedula(manager.idNumber)) return false;
        
        return true;
    }, [formData.manager]);

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-sbs-blue mb-6">Paso 3: Administración</h2>
            
            <div className="bg-white shadow-premium border border-premium-border p-8 sm:p-10 rounded-[2rem] mb-8">
                <div className="space-y-8">
                    
                    {/* Card Selection for Manager Type */}
                    <div>
                        <label className={labelClass}>¿Quién administrará la empresa?</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div 
                                onClick={() => handleManagerTypeChange('Socio')}
                                className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex items-center ${formData.manager.type === 'Socio' ? 'border-sbs-blue bg-blue-50/50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${formData.manager.type === 'Socio' ? 'bg-sbs-blue text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`font-bold ${formData.manager.type === 'Socio' ? 'text-sbs-blue' : 'text-gray-600'}`}>Uno de los Socios</h4>
                                    <p className="text-xs text-gray-400 mt-1">El Gerente es accionista</p>
                                </div>
                                {formData.manager.type === 'Socio' && <div className="absolute top-4 right-4 w-3 h-3 bg-sbs-blue rounded-full"></div>}
                            </div>

                            <div 
                                onClick={() => handleManagerTypeChange('Tercero')}
                                className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 flex items-center ${formData.manager.type === 'Tercero' ? 'border-sbs-blue bg-blue-50/50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${formData.manager.type === 'Tercero' ? 'bg-sbs-blue text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`font-bold ${formData.manager.type === 'Tercero' ? 'text-sbs-blue' : 'text-gray-600'}`}>Un Tercero</h4>
                                    <p className="text-xs text-gray-400 mt-1">Gerente externo contratado</p>
                                </div>
                                {formData.manager.type === 'Tercero' && <div className="absolute top-4 right-4 w-3 h-3 bg-sbs-blue rounded-full"></div>}
                            </div>
                        </div>
                    </div>

                    {/* Inputs Section */}
                    <div className="animate-fade-in-up">
                        {formData.manager.type === 'Socio' && (
                            <div>
                                <label className={labelClass}>Seleccionar Socio Gerente</label>
                                <div className="relative">
                                    <select value={formData.manager.name} onChange={handleSocioManagerChange} className={`${inputClass} appearance-none cursor-pointer`}>
                                        <option value="" disabled>Seleccione un socio de la lista...</option>
                                        {formData.partners.map(p => (
                                            <option key={p.id} value={`${p.names} ${p.surnames}`}>{p.names} {p.surnames}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {formData.manager.type === 'Tercero' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Nombre Completo del Gerente</label>
                                    <input type="text" name="name" value={formData.manager.name} onChange={handleThirdPartyManagerChange} onBlur={handleThirdPartyBlur} className={`${inputClass} ${errors.name ? 'border-red-300 bg-red-50' : ''}`} placeholder="Ej: Juan Pérez" />
                                    {errors.name && <p className="text-red-500 text-xs mt-2 font-bold ml-1">{errors.name}</p>}
                                </div>
                                <div>
                                <label className={labelClass}>Cédula de Identidad</label>
                                    <input type="text" name="idNumber" value={formData.manager.idNumber} onChange={handleThirdPartyManagerChange} onBlur={handleThirdPartyBlur} className={`${inputClass} font-mono ${errors.idNumber ? 'border-red-300 bg-red-50' : ''}`} maxLength={13} placeholder="XXX-XXXXXXX-X" />
                                    {errors.idNumber && <p className="text-red-500 text-xs mt-2 font-bold ml-1">{errors.idNumber}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Read-Only Duration Display */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-400 mr-4">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duración de la Gerencia</span>
                                <span className="text-sm text-gray-600">Seleccionada en el paso anterior</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-sbs-blue">{formData.managementDuration}</span>
                            <span className="text-xs font-bold text-sbs-blue ml-1">{formData.managementDuration === 1 ? 'Año' : 'Años'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4">
                <button onClick={prevStep} className="px-8 py-4 rounded-full font-bold text-text-tertiary hover:text-sbs-blue transition-colors hover:bg-gray-50">Atrás</button>
                <button 
                    onClick={nextStep} 
                    disabled={!isFormValid} 
                    className="px-12 py-5 bg-sbs-blue hover:-translate-y-0.5 hover:shadow-glow-blue text-white rounded-full font-bold shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    Revisar Datos &rarr;
                </button>
            </div>
        </div>
    );
};

export default StepC;