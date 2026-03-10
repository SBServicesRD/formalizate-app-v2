
import React, { useMemo, useState, useEffect } from 'react';
import { FormData, Partner, MaritalStatus } from '../types';
import { SHARE_VALUE, PROVINCES, MUNICIPALITIES, COUNTRIES, INTERNATIONAL_REGIONS, ALLOWED_FILE_TYPES, PACKAGES, POSTAL_CODE_CONFIG } from '../constants';
import { distributeShares, calculateICCTax, formatCurrency } from '../utils/calculations';
import { validateCedula, validateRequired, formatCedula, formatPhoneNumber, validateEmail, sanitizeInput, validatePhoneNumber, formatDateMask, validateDate, validateBirthDate } from '../utils/validation';
import { HelpCircle, Check, Trash2, ChevronDown, Image, IdCard, FileSignature } from 'lucide-react';

interface StepBProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    nextStep: () => void;
    prevStep: () => void;
}

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2 align-middle">
        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help hover:text-sbs-blue transition-colors" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-sbs-blue text-white text-xs rounded-lg p-3 shadow-xl z-20 text-center leading-relaxed">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-sbs-blue rotate-45"></div>
        </div>
    </div>
);

// Reuse FilePreview component for consistency
const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl w-full animate-fade-in-up shadow-sm group hover:shadow-md transition-all">
        <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mr-3">
                <Check className="w-4 h-4" strokeWidth={3} />
            </div>
            <div>
                <p className="text-[9px] text-green-700 font-bold uppercase mb-0.5 tracking-wider">Cargado</p>
                <p className="text-xs text-text-primary font-bold truncate mr-2 max-w-[100px]">{file.name}</p>
            </div>
        </div>
        <button onClick={(e) => { e.preventDefault(); onRemove(); }} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Eliminar archivo">
            <Trash2 className="w-4 h-4" />
        </button>
    </div>
);

const UploadProgress = ({ progress }: { progress: number }) => (
    <div className="h-32 w-full border-2 border-solid border-sbs-blue bg-blue-50 rounded-xl flex flex-col items-center justify-center px-6">
        <div className="w-full bg-blue-200 rounded-full h-1.5 mb-2">
            <div className="bg-sbs-blue h-1.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-[10px] font-bold text-sbs-blue uppercase">Subiendo... {Math.round(progress)}%</span>
    </div>
);

const StepB: React.FC<StepBProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    // Determine Administration Mode based on formData (Default to 'Socio' if unset)
    const isExternalManager = formData.manager.type === 'Tercero';

    // EIRL: Forzar porcentaje 100% en el único socio
    useEffect(() => {
        if (formData.companyType === 'EIRL' && formData.partners.length > 0) {
            const updatedPartners = formData.partners.map((p, idx) => 
                idx === 0 ? { ...p, percentage: 100, shares: Math.floor(formData.socialCapital / SHARE_VALUE) } : p
            );
            if (JSON.stringify(updatedPartners) !== JSON.stringify(formData.partners)) {
                updateFormData({ partners: updatedPartners });
            }
        }
    }, [formData.companyType, formData.socialCapital]);

    // --- STYLES PREMIUM REFINED ---
    const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-text-primary placeholder-gray-400 focus:outline-none focus:border-sbs-blue focus:ring-4 focus:ring-sbs-blue/10 transition-all duration-300 shadow-sm text-base font-medium";
    // --- END STYLES ---

    // Tax Calculation Logic for "The Investor" Scenario
    const currentPackage = formData.packageName ? PACKAGES[formData.packageName] : PACKAGES['Essential 360'];
    const estimatedTax = calculateICCTax(formData.socialCapital);
    const estimatedTotal = currentPackage.price + estimatedTax;

    // --- QA: FILE UPLOAD SIMULATION ---
    const handleFileUpload = (key: string, file: File, callback: (f: File) => void) => {
        // 🔥 FIX CRÍTICO: Guardar archivo INMEDIATAMENTE (antes de la animación)
        callback(file);
        
        let progress = 0;
        setUploadProgress(prev => ({ ...prev, [key]: 0 }));
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setUploadProgress(prev => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
            } else {
                setUploadProgress(prev => ({ ...prev, [key]: progress }));
            }
        }, 200);
    };

    const toggleManagerMode = (mode: 'Socio' | 'Tercero') => {
        updateFormData({ 
            manager: { 
                ...formData.manager, 
                type: mode 
            } 
        });
    };

    const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valStr = e.target.value.replace(/[^0-9]/g, ''); // Enforce numbers only
        
        // Prevent empty string breaking logic, default to 0 visual but keep clean
        if (valStr === '') {
            updateFormData({ socialCapital: 0 }); 
            return;
        }

        let value = parseInt(valStr, 10);
        if (isNaN(value)) value = 0;
        
        // FINANCIAL SAFETY: Strictly prevent negative numbers
        value = Math.max(0, value);
        
        updateFormData({ socialCapital: value });
        
        // Recalcular cuotas de todos los socios basado en %
        if (value > 0) {
            const updatedPartners = formData.partners.map(p => ({
                ...p,
                shares: distributeShares(value, p.percentage)
            }));
            updateFormData({ partners: updatedPartners });
        }
    };

    const handlePartnerChange = (id: number, field: keyof Partner, value: any) => {
        const updatedPartners = formData.partners.map(p => {
            if (p.id === id) {
                let finalValue = value;

                // Format Phone Number
                if (field === 'mobilePhone') {
                    finalValue = formatPhoneNumber(value);
                }

                const updatedPartner = { ...p, [field]: finalValue };

                // Lógica de Nacionalidad: Dominicano = Cédula, Extranjero = Pasaporte
                if (field === 'nationality') {
                     // Reset Province/City if nationality changes to ensure correct dropdowns
                     updatedPartner.addressProvince = '';
                     updatedPartner.addressCity = '';

                     if (value === 'República Dominicana') {
                         updatedPartner.documentType = 'Cédula';
                         updatedPartner.idNumber = ''; 
                     } else {
                         updatedPartner.documentType = 'Pasaporte';
                         updatedPartner.idNumber = '';
                     }
                }
                
                // Aplicar máscara SOLO si es Cédula
                if (field === 'idNumber' && updatedPartner.documentType === 'Cédula') {
                     finalValue = formatCedula(value);
                     updatedPartner.idNumber = finalValue;
                }

                if (field === 'maritalStatus' && value === 'Soltero(a)') {
                    delete updatedPartner.matrimonialRegime;
                }

                if (field === 'percentage') {
                    let pct = parseFloat(value);
                    if (isNaN(pct)) pct = 0;
                    if(pct < 0) pct = 0; // Prevent negative percentage
                    if(pct > 100) pct = 100;
                    updatedPartner.percentage = pct;
                    updatedPartner.shares = distributeShares(formData.socialCapital, pct);
                }
                return updatedPartner;
            }
            return p;
        });
        
        updateFormData({ partners: updatedPartners });

        // Clear error on change if it exists
        if (errors[id] && errors[id][field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                const partnerErrors = { ...newErrors[id] };
                delete partnerErrors[field];
                newErrors[id] = partnerErrors;
                return newErrors;
            });
        }
    };

    const toggleRole = (id: number, role: string) => {
        const partner = formData.partners.find(p => p.id === id);
        if (!partner) return;
        
        let newRoles = [...(partner.roles || [])];
        
        // Asegurar que 'Socio' siempre esté en la lista base si por alguna razón no está
        if (!newRoles.includes('Socio')) newRoles.push('Socio');

        if (newRoles.includes(role)) {
            // No permitir deseleccionar 'Socio' bajo ninguna circunstancia
            if (role === 'Socio') return;
            newRoles = newRoles.filter(r => r !== role);
        } else {
            newRoles.push(role);
        }
        
        handlePartnerChange(id, 'roles', newRoles);
    };

    const handleBlur = (partnerId: number, field: string, value: string) => {
        // QA: Sanitize on Blur
        let cleanValue = value;
        if (field !== 'email') { 
             cleanValue = sanitizeInput(value);
             if (cleanValue !== value) {
                 handlePartnerChange(partnerId, field as keyof Partner, cleanValue);
             }
        }

        setTouched(prev => ({ ...prev, [`${partnerId}_${field}`]: true }));
        validateSingleField(partnerId, field, cleanValue);
    };

    const validateSingleField = (partnerId: number, field: string, value: string) => {
        const partner = formData.partners.find(p => p.id === partnerId);
        if (!partner) return;

        const newErrors = { ...errors };
        const partnerErrors = newErrors[partnerId] || {};
        let error = '';

        if (field === 'names' && !validateRequired(value)) error = "Requerido";
        if (field === 'surnames' && !validateRequired(value)) error = "Requerido";
        if (field === 'nationality' && !validateRequired(value)) error = "Requerido";
        if (field === 'birthDate') {
            if (!validateRequired(value)) error = "Fecha requerida";
            else if (!validateBirthDate(value)) error = "Fecha inválida o menor de 18 años";
        }
        if (field === 'profession' && !validateRequired(value)) error = "Requerido";
        
        if (field === 'idNumber') {
            if (!validateRequired(value)) error = "Requerido";
            else if (partner.documentType === 'Cédula' && !validateCedula(value)) error = "Formato inválido";
            // Para Pasaporte solo validamos que no esté vacío
        }

        if (field === 'addressStreet' && !validateRequired(value)) error = "Calle requerida";
        if (field === 'addressProvince' && !validateRequired(value)) error = "Provincia/Estado requerido";
        
        // Only require city if we are in DR (where we have dropdowns) or if it's a free text input that is empty
        if (field === 'addressCity' && !validateRequired(value)) error = "Ciudad requerida";
        
        if (field === 'mobilePhone') {
            if (!validateRequired(value)) error = "Requerido";
            else if (!validatePhoneNumber(value)) error = "Número inválido";
        }

        if (field === 'email') {
            if (!validateRequired(value)) error = "Email requerido";
            else if (!validateEmail(value)) error = "Email inválido";
        }

        if (error) {
            partnerErrors[field] = error;
        } else {
            delete partnerErrors[field];
        }
        
        newErrors[partnerId] = partnerErrors;
        setErrors(newErrors);
    };

    const addPartner = () => {
        // DATA INTEGRITY: Use random + timestamp to absolutely prevent ID collision on fast double-clicks
        const newPartner: Partner = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            names: '', surnames: '', nationality: 'República Dominicana',
            birthDate: '', // Fecha de Nacimiento obligatoria
            maritalStatus: 'Soltero(a)', profession: '', documentType: 'Cédula', idNumber: '',
            // Initialize new partner with empty ID files
            idFront: null, idBack: null,
            residenceCountry: 'República Dominicana', // País de residencia (determina formato dirección)
            addressStreet: '', addressNumber: '', addressSuite: '', addressSector: '', addressCity: '', addressProvince: '',
            postalCode: '', // Código postal para direcciones internacionales
            email: '', mobilePhone: '', roles: ['Socio'], percentage: 0, shares: 0,
        };
        updateFormData({ partners: [...formData.partners, newPartner] });
    };

    const removePartner = (id: number) => {
        if (formData.partners.length > 1) {
            updateFormData({ partners: formData.partners.filter(p => p.id !== id) });
        }
    };
    
    const validateAllPartners = () => {
        const newErrors: Record<string, Record<string, string>> = {};
        let allValid = true;

        formData.partners.forEach(p => {
            const pErr: Record<string, string> = {};
            if (!validateRequired(p.names)) pErr.names = "Requerido";
            if (!validateRequired(p.surnames)) pErr.surnames = "Requerido";
            if (!validateRequired(p.nationality)) pErr.nationality = "Requerido";
            if (!validateRequired(p.profession)) pErr.profession = "Requerido";
            
            if (!validateRequired(p.mobilePhone)) pErr.mobilePhone = "Requerido";
            else if (!validatePhoneNumber(p.mobilePhone)) pErr.mobilePhone = "Inválido";
            
            if (!validateRequired(p.email)) pErr.email = "Requerido";
            else if (!validateEmail(p.email)) pErr.email = "Inválido";
            
            if (!validateRequired(p.idNumber)) pErr.idNumber = "Requerido";
            else if (p.documentType === 'Cédula' && !validateCedula(p.idNumber)) pErr.idNumber = "Inválido";
            
            if (!validateRequired(p.birthDate)) pErr.birthDate = "Fecha requerida";
            else if (!validateBirthDate(p.birthDate)) pErr.birthDate = "Fecha inválida o menor de 18 años";
            
            if (!validateRequired(p.addressStreet)) pErr.addressStreet = "Requerido";
            if (!validateRequired(p.addressProvince)) pErr.addressProvince = "Requerido";
            if (!validateRequired(p.addressCity)) pErr.addressCity = "Requerido";
            
            // Check for Files
            if (!p.idFront) pErr.idFront = "Foto Frontal Requerida";
            
            // BACK ID ONLY REQUIRED IF NOT PASSPORT
            if (p.documentType !== 'Pasaporte' && !p.idBack) {
                pErr.idBack = "Foto Dorsal Requerida";
            }

            if(Object.keys(pErr).length > 0) {
                newErrors[p.id] = pErr;
                allValid = false;
            }
        });

        setErrors(newErrors);
        
        const allTouched: Record<string, boolean> = {};
        formData.partners.forEach(p => {
             ['names', 'surnames', 'nationality', 'birthDate', 'profession', 'mobilePhone', 'email', 'idNumber', 'addressStreet', 'addressProvince', 'addressCity'].forEach(f => allTouched[`${p.id}_${f}`] = true);
        });
        setTouched(allTouched);

        return allValid;
    }

    const totalPercentage = useMemo(() => formData.partners.reduce((sum, p) => sum + (p.percentage || 0), 0), [formData.partners]);

    const scrollToError = () => {
        setTimeout(() => {
            const firstErrorElement = document.querySelector('.border-red-300');
            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                const fileError = document.querySelector('.text-red-500');
                if(fileError) fileError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleNext = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Validación Legal 1: Capital Mínimo
        if (formData.socialCapital < 1000) {
            alert("El capital social debe ser mayor a RD$ 1,000.");
            setIsSubmitting(false);
            return;
        }

        // Validación Legal 2: Socios según tipo de empresa
        if (formData.companyType === 'SRL' && formData.partners.length < 2) {
            alert("Una S.R.L. requiere un mínimo de 2 socios obligatorios. Por favor agrega un segundo socio.");
            setIsSubmitting(false);
            return;
        }
        if (formData.companyType === 'EIRL' && formData.partners.length !== 1) {
            alert("Una E.I.R.L. debe tener exactamente 1 titular. Por favor verifica que haya únicamente un socio.");
            setIsSubmitting(false);
            return;
        }

        // Validación Legal 3: Integridad de IDs
        const idNumbers = formData.partners.map(p => p.idNumber.trim());
        const uniqueIdNumbers = new Set(idNumbers);
        if (uniqueIdNumbers.size !== idNumbers.length) {
            alert("Existen socios con la misma cédula/pasaporte. Por favor verifica que no haya duplicados.");
            setIsSubmitting(false);
            return;
        }

        // Validación Legal 4: Integridad Porcentual
        if (Math.abs(totalPercentage - 100) > 0.1) {
             alert(`Los porcentajes deben sumar 100%. Actual: ${totalPercentage}%`);
             setIsSubmitting(false);
             return;
        }

        // Validación Legal 5: Gerente Designado (Solo si no es Gerente Externo)
        if (!isExternalManager) {
            const hasManager = formData.partners.some(p => p.roles.includes('Gerente'));
            if (!hasManager) {
                alert("Si la administración es por socios, debes seleccionar al menos uno como 'Gerente'.");
                setIsSubmitting(false);
                return;
            }
        }

        // Validación Legal 6: Datos del Gerente Externo (cuando aplique)
        if (isExternalManager) {
            if (!formData.manager.name || formData.manager.name.trim() === '') {
                alert("Debes completar el nombre del Gerente Externo.");
                setIsSubmitting(false);
                return;
            }
            if (!formData.manager.idNumber || formData.manager.idNumber.trim() === '') {
                alert("Debes completar el documento de identidad del Gerente Externo.");
                setIsSubmitting(false);
                return;
            }
        }

        // Validación Legal 7: Titular de Firma Digital
        if (!formData.digitalSignatureHolderId) {
            alert("Debes seleccionar un socio como Titular de la Firma Digital.");
            setIsSubmitting(false);
            return;
        }
        
        if (validateAllPartners()) {
            nextStep();
        } else {
            scrollToError();
        }
        
        setTimeout(() => setIsSubmitting(false), 500);
    }

    const isError = (id: number, field: string) => touched[`${id}_${field}`] && errors[id]?.[field];

    // --- DRAG AND DROP HANDLERS ---
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>, partnerId: number, field: 'idFront' | 'idBack', callback: (file: File) => void) => {
        e.preventDefault();
        e.stopPropagation();
        const uploadKey = `${partnerId}_${field}`;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(uploadKey, e.dataTransfer.files[0], callback);
        }
    };

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-sbs-blue mb-6">Paso 2: Socios y Capital</h2>
            
            {/* --- ALERTA DEPÓSITO BANCARIO PARA EIRL --- */}
            {formData.companyType === 'EIRL' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
                    <div className="text-amber-600 flex-shrink-0 mt-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900 mb-2">Depósito del Capital Social</p>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Para las E.I.R.L., el capital social debe depositarse en una cuenta bancaria a nombre de la empresa en formación. Una vez se emita el Registro Mercantil, el banco devolverá estos fondos. Este es un requisito legal para completar la constitución.
                        </p>
                    </div>
                </div>
            )}
            
            {/* --- ADMINISTRATION MODE TOGGLE --- */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">
                            Modalidad de Administración
                        </label>
                        <p className="text-sm text-gray-500">¿Quién gestionará el día a día de la empresa?</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button 
                            onClick={() => toggleManagerMode('Socio')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${!isExternalManager ? 'bg-white text-sbs-blue shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Socios
                        </button>
                        <button 
                            onClick={() => toggleManagerMode('Tercero')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${isExternalManager ? 'bg-white text-sbs-blue shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Gerente Externo
                        </button>
                    </div>
                </div>
                    {isExternalManager && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start text-xs text-blue-800">
                        <HelpCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Has seleccionado <strong>Gerente Externo</strong>. Completa sus datos a continuación. Opcionalmente, también puedes designar socios con rol de "Gerente" para una administración mixta.</span>
                    </div>
                )}

                {/* --- CAMPOS DEL GERENTE EXTERNO --- */}
                {isExternalManager && (
                    <div className="mt-6 p-5 bg-white border-2 border-sbs-blue/20 rounded-xl animate-fade-in-up">
                        <h4 className="font-bold text-sbs-blue text-sm uppercase tracking-wider mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-sbs-blue text-white flex items-center justify-center text-xs mr-2">G</span>
                            Datos del Gerente Externo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    Nombre Completo <span className="text-sbs-red">*</span>
                                </label>
                                <input 
                                    placeholder="Nombres y Apellidos" 
                                    value={formData.manager.name} 
                                    onChange={e => updateFormData({ 
                                        manager: { ...formData.manager, name: e.target.value } 
                                    })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    {(formData.manager.nationality || 'República Dominicana') === 'República Dominicana' ? 'Cédula' : 'Pasaporte'} <span className="text-sbs-red">*</span>
                                </label>
                                <input 
                                    placeholder={(formData.manager.nationality || 'República Dominicana') === 'República Dominicana' ? 'XXX-XXXXXXX-X' : 'Número de Pasaporte'} 
                                    value={formData.manager.idNumber} 
                                    onChange={e => {
                                        const isDominican = (formData.manager.nationality || 'República Dominicana') === 'República Dominicana';
                                        const value = isDominican ? formatCedula(e.target.value) : e.target.value;
                                        updateFormData({ 
                                            manager: { ...formData.manager, idNumber: value } 
                                        });
                                    }}
                                    className={`${inputClass} font-mono`}
                                    maxLength={(formData.manager.nationality || 'República Dominicana') === 'República Dominicana' ? 13 : 20}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    Nacionalidad <span className="text-sbs-red">*</span>
                                </label>
                                <select 
                                    value={formData.manager.nationality || 'República Dominicana'} 
                                    onChange={e => updateFormData({ 
                                        manager: { ...formData.manager, nationality: e.target.value } 
                                    })}
                                    className={inputClass}
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 p-8 rounded-[1.5rem] mb-8 border border-blue-100 shadow-sm relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <h3 className="font-bold text-lg text-sbs-blue mb-2 flex items-center relative z-10">
                    Capital Social
                    <Tooltip text="El dinero total que los socios invierten para iniciar la empresa. Se divide en cuotas." />
                </h3>
                <p className="text-sm text-gray-600 mb-4 relative z-10">Define el monto total a aportar. (Mínimo sugerido RD$ 100,000)</p>
                
                <div className="relative z-10">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-sbs-blue/40">RD$</span>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.socialCapital === 0 ? '' : formData.socialCapital} 
                        onChange={handleCapitalChange} 
                        className="w-full pl-14 p-4 border-b-2 border-blue-200 bg-transparent text-3xl font-bold text-sbs-blue focus:outline-none focus:border-sbs-blue placeholder-blue-200/50"
                        placeholder="0"
                    />
                </div>

                {/* --- REAL-TIME TAX CALCULATOR --- */}
                {estimatedTax > 0 && (
                    <div className="mt-4 p-4 bg-white/60 rounded-xl border border-blue-100 backdrop-blur-sm animate-fade-in-up">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                            <span>Impuesto Constitución (1% excedente 100k):</span>
                            <span className="font-bold text-sbs-red">+ {formatCurrency(estimatedTax)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-sbs-blue pt-2 border-t border-blue-100">
                            <span>Total Estimado a Pagar:</span>
                            <span className="text-base">{formatCurrency(estimatedTotal)}</span>
                        </div>
                    </div>
                )}
                {/* ------------------------------- */}
            </div>

            {/* Duración de la Gerencia */}
            <div className="mb-8 p-6 bg-white border border-premium-border rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center">
                        Duración de la Gerencia
                        <Tooltip text="Tiempo de vigencia del Consejo de Gerencia antes de requerir ratificación." />
                    </label>
                </div>
                    <div className="relative">
                    <select
                        id="managementDuration"
                        value={formData.managementDuration}
                        onChange={(e) => updateFormData({ managementDuration: parseInt(e.target.value) })}
                        className={inputClass}
                    >
                        {Array.from({ length: 6 }, (_, i) => i + 1).map(year => (
                            <option key={year} value={year}>{year} {year === 1 ? 'Año' : 'Años'}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-sbs-blue">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Recomendado: 6 años para evitar renovaciones frecuentes.</p>
            </div>

            <h3 className="font-bold text-lg text-sbs-blue mb-4 flex items-center">Estructura de Socios <span className="ml-2 text-xs bg-blue-100 text-sbs-blue px-2 py-1 rounded-full">{formData.partners.length} Personas</span></h3>
            
            {formData.partners.map((partner, i) => {
                 // International Address Logic - Basado en PAÍS DE RESIDENCIA, no nacionalidad
                 const residenceCountry = partner.residenceCountry || 'República Dominicana';
                 const isDominicanResident = residenceCountry === 'República Dominicana';
                 const hasSpecialRegions = INTERNATIONAL_REGIONS[residenceCountry] !== undefined;
                 const regionOptions = hasSpecialRegions ? INTERNATIONAL_REGIONS[residenceCountry] : [];
                 
                 const availableMunicipalities = isDominicanResident && partner.addressProvince ? MUNICIPALITIES[partner.addressProvince] || [] : [];
                 
                 const partnerRoles = partner.roles || ['Socio'];
                 const isForeigner = partner.nationality !== 'República Dominicana';
                 const isPassport = partner.documentType === 'Pasaporte';

                 return (
                <div key={partner.id} className="border border-premium-border shadow-sm p-6 rounded-2xl mb-6 relative bg-white hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-sbs-blue text-sm uppercase tracking-wider">Socio {i+1}</h4>
                         {formData.partners.length > 1 && (
                            <button onClick={() => removePartner(partner.id)} className="text-red-400 text-xs font-bold uppercase tracking-wider hover:text-red-600 bg-red-50 px-2 py-1 rounded">Eliminar</button>
                        )}
                    </div>
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Nombres</label>
                            <input 
                                placeholder="Nombres" 
                                value={partner.names} 
                                onChange={e => handlePartnerChange(partner.id, 'names', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'names', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'names') ? 'border-red-300 bg-red-50' : ''}`} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Apellidos</label>
                            <input 
                                placeholder="Apellidos" 
                                value={partner.surnames} 
                                onChange={e => handlePartnerChange(partner.id, 'surnames', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'surnames', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'surnames') ? 'border-red-300 bg-red-50' : ''}`} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Nacionalidad</label>
                            <select 
                                value={partner.nationality} 
                                onChange={e => handlePartnerChange(partner.id, 'nationality', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'nationality', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'nationality') ? 'border-red-300 bg-red-50' : ''}`} 
                            >
                                {COUNTRIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Estado Civil</label>
                            <select value={partner.maritalStatus} onChange={e => handlePartnerChange(partner.id, 'maritalStatus', e.target.value as MaritalStatus)} className={inputClass}>
                                <option value="Soltero(a)">Soltero(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                                <option value="Unión Libre">Unión Libre</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                Fecha de Nacimiento <span className="text-sbs-red">*</span>
                            </label>
                            <input 
                                type="text"
                                placeholder="DD/MM/AAAA"
                                value={partner.birthDate || ''} 
                                onChange={e => {
                                    // Formatear con barras: DD/MM/AAAA usando formatDateMask
                                    const formatted = formatDateMask(e.target.value);
                                    handlePartnerChange(partner.id, 'birthDate', formatted);
                                }} 
                                onBlur={(e) => handleBlur(partner.id, 'birthDate', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'birthDate') ? 'border-red-300 bg-red-50' : ''}`}
                                maxLength={10}
                            />
                            {isError(partner.id, 'birthDate') && <p className="text-red-500 text-xs mt-1">{errors[partner.id]['birthDate']}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Profesión/Ocupación</label>
                            <input 
                                placeholder="Ej: Ingeniero" 
                                value={partner.profession} 
                                onChange={e => handlePartnerChange(partner.id, 'profession', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'profession', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'profession') ? 'border-red-300 bg-red-50' : ''}`} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                {partner.documentType} <Tooltip text={isForeigner ? "Número de Pasaporte" : "Formato: XXX-XXXXXXX-X"} />
                            </label>
                            <input 
                                placeholder={isForeigner ? "Número Pasaporte" : "XXX-XXXXXXX-X"} 
                                value={partner.idNumber} 
                                onChange={e => handlePartnerChange(partner.id, 'idNumber', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'idNumber', e.target.value)}
                                className={`${inputClass} font-mono ${isError(partner.id, 'idNumber') ? 'border-red-300 bg-red-50' : ''}`} 
                                maxLength={isForeigner ? 20 : 13}
                                inputMode={isForeigner ? "text" : "numeric"}
                            />
                            {isError(partner.id, 'idNumber') && <p className="text-red-500 text-xs mt-1">{errors[partner.id]['idNumber']}</p>}
                        </div>
                        
                        {/* Contact Info */}
                         <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Teléfono Móvil</label>
                            <input 
                                placeholder="+1 (809) 000-0000" 
                                value={partner.mobilePhone} 
                                onChange={e => handlePartnerChange(partner.id, 'mobilePhone', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'mobilePhone', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'mobilePhone') ? 'border-red-300 bg-red-50' : ''}`}
                                maxLength={20}
                                type="tel"
                            />
                             {isError(partner.id, 'mobilePhone') && <p className="text-red-500 text-xs mt-1">{errors[partner.id]['mobilePhone']}</p>}
                        </div>
                         <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Correo Personal</label>
                            <input 
                                placeholder="Email" 
                                type="email"
                                value={partner.email} 
                                onChange={e => handlePartnerChange(partner.id, 'email', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'email', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'email') ? 'border-red-300 bg-red-50' : ''}`} 
                            />
                             {isError(partner.id, 'email') && <p className="text-red-500 text-xs mt-1">{errors[partner.id]['email']}</p>}
                        </div>

                        {/* --- PREMIUM ID UPLOAD SECTION (CONDITIONAL) --- */}
                        <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sbs-blue mr-3">
                                    <IdCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block">Identificación Oficial</label>
                                    <p className="text-[10px] text-gray-400">
                                        {isPassport ? "Sube una foto clara de la página de datos del Pasaporte." : "Sube ambas caras de la Cédula."}
                                    </p>
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 ${isPassport ? '' : 'sm:grid-cols-2'} gap-6`}>
                                {/* Front Side */}
                                <div className="relative">
                                    <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider z-10">
                                        {isPassport ? "Página Principal" : "Frente"}
                                    </span>
                                    {uploadProgress[`${partner.id}_idFront`] ? (
                                        <UploadProgress progress={uploadProgress[`${partner.id}_idFront`]} />
                                    ) : !partner.idFront ? (
                                        <label className={`h-32 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden ${errors[partner.id]?.idFront ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/30 hover:border-sbs-blue hover:bg-blue-50/30'}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, partner.id, 'idFront', (file) => handlePartnerChange(partner.id, 'idFront', file))}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="relative z-10 flex flex-col items-center">
                                                <Image className="w-8 h-8 text-gray-300 group-hover:text-sbs-blue transition-colors mb-2" strokeWidth={1.5} />
                                                <span className="text-xs font-bold text-gray-400 group-hover:text-sbs-blue transition-colors">Subir Imagen</span>
                                            </div>
                                            <input type="file" className="hidden" accept={ALLOWED_FILE_TYPES} onChange={(e) => e.target.files && handleFileUpload(`${partner.id}_idFront`, e.target.files[0], (file) => handlePartnerChange(partner.id, 'idFront', file))} />
                                        </label>
                                    ) : (
                                        <FilePreview file={partner.idFront} onRemove={() => handlePartnerChange(partner.id, 'idFront', null)} />
                                    )}
                                    {errors[partner.id]?.idFront && <p className="text-red-500 text-[10px] mt-1 font-bold text-center">{errors[partner.id]['idFront']}</p>}
                                </div>

                                {/* Back Side - HIDDEN IF PASSPORT */}
                                {!isPassport && (
                                    <div className="relative">
                                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider z-10">Dorso / Atrás</span>
                                        {uploadProgress[`${partner.id}_idBack`] ? (
                                            <UploadProgress progress={uploadProgress[`${partner.id}_idBack`]} />
                                        ) : !partner.idBack ? (
                                            <label className={`h-32 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden ${errors[partner.id]?.idBack ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/30 hover:border-sbs-blue hover:bg-blue-50/30'}`}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, partner.id, 'idBack', (file) => handlePartnerChange(partner.id, 'idBack', file))}
                                            >
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <Image className="w-8 h-8 text-gray-300 group-hover:text-sbs-blue transition-colors mb-2" strokeWidth={1.5} />
                                                    <span className="text-xs font-bold text-gray-400 group-hover:text-sbs-blue transition-colors">Subir Imagen</span>
                                                </div>
                                                <input type="file" className="hidden" accept={ALLOWED_FILE_TYPES} onChange={(e) => e.target.files && handleFileUpload(`${partner.id}_idBack`, e.target.files[0], (file) => handlePartnerChange(partner.id, 'idBack', file))} />
                                            </label>
                                        ) : (
                                           <FilePreview file={partner.idBack} onRemove={() => handlePartnerChange(partner.id, 'idBack', null)} />
                                        )}
                                        {errors[partner.id]?.idBack && <p className="text-red-500 text-[10px] mt-1 font-bold text-center">{errors[partner.id]['idBack']}</p>}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Selector de Cargos (Multi-select) - SIEMPRE VISIBLE para Gerencia Mixta */}
                        <div className="md:col-span-2 mt-2">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">
                                Cargos Asignados {!isExternalManager && <span className="text-sbs-red">*</span>}
                                <Tooltip text={isExternalManager 
                                    ? "Opcional: Puedes designar socios como Gerentes adicionales para una administración mixta." 
                                    : "Al menos un socio debe ser designado como Gerente para representar a la empresa."
                                } />
                             </label>
                             <div className="flex flex-wrap gap-2">
                                 {['Socio', 'Gerente'].map(role => {
                                     const isActive = partnerRoles.includes(role);
                                     const isFixed = role === 'Socio';
                                     
                                     return (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => !isFixed && toggleRole(partner.id, role)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                                                isActive 
                                                    ? isFixed 
                                                        ? 'bg-sbs-blue text-white border-sbs-blue cursor-not-allowed opacity-90' 
                                                        : 'bg-sbs-blue text-white border-sbs-blue hover:bg-sbs-blue-light'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {role} {isActive && <span className="ml-1">✓</span>}
                                        </button>
                                     )
                                 })}
                             </div>
                        </div>
                        
                        {/* Granular Address (Smart International Logic) */}
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3 bg-premium-surface-subtle p-4 rounded-xl border border-premium-border mt-2">
                            <div className="col-span-2 md:col-span-3 mb-1 flex items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección Residencial</span>
                                <Tooltip text="Dirección personal del socio (no de la empresa). El país de residencia determina el formato de la dirección." />
                            </div>
                            
                            {/* País de Residencia - Determina el formato de dirección */}
                            <div className="col-span-2 md:col-span-3 mb-2 relative z-10">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    País de Residencia <span className="text-sbs-red">*</span>
                                </label>
                                <select 
                                    value={partner.residenceCountry || 'República Dominicana'} 
                                    onChange={e => {
                                        // Actualizar residenceCountry Y limpiar campos en UNA SOLA operación
                                        const updatedPartners = formData.partners.map(p => 
                                            p.id === partner.id 
                                                ? { 
                                                    ...p, 
                                                    residenceCountry: e.target.value,
                                                    addressProvince: '',
                                                    addressCity: '',
                                                    postalCode: ''
                                                  } 
                                                : p
                                        );
                                        updateFormData({ partners: updatedPartners });
                                    }}
                                    className={`${inputClass} text-xs cursor-pointer`}
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <input 
                                placeholder="Calle" 
                                value={partner.addressStreet} 
                                onChange={e => handlePartnerChange(partner.id, 'addressStreet', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'addressStreet', e.target.value)}
                                className={`${inputClass} text-xs ${isError(partner.id, 'addressStreet') ? 'border-red-300' : ''}`} 
                            />
                            <input placeholder="Número" value={partner.addressNumber} onChange={e => handlePartnerChange(partner.id, 'addressNumber', e.target.value)} className={`${inputClass} text-xs`} />
                            <input placeholder="Edificio / Res." value={partner.addressBuilding || ''} onChange={e => handlePartnerChange(partner.id, 'addressBuilding', e.target.value)} className={`${inputClass} text-xs`} />
                            <input placeholder="Apto / Casa #" value={partner.addressSuite || ''} onChange={e => handlePartnerChange(partner.id, 'addressSuite', e.target.value)} className={`${inputClass} text-xs`} />
                            
                            <input placeholder="Sector" value={partner.addressSector} onChange={e => handlePartnerChange(partner.id, 'addressSector', e.target.value)} className={`${inputClass} text-xs`} />
                            
                            {/* SMART ADDRESS LOGIC - International Support */}
                            {(() => {
                                const postalConfig = POSTAL_CODE_CONFIG[residenceCountry];
                                const regionLabel = postalConfig?.regionLabel || 'Estado / Provincia';
                                
                                if (isDominicanResident) {
                                    // República Dominicana: Provincias + Municipios (sin código postal)
                                    return (
                                        <>
                                            <select 
                                                value={partner.addressProvince} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressProvince', e.target.value)} 
                                                onBlur={(e) => handleBlur(partner.id, 'addressProvince', e.target.value)}
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressProvince') ? 'border-red-300' : ''}`}
                                            >
                                                <option value="">Provincia...</option>
                                                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                            
                                            {availableMunicipalities.length > 0 ? (
                                                <select 
                                                    value={partner.addressCity} 
                                                    onChange={e => handlePartnerChange(partner.id, 'addressCity', e.target.value)} 
                                                    onBlur={(e) => handleBlur(partner.id, 'addressCity', e.target.value)}
                                                    className={`${inputClass} text-xs ${isError(partner.id, 'addressCity') ? 'border-red-300' : ''}`}
                                                >
                                                    <option value="">Municipio...</option>
                                                    {availableMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            ) : (
                                                <input 
                                                    placeholder="Municipio" 
                                                    value={partner.addressCity} 
                                                    onChange={e => handlePartnerChange(partner.id, 'addressCity', e.target.value)} 
                                                    className={`${inputClass} text-xs`} 
                                                />
                                            )}
                                        </>
                                    );
                                } else if (hasSpecialRegions) {
                                    // Países con regiones especiales (USA, España, Italia, Chile, Canadá)
                                    return (
                                        <>
                                            <select 
                                                value={partner.addressProvince} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressProvince', e.target.value)} 
                                                onBlur={(e) => handleBlur(partner.id, 'addressProvince', e.target.value)}
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressProvince') ? 'border-red-300' : ''}`}
                                            >
                                                <option value="">{regionLabel}...</option>
                                                {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <input 
                                                placeholder="Ciudad" 
                                                value={partner.addressCity} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressCity', e.target.value)}
                                                onBlur={(e) => handleBlur(partner.id, 'addressCity', e.target.value)} 
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressCity') ? 'border-red-300' : ''}`} 
                                            />
                                            {/* Código Postal con etiqueta dinámica */}
                                            {postalConfig && (
                                                <input 
                                                    placeholder={postalConfig.label}
                                                    value={partner.postalCode || ''} 
                                                    onChange={e => handlePartnerChange(partner.id, 'postalCode', e.target.value)}
                                                    className={`${inputClass} text-xs font-mono`}
                                                    maxLength={postalConfig.maxLength}
                                                />
                                            )}
                                        </>
                                    );
                                } else {
                                    // Otros países (campos libres + código postal genérico)
                                    return (
                                        <>
                                            <input 
                                                placeholder="Estado / Provincia" 
                                                value={partner.addressProvince} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressProvince', e.target.value)} 
                                                onBlur={(e) => handleBlur(partner.id, 'addressProvince', e.target.value)}
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressProvince') ? 'border-red-300' : ''}`}
                                            />
                                            <input 
                                                placeholder="Ciudad" 
                                                value={partner.addressCity} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressCity', e.target.value)}
                                                onBlur={(e) => handleBlur(partner.id, 'addressCity', e.target.value)} 
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressCity') ? 'border-red-300' : ''}`} 
                                            />
                                            <input 
                                                placeholder="Código Postal" 
                                                value={partner.postalCode || ''} 
                                                onChange={e => handlePartnerChange(partner.id, 'postalCode', e.target.value)}
                                                className={`${inputClass} text-xs font-mono`}
                                                maxLength={10}
                                            />
                                        </>
                                    );
                                }
                            })()}
                        </div>

                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 md:col-span-2 flex items-center justify-between mt-2">
                            <div className="w-1/2 pr-4 border-r border-blue-200">
                                <label className="block text-[10px] font-bold text-sbs-blue uppercase mb-1 tracking-wider">Porcentaje (%)</label>
                                <div className="flex items-center">
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={formData.companyType === 'EIRL' ? '100' : (partner.percentage === 0 ? '' : partner.percentage)}
                                        onChange={e => formData.companyType !== 'EIRL' && handlePartnerChange(partner.id, 'percentage', e.target.value)}
                                        disabled={formData.companyType === 'EIRL'}
                                        className={`w-full bg-transparent font-bold focus:outline-none text-2xl placeholder-blue-300 ${
                                            formData.companyType === 'EIRL' 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'text-sbs-blue'
                                        }`}
                                        max="100" 
                                        placeholder="0" 
                                    />
                                    <span className="text-sbs-blue font-bold">%</span>
                                </div>
                            </div>
                            <div className="w-1/2 pl-4 text-right">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cuotas Asignadas</span>
                                <span className="text-2xl font-bold text-text-primary font-mono block">{partner.shares}</span>
                                <span className="text-xs text-gray-400">Valor nom. RD$ 100</span>
                            </div>
                        </div>
                    </div>
                </div>
            )})}
            
            <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-xl">
                <button 
                    onClick={addPartner}
                    disabled={formData.companyType === 'EIRL' && formData.partners.length >= 1}
                    className={`text-sm font-bold flex items-center px-3 py-2 rounded-lg transition-colors ${
                        formData.companyType === 'EIRL' && formData.partners.length >= 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-sbs-blue hover:underline hover:bg-blue-50'
                    }`}
                    title={formData.companyType === 'EIRL' ? "Una E.I.R.L. puede tener solo 1 titular" : ""}
                >
                    <span className="text-lg mr-1">+</span> Añadir Socio
                </button>
                <div className={`font-bold text-sm px-4 py-2 rounded-lg border ${Math.abs(totalPercentage - 100) < 0.1 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    Total: {totalPercentage}%
                </div>
            </div>

            {/* --- SELECTOR DE TITULAR DE FIRMA DIGITAL --- */}
            {formData.partners.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-8 shadow-sm">
                    <div className="flex items-start mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sbs-blue mr-3 flex-shrink-0">
                            <FileSignature className="w-4 h-4" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-sbs-blue mb-1">
                                Titular de la Firma Digital <span className="text-sbs-red">*</span>
                            </label>
                            <p className="text-xs text-gray-500">
                                Selecciona cuál socio será el responsable de la firma digital de la empresa. Solo puede ser uno.
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {formData.partners.map((partner) => (
                            <label 
                                key={partner.id}
                                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    formData.digitalSignatureHolderId === partner.id 
                                        ? 'border-sbs-blue bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="digitalSignatureHolder"
                                    checked={formData.digitalSignatureHolderId === partner.id}
                                    onChange={() => updateFormData({ digitalSignatureHolderId: partner.id })}
                                    className="w-4 h-4 text-sbs-blue border-gray-300 focus:ring-sbs-blue"
                                />
                                <div className="ml-3 flex-1">
                                    <span className="font-bold text-text-primary">
                                        {partner.names && partner.surnames 
                                            ? `${partner.names} ${partner.surnames}` 
                                            : `Socio ${formData.partners.indexOf(partner) + 1}`
                                        }
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2">
                                        {partner.idNumber || 'Sin documento'}
                                    </span>
                                </div>
                                {formData.digitalSignatureHolderId === partner.id && (
                                    <span className="text-xs bg-sbs-blue text-white px-2 py-1 rounded-full font-bold">
                                        Titular
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                    
                    {!formData.digitalSignatureHolderId && (
                        <p className="text-xs text-amber-600 mt-3 flex items-center">
                            <HelpCircle className="w-3 h-3 mr-1" />
                            Debes seleccionar un titular para continuar.
                        </p>
                    )}
                </div>
            )}
            
            <div className="flex justify-between pt-4">
                <button onClick={prevStep} disabled={isSubmitting} className="px-8 py-4 rounded-full font-bold text-text-tertiary hover:text-sbs-blue transition-colors hover:bg-gray-50 disabled:opacity-50">Atrás</button>
                <button 
                    onClick={handleNext} 
                    disabled={isSubmitting} 
                    className="px-12 py-5 bg-sbs-blue text-white rounded-full font-bold shadow-xl hover:shadow-glow-blue hover:-translate-y-0.5 transition-all duration-300 tracking-wide text-lg active:scale-95 disabled:opacity-70 disabled:cursor-wait disabled:transform-none"
                >
                    {isSubmitting ? 'Verificando...' : 'Siguiente Paso \u2192'}
                </button>
            </div>
        </div>
    );
};

export default StepB;
