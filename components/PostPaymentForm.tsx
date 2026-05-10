import React, { useState, useEffect } from 'react';
import { FormData } from '../types';
import { NCF_OPTIONS, FISCAL_CLOSING_DATE, ALLOWED_FILE_TYPES } from '../constants';
import { validateRequired, formatPhoneNumber, validateEmail, formatDateMask, validateDate, validatePhoneNumber, sanitizeInput } from '../utils/validation';
import { saveFullApplication } from '../services/documentService';
import {
    AlertCircle,
    AlertTriangle,
    Check,
    ChevronDown,
    Info,
    Loader2,
    ShieldAlert,
    Trash2,
    UploadCloud
} from 'lucide-react';

interface PostPaymentFormProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onComplete: () => void;
    onSubmittingChange?: (submitting: boolean) => void;
}

type Section = 'details' | 'location' | 'powers' | 'fiscal' | 'references';

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2 align-middle">
        <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-sbs-blue transition-colors" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-sbs-blue text-white text-xs rounded-lg p-3 shadow-xl z-20 text-center leading-relaxed">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-sbs-blue rotate-45"></div>
        </div>
    </div>
);

interface AccordionItemProps {
    section: Section;
    title: string;
    number: string;
    children: React.ReactNode;
    isActive: boolean;
    onToggle: (section: Section) => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ section, title, number, children, isActive, onToggle }) => (
    <div className={`border rounded-[2rem] mb-8 overflow-hidden transition-all duration-500 ${isActive ? 'bg-white shadow-premium border-premium-border' : 'bg-white border-transparent opacity-60 hover:opacity-80'}`}>
        <button onClick={() => onToggle(section)} className="w-full flex justify-between items-center p-8 text-left">
            <div className="flex items-center">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mr-6 transition-colors ${isActive ? 'bg-sbs-blue text-white' : 'bg-gray-100 text-gray-400'}`}>{number}</span>
                <span className={`font-bold text-xl ${isActive ? 'text-sbs-blue' : 'text-gray-500'}`}>{title}</span>
            </div>
            <span className={`transform transition-transform duration-300 text-gray-400 ${isActive ? 'rotate-180 text-sbs-blue' : ''}`}>
                <ChevronDown className="w-6 h-6" />
            </span>
        </button>
        <div className={`transition-all duration-500 ease-in-out ${isActive ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-8 pt-0 border-t border-gray-50 mt-2">
                {children}
            </div>
        </div>
    </div>
);

const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl w-full animate-fade-in-up shadow-sm group hover:shadow-md transition-all">
        <div className="flex items-center overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mr-4">
                <Check className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] text-green-700 font-bold uppercase mb-0.5 tracking-wider">Archivo Listo</p>
                <p className="text-sm text-text-primary font-bold truncate mr-2 max-w-[200px]">{file.name}</p>
            </div>
        </div>
        <button onClick={(e) => { e.preventDefault(); onRemove(); }} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Eliminar archivo">
            <Trash2 className="w-5 h-5" />
        </button>
    </div>
);



const PostPaymentForm: React.FC<PostPaymentFormProps> = ({ formData, updateFormData, onComplete, onSubmittingChange }) => {
    const [activeSection, setActiveSection] = useState<Section>('details');
    const [errors, setErrors] = useState<Record<string, string | Record<string,string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    // Propaga el estado de envío al padre (App.tsx) para que pueda activar
    // protecciones contra navegación accidental durante el await del fetch.
    useEffect(() => {
        onSubmittingChange?.(isSubmitting);
        return () => {
            // Si el componente desmonta mid-submit (e.g. transición a Success),
            // garantiza que el flag del padre quede limpio.
            onSubmittingChange?.(false);
        };
    }, [isSubmitting, onSubmittingChange]);

    const hasLogo = formData.hasLogo || 'No';

    // EIRL: Auto-set powers to single-person defaults
    useEffect(() => {
        if (formData.companyType === 'EIRL') {
            const titular = formData.partners[0];
            const titularName = titular ? `${titular.names} ${titular.surnames}`.trim() : '';
            const updates: Partial<FormData> = {};
            if (formData.legalSignaturePowers !== 'Solo el Gerente') updates.legalSignaturePowers = 'Solo el Gerente';
            if (formData.bankPowers !== 'Solo el Gerente') updates.bankPowers = 'Solo el Gerente';
            if (titularName && formData.bankAuthorizedPerson1 !== titularName) updates.bankAuthorizedPerson1 = titularName;
            if (Object.keys(updates).length > 0) updateFormData(updates);
        }
    }, [formData.companyType]);

    const inputClass = "w-full px-5 py-4 rounded-xl bg-white border border-gray-200 text-text-primary placeholder-gray-400 focus:outline-none focus:border-sbs-blue focus:ring-4 focus:ring-sbs-blue/10 transition-all duration-300 shadow-sm text-sm font-medium";
    const labelClass = "block text-xs font-bold text-text-tertiary mb-2 uppercase tracking-widest";
    const btnNextClass = "px-10 py-4 bg-sbs-blue text-white rounded-full font-bold shadow-xl hover:shadow-glow-blue hover:-translate-y-0.5 transition-all duration-300 active:scale-95";



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let finalValue = value;

        if (name === 'contactPhone') {
            finalValue = formatPhoneNumber(value);
        }

        if (name === 'operationsStartDate') {
            finalValue = formatDateMask(value);
        }

        updateFormData({ [name]: finalValue });

        if (errors[name]) {
            setErrors(prev => {
                const newState = {...prev};
                delete newState[name];
                return newState;
            });
        }
    };



    const handleCopyApplicant = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            updateFormData({
                contactPerson: `${formData.applicant.names} ${formData.applicant.surnames}`,
                contactEmail: formData.applicant.email,
                contactPhone: formData.applicant.phone
            });

            setErrors(prev => {
                const next = {...prev};
                delete next.contactPerson;
                delete next.contactEmail;
                delete next.contactPhone;
                return next;
            });
        }
    };



    const handleNcfToggle = (value: string) => {
        const current = formData.ncfTypes || [];

        if (current.includes(value)) {
            updateFormData({ ncfTypes: current.filter(t => t !== value) });
        } else {
            updateFormData({ ncfTypes: [...current, value] });
        }
    };



    const scrollToError = (firstErrorField: string) => {
        setTimeout(() => {
            const element = document.querySelector(`[name="${firstErrorField}"]`);

            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (element as HTMLElement).focus();
            } else {
                const logoEl = document.getElementById('logo-upload-section');
                if (firstErrorField === 'logo' && logoEl) {
                    logoEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 150);
    };



    const validateSection = (section: Section): boolean => {
        const newErrors: Record<string, string | Record<string,string>> = {};
        let isValid = true;
        let firstErrorField = '';

        const setError = (field: string, message: string) => {
            newErrors[field] = message;
            isValid = false;
            if (!firstErrorField) firstErrorField = field;
        };

        if (section === 'details') {
            if (formData.hasLogo === 'Sí' && !formData.logoFile) {
                setError('logo', 'Es obligatorio cargar el archivo de tu logo para continuar.');
            }

            if (!validateRequired(formData.productsAndServices || '')) setError('productsAndServices', 'Requerido');
            if (!validateRequired(formData.activityMainDGII || '')) setError('activityMainDGII', 'Requerido');
            if (!validateRequired(formData.fiscalClosing || '')) setError('fiscalClosing', 'Requerido');

            if (formData.operationsStartDate && !validateDate(formData.operationsStartDate)) {
                setError('operationsStartDate', 'Formato inválido (DD/MM/AAAA) o fecha irreal.');
            }
        }

        if (section === 'location') {
            if (!validateRequired(formData.contactPerson || '')) setError('contactPerson', 'Requerido');

            if (!validateRequired(formData.contactPhone || '')) setError('contactPhone', 'Requerido');
            else if (!validatePhoneNumber(formData.contactPhone || '')) setError('contactPhone', 'Número inválido');

            if (!validateRequired(formData.contactEmail || '')) setError('contactEmail', 'Requerido');
            else if (!validateEmail(formData.contactEmail || '')) setError('contactEmail', 'Email inválido');

            if (!validateRequired(formData.referencePoint || '')) setError('referencePoint', 'Requerido');
            if (!validateRequired(formData.localType || '')) setError('localType', 'Requerido');
        }

        if (section === 'powers') {
            if (!formData.legalSignaturePowers) setError('legalSignaturePowers', 'Requerido');
            if (!formData.bankPowers) setError('bankPowers', 'Requerido');
            if (!formData.bankAuthorizedPerson1) setError('bankAuthorizedPerson1', 'Requerido');
        }

        if (section === 'fiscal') {
            if (!formData.ncfTypes || formData.ncfTypes.length === 0) setError('ncf', 'Selecciona al menos uno');
            if (!validateRequired(formData.monthlyNcfVolume || '')) setError('monthlyNcfVolume', 'Requerido');
            if (!validateRequired(formData.hasEmployees || '')) setError('hasEmployees', 'Requerido');
        }

        if (section === 'references') {
            if (!validateRequired(formData.commercialRef1 || '')) setError('commercialRef1', 'Requerido');
            if (!validateRequired(formData.bankRef1 || '')) setError('bankRef1', 'Requerido');
        }

        if (!isValid) {
            setErrors(newErrors);
            scrollToError(firstErrorField);
            return false;
        }

        setErrors({});
        return isValid;
    };



    const toggleSection = (section: Section) => {
        setActiveSection(section);
    };

    const nextSection = (current: Section, next: Section) => {
        if (validateSection(current)) {
            setActiveSection(next);
        }
    };



    const handleFinalSubmit = async () => {
        if (isSubmitting) return;

        const sections: Section[] = ['details', 'location', 'powers', 'fiscal', 'references'];

        for (const sec of sections) {
            if (!validateSection(sec)) {
                setActiveSection(sec);
                return;
            }
        }

        setIsSubmitting(true);
        setSubmissionError(null);

        try {
            const sanitizedFormData = {
                ...formData,
                companyName: formData.companyName ? sanitizeInput(formData.companyName) : formData.companyName,
                socialObject: formData.socialObject ? sanitizeInput(formData.socialObject) : formData.socialObject
            };

            await saveFullApplication(sanitizedFormData);

            // Google Ads conversion tracking (post-pago completado)
            const conversionValueByPackage: Record<string, number> = {
                'Starter Pro': 444,
                'Essential 360': 667,
                'Unlimitech': 1033
            };
            const valueUsd = conversionValueByPackage[formData.packageName || 'Essential 360'] ?? 667;
            const transactionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
            if (typeof window !== 'undefined' && typeof (window as Window & { gtag?: (...args: unknown[]) => void }).gtag === 'function') {
                (window as Window & { gtag: (...args: unknown[]) => void }).gtag('event', 'conversion', {
                    send_to: 'AW-17948166548/PrakCPafovgbEJSTre5C',
                    value: valueUsd,
                    currency: 'USD',
                    transaction_id: transactionId
                });
            }

            onComplete();
            return;
        } catch (error) {
            console.error('Error finalizando expediente', error);
            const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
            setSubmissionError(message);
            window.alert(`No pudimos finalizar tu expediente. Detalle: ${message}`);
            setIsSubmitting(false);
        }
    };



    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold text-sbs-blue mb-2">Formulario Maestro</h2>
                <p className="text-text-secondary text-sm font-light">Completa los detalles finales para la redacción de estatutos y alta en DGII.</p>
            </div>

            <div id="section-details">
                <AccordionItem
                    section="details"
                    title="Datos del Servicio y Actividad"
                    number="1"
                    isActive={activeSection === 'details'}
                    onToggle={toggleSection}
                >
                    <div className="space-y-8 pt-8">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Identidad Visual (Logo)</label>
                                <select
                                    value={hasLogo}
                                    onChange={(e) => updateFormData({hasLogo: e.target.value as 'Sí'|'No'})}
                                    className={inputClass}
                                >
                                    <option value="No">No tengo logo.</option>
                                    <option value="Sí">Ya tengo logo.</option>
                                </select>
                            </div>

                            {hasLogo === 'Sí' && (
                                <div className="animate-fade-in-up" id="logo-upload-section">
                                    <label className={labelClass}>Subir Logo (Obligatorio)</label>

                                    {!formData.logoFile ? (

                                        <label 
                                            className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-white group hover:shadow-lg ${errors.logo ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-sbs-blue hover:bg-blue-50/50'}`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.currentTarget.classList.add('border-sbs-blue', 'bg-blue-50');
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.currentTarget.classList.remove('border-sbs-blue', 'bg-blue-50');
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.currentTarget.classList.remove('border-sbs-blue', 'bg-blue-50');
                                                const file = e.dataTransfer.files?.[0] || null;
                                                if (file) {
                                                    updateFormData({ logoFile: file });
                                                    setErrors(prev => {
                                                        const next = { ...prev };
                                                        delete next.logo;
                                                        return next;
                                                    });
                                                }
                                            }}
                                        >

                                            <input 

                                                type="file" 

                                                className="hidden" 

                                                accept={ALLOWED_FILE_TYPES}

                                                onChange={(e) => {

                                                    const file = e.target.files ? e.target.files[0] : null;

                                                    updateFormData({ logoFile: file });

                                                    if (file) {
                                                        setErrors(prev => {
                                                            const next = { ...prev };
                                                            delete next.logo;
                                                            return next;
                                                        });
                                                    }
                                                }}
                                            />
                                            <div className="text-center text-gray-400 group-hover:text-sbs-blue transition-colors pointer-events-none">
                                                <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                                                <span className="text-sm font-bold uppercase tracking-wide block">Subir Logo / Arte</span>
                                                <span className="text-[10px] opacity-70">Haz click o arrastra aquí</span>
                                            </div>
                                        </label>
                                    ) : (
                                        <FilePreview file={formData.logoFile} onRemove={() => updateFormData({ logoFile: null })} />
                                    )}

                                    {errors.logo && <p className="text-red-500 text-sm mt-2 font-bold ml-1 animate-pulse flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> {errors.logo as string}</p>}

                                </div>

                            )}

                        </div>

                        

                        <div>

                            <label className={labelClass}>Objeto Social (Ya definido)</label>

                            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 border border-gray-100">

                                {formData.socialObject}

                            </div>

                        </div>



                        <div>

                            <label className={labelClass}>Productos y Servicios (Listado específico)</label>

                            <textarea name="productsAndServices" value={formData.productsAndServices} onChange={handleChange} rows={3} className={inputClass} placeholder="Ej: Venta de ropa al detalle, consultoría financiera..." />

                            {errors.productsAndServices && <p className="text-red-500 text-xs mt-1 font-bold">{errors.productsAndServices as string}</p>}

                        </div>



                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>

                                <label className={labelClass}>Actividad Económica Principal (DGII)</label>

                                <input name="activityMainDGII" value={formData.activityMainDGII} onChange={handleChange} className={inputClass} placeholder="Ej: Venta al por menor" />

                                {errors.activityMainDGII && <p className="text-red-500 text-xs mt-1 font-bold">{errors.activityMainDGII as string}</p>}

                            </div>

                            <div>

                                <label className={labelClass}>Actividad Económica Secundaria</label>

                                <input name="activitySecondaryDGII" value={formData.activitySecondaryDGII} onChange={handleChange} className={inputClass} placeholder="Opcional" />

                            </div>

                        </div>



                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>

                                <label className={labelClass}>Fecha Cierre Fiscal</label>

                                <select name="fiscalClosing" value={formData.fiscalClosing || FISCAL_CLOSING_DATE} onChange={handleChange} className={inputClass}>

                                    <option value="31 de Diciembre">31 Dic (Estándar)</option>

                                    <option value="31 de Marzo">31 Mar</option>

                                    <option value="30 de Junio">30 Jun</option>

                                    <option value="30 de Septiembre">30 Sep</option>

                                </select>

                            </div>

                            <div>

                                <label className={labelClass}>Fecha Inicio Operaciones (Proyectada)</label>

                                <input 

                                    type="text" 

                                    name="operationsStartDate" 

                                    value={formData.operationsStartDate || ''} 

                                    onChange={handleChange} 

                                    className={`${inputClass} ${errors.operationsStartDate ? 'border-red-300 bg-red-50' : ''}`}

                                    placeholder="DD/MM/AAAA"

                                    maxLength={10}

                                />

                                {errors.operationsStartDate && <p className="text-red-500 text-xs mt-1 font-bold">{errors.operationsStartDate as string}</p>}

                            </div>

                        </div>



                        <div className="flex justify-end">

                            <button onClick={() => nextSection('details', 'location')} className={btnNextClass}>Continuar</button>

                        </div>

                    </div>

                </AccordionItem>

            </div>



            {/* SECCIÓN 2: UBICACIÓN Y CONTACTO */}

            <AccordionItem 

                section="location" 

                title="Ubicación y Contacto" 

                number="2"

                isActive={activeSection === 'location'}

                onToggle={toggleSection}

            >

                 <div className="space-y-8 pt-8">

                     

                     {/* COPY DATA BUTTON */}

                     <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">

                         <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">¿Eres la persona de contacto?</span>

                         <label className="flex items-center space-x-2 cursor-pointer">

                             <input type="checkbox" onChange={handleCopyApplicant} className="rounded text-sbs-blue focus:ring-sbs-blue border-gray-300" />

                             <span className="text-sm text-gray-600 font-medium">Utilizar datos del Solicitante</span>

                         </label>

                     </div>



                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                         <div>

                             <label className={labelClass}>Persona de Contacto</label>

                             <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} className={`${inputClass} ${errors.contactPerson ? 'border-red-300' : ''}`} placeholder="Quien manejará el proceso" />

                             {errors.contactPerson && <p className="text-red-500 text-xs mt-1 font-bold">{errors.contactPerson as string}</p>}

                         </div>

                         <div>

                             <label className={labelClass}>Teléfono Contacto</label>

                             <input 

                                name="contactPhone" 

                                value={formData.contactPhone} 

                                onChange={handleChange} 

                                className={`${inputClass} ${errors.contactPhone ? 'border-red-300' : ''}`}

                                placeholder="+1 (809) 000-0000" 

                                maxLength={20} 

                            />

                              {errors.contactPhone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.contactPhone as string}</p>}

                         </div>

                         <div>

                             <label className={labelClass}>Email Contacto</label>

                             <input name="contactEmail" value={formData.contactEmail} onChange={handleChange} className={`${inputClass} ${errors.contactEmail ? 'border-red-300' : ''}`} type="email" />

                              {errors.contactEmail && <p className="text-red-500 text-xs mt-1 font-bold">{errors.contactEmail as string}</p>}

                         </div>

                     </div>



                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                         <div>

                             <label className={labelClass}>Página Web</label>

                             <input name="website" value={formData.website} onChange={handleChange} className={inputClass} placeholder="Existente o a registrar" />

                         </div>

                         <div>

                             <label className={labelClass}>
                                 Tipo de Local
                                 <Tooltip text="No importa si es una casa o una oficina virtual, esto no limita tu formalización." />
                             </label>

                             <select name="localType" value={formData.localType} onChange={handleChange} className={`${inputClass} ${errors.localType ? 'border-red-300' : ''}`}>

                                 <option value="">Seleccionar...</option>

                                 <option value="Propio">Propio</option>

                                 <option value="Alquilado">Alquilado</option>

                             </select>

                             {errors.localType && <p className="text-red-500 text-xs mt-1 font-bold">{errors.localType as string}</p>}

                         </div>

                     </div>

                     

                     <div>

                         <label className={labelClass}>Punto de Referencia (Obligatorio para mensajería)</label>

                         <input name="referencePoint" value={formData.referencePoint} onChange={handleChange} className={`${inputClass} ${errors.referencePoint ? 'border-red-300' : ''}`} placeholder="Ej: Detrás de la bomba Texaco..." />

                         {errors.referencePoint && <p className="text-red-500 text-xs mt-1 font-bold">{errors.referencePoint as string}</p>}

                     </div>



                     {/* Recap of Address - Read Only or Edit link */}

                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">

                         <h4 className="text-xs font-bold text-gray-500 mb-2">Dirección Registrada (Confirmar):</h4>

                         <p className="text-sm text-gray-700">{formData.companyStreet} #{formData.companyStreetNumber}, {formData.companySector}, {formData.companyCity}.</p>

                         {formData.companyBuilding && <p className="text-sm text-gray-700">Edificio: {formData.companyBuilding}</p>}

                     </div>



                     <div className="flex justify-end">

                        <button onClick={() => nextSection('location', 'powers')} className={btnNextClass}>Continuar</button>

                    </div>

                 </div>

            </AccordionItem>



            {/* SECCIÓN 3: PODERES */}

            <AccordionItem 

                section="powers" 

                title="Régimen de Poderes y Firmas" 

                number="3"

                isActive={activeSection === 'powers'}

                onToggle={toggleSection}

            >

                <div className="space-y-8 pt-8">

                     <div className="bg-blue-50 p-4 rounded-xl text-sbs-blue text-sm mb-4">

                         <span className="font-bold">Gerente:</span> {formData.manager.name || '(Por Definir / Externo)'}

                     </div>

                     {formData.companyType === 'EIRL' ? (
                         <div className="space-y-6">
                             <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 leading-relaxed">
                                 Como <strong>E.I.R.L.</strong>, el titular ejerce todos los poderes de firma y representación legal de forma individual. No aplica firma conjunta ni indistinta, ya que la empresa tiene un único dueño.
                             </div>

                             <div>
                                 <label className={labelClass}>Persona Autorizada en el Banco</label>
                                 <input
                                     name="bankAuthorizedPerson1"
                                     value={formData.bankAuthorizedPerson1}
                                     onChange={handleChange}
                                     className={`${inputClass} ${errors.bankAuthorizedPerson1 ? 'border-red-300' : ''}`}
                                     placeholder="Nombre del titular autorizado"
                                 />
                                 {errors.bankAuthorizedPerson1 && <p className="text-red-500 text-xs mt-1 font-bold">{errors.bankAuthorizedPerson1 as string}</p>}
                             </div>
                         </div>
                     ) : (
                         <>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                 <div>

                                     <label className={labelClass}>Firma Legal/Contratos</label>

                                     <div className="space-y-2">

                                         {['Solo el Gerente', 'Firma Conjunta', 'Firma Indistinta'].map(opt => (

                                             <label key={opt} className="flex items-center space-x-2">

                                                 <input type="radio" name="legalSignaturePowers" value={opt} checked={formData.legalSignaturePowers === opt} onChange={handleChange} className="text-sbs-blue focus:ring-sbs-blue" />

                                                 <span className="text-sm">{opt}</span>

                                             </label>

                                         ))}

                                     </div>

                                     {errors.legalSignaturePowers && <p className="text-red-500 text-xs mt-1 font-bold">{errors.legalSignaturePowers as string}</p>}

                                 </div>

                                 <div>

                                     <label className={labelClass}>Poder Bancario (Cheques)</label>

                                     <div className="space-y-2">

                                         {['Solo el Gerente', 'Firma Conjunta', 'Firma Indistinta'].map(opt => (

                                             <label key={opt} className="flex items-center space-x-2">

                                                 <input type="radio" name="bankPowers" value={opt} checked={formData.bankPowers === opt} onChange={handleChange} className="text-sbs-blue focus:ring-sbs-blue" />

                                                 <span className="text-sm">{opt}</span>

                                             </label>

                                         ))}

                                     </div>

                                     {errors.bankPowers && <p className="text-red-500 text-xs mt-1 font-bold">{errors.bankPowers as string}</p>}

                                 </div>

                             </div>



                             <div>

                                 <label className={labelClass}>Personas Autorizadas Banco</label>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    <input name="bankAuthorizedPerson1" value={formData.bankAuthorizedPerson1} onChange={handleChange} className={`${inputClass} ${errors.bankAuthorizedPerson1 ? 'border-red-300' : ''}`} placeholder="Persona 1 (Obligatorio)" />

                                    <input name="bankAuthorizedPerson2" value={formData.bankAuthorizedPerson2} onChange={handleChange} className={inputClass} placeholder="Persona 2 (Opcional)" />

                                 </div>

                                 {errors.bankAuthorizedPerson1 && <p className="text-red-500 text-xs mt-1 font-bold">{errors.bankAuthorizedPerson1 as string}</p>}

                             </div>
                         </>
                     )}



                     <div className="flex justify-end">

                        <button onClick={() => nextSection('powers', 'fiscal')} className={btnNextClass}>Continuar</button>

                    </div>

                </div>

            </AccordionItem>



             {/* SECCIÓN 4: FISCAL */}

             <AccordionItem 

                section="fiscal" 

                title="Perfil Fiscal (DGII)" 

                number="4"

                isActive={activeSection === 'fiscal'}

                onToggle={toggleSection}

            >

                 <div className="space-y-8 pt-8">

                    <div>

                        <label className={labelClass}>Tipos NCF a solicitar <span className="text-sbs-red">*</span></label>

                        <div className="space-y-3">

                            {NCF_OPTIONS.map(opt => (

                                <label key={opt.value} className={`flex items-center space-x-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.ncfTypes?.includes(opt.value) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-premium-border hover:border-gray-300'}`}>

                                    <input 

                                        type="checkbox" 

                                        checked={formData.ncfTypes?.includes(opt.value)} 

                                        onChange={() => handleNcfToggle(opt.value)} 

                                        className="h-5 w-5 text-sbs-blue rounded focus:ring-0" 

                                    />

                                    <span className="text-text-primary text-sm font-medium">{opt.label}</span>

                                </label>

                            ))}

                        </div>

                        {errors.ncf && <p className="text-red-500 text-xs mt-2 font-bold">{errors.ncf as string}</p>}

                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>

                             <label className={labelClass}>Volumen Mensual NCF (Estimado)</label>

                             <input name="monthlyNcfVolume" value={formData.monthlyNcfVolume} onChange={handleChange} className={`${inputClass} ${errors.monthlyNcfVolume ? 'border-red-300' : ''}`} placeholder="Ej: 100 facturas" />

                             {errors.monthlyNcfVolume && <p className="text-red-500 text-xs mt-1 font-bold">{errors.monthlyNcfVolume as string}</p>}

                        </div>

                        <div>

                            <label className={labelClass}>¿Tendrá empleados fijos?</label>

                             <div className="flex space-x-6 mt-3">

                                 <label className="flex items-center space-x-2">

                                     <input type="radio" name="hasEmployees" value="Sí" checked={formData.hasEmployees === 'Sí'} onChange={handleChange} />

                                     <span className="text-sm">Sí</span>

                                 </label>

                                 <label className="flex items-center space-x-2">

                                     <input type="radio" name="hasEmployees" value="No" checked={formData.hasEmployees === 'No'} onChange={handleChange} />

                                     <span className="text-sm">No</span>

                                 </label>

                             </div>

                             {errors.hasEmployees && <p className="text-red-500 text-xs mt-1 font-bold">{errors.hasEmployees as string}</p>}

                        </div>

                    </div>



                    <div className="flex justify-end pt-4">

                        <button onClick={() => nextSection('fiscal', 'references')} className={btnNextClass}>Continuar</button>

                    </div>

                </div>

             </AccordionItem>



             {/* SECCIÓN 5: REFERENCIAS */}

             <AccordionItem 

                section="references" 

                title="Referencias (Compliance)" 

                number="5"

                isActive={activeSection === 'references'}

                onToggle={toggleSection}

            >

                <div className="space-y-6 pt-8">

                     <div className="bg-yellow-50 p-4 rounded-xl text-yellow-800 text-sm mb-4 border border-yellow-100 flex items-start">

                         <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />

                         <p>La Ley de Lavado de Activos exige debida diligencia. Requerimos referencias verificables para validar la identidad comercial.</p>

                     </div>

                     

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>

                            <label className={labelClass}>

                                Referencia Comercial 1

                                <Tooltip text="Empresa o proveedor que pueda dar fe de su actividad comercial previa o reputación." />

                            </label>

                            <input name="commercialRef1" value={formData.commercialRef1} onChange={handleChange} className={`${inputClass} ${errors.commercialRef1 ? 'border-red-300 bg-red-50' : ''}`} placeholder="Nombre del Comercio" />

                            {errors.commercialRef1 && <p className="text-red-500 text-xs mt-1 font-bold">{errors.commercialRef1 as string}</p>}

                        </div>

                        <div>

                            <label className={labelClass}>Referencia Comercial 2</label>

                            <input name="commercialRef2" value={formData.commercialRef2} onChange={handleChange} className={inputClass} placeholder="Nombre del Comercio" />

                        </div>

                        <div>

                            <label className={labelClass}>

                                Referencia Bancaria 1

                                <Tooltip text="Banco donde posee cuentas activas." />

                            </label>

                            <input name="bankRef1" value={formData.bankRef1} onChange={handleChange} className={`${inputClass} ${errors.bankRef1 ? 'border-red-300 bg-red-50' : ''}`} placeholder="Nombre del Banco" />

                            {errors.bankRef1 && <p className="text-red-500 text-xs mt-1 font-bold">{errors.bankRef1 as string}</p>}

                        </div>

                        <div>

                            <label className={labelClass}>Referencia Bancaria 2</label>

                            <input name="bankRef2" value={formData.bankRef2} onChange={handleChange} className={inputClass} placeholder="Nombre del Banco" />

                        </div>

                    </div>



                    <div className="flex flex-col items-end pt-8">


                        <button 

                            onClick={handleFinalSubmit} 

                            disabled={isSubmitting}

                            type="button"

                            className={`px-12 py-5 bg-sbs-red hover:bg-sbs-red-dark text-white rounded-full font-bold shadow-glow-red hover:shadow-lg transition-all duration-300 text-lg tracking-wide flex items-center justify-center transform hover:-translate-y-0.5

                                ${isSubmitting ? 'opacity-75 cursor-wait scale-100 shadow-none' : ''}`}

                        >

                            {isSubmitting ? (

                                <>

                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />

                                    Finalizando...

                                </>

                            ) : (

                                'Finalizar Expediente'

                            )}

                        </button>

                        {submissionError && (

                            <p className="text-red-600 text-sm mt-4 font-semibold text-right">

                                {submissionError}

                            </p>

                        )}

                    </div>

                </div>

            </AccordionItem>

        </div>

    );

};



export default PostPaymentForm;