


import React, { useState, useEffect } from 'react';
import { FormData, Titular, Partner } from '../types';
import { validateEmail, validateRequired, validateCedula, formatCedula, formatPhoneNumber, sanitizeInput, sanitizeCompanyName, validatePhoneNumber } from '../utils/validation';
import { PROVINCES, MUNICIPALITIES, PACKAGES, PackageName, ALLOWED_FILE_TYPES } from '../constants';
import { HelpCircle, Check, Trash2, CloudUpload, Camera, User, Loader2, CheckCircle, Sparkles } from 'lucide-react';

interface StepAProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    nextStep: () => void;
    prevStep: () => void;
}

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2 align-middle">
        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help hover:text-sbs-blue transition-colors" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-sbs-blue text-white text-xs rounded-lg p-3 shadow-xl z-20 text-center leading-relaxed">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-sbs-blue rotate-45"></div>
        </div>
    </div>
);

const StepA: React.FC<StepAProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Estado para selector de segundo titular
    const [showSecondTitularSelector, setShowSecondTitularSelector] = useState(false);
    const [secondTitularChoice, setSecondTitularChoice] = useState<'new' | number | null>(null);

    // --- STYLES PREMIUM FINTECH REFINED ---
    const inputClass = "w-full px-5 py-4 rounded-xl bg-white border border-gray-200 text-text-primary font-medium placeholder-gray-400 focus:outline-none focus:border-sbs-blue focus:ring-4 focus:ring-sbs-blue/10 transition-all duration-300 shadow-sm text-base disabled:bg-gray-100 disabled:text-gray-500";
    const labelClass = "block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest flex items-center";
    const sectionClass = "bg-white shadow-premium border border-premium-border p-8 sm:p-10 rounded-[2rem] mb-8 transition-all hover:shadow-premium-hover scroll-mt-24";
    // --- END STYLES ---

    useEffect(() => {
        if (formData.titulars.length === 0) {
            updateFormData({
                titulars: [{
                    id: Date.now(),
                    names: '',
                    surnames: '',
                    documentType: 'Cédula', idNumber: '',
                    idFront: null,
                    idBack: null
                }]
            });
        }
        // Init default for hasRegisteredName if undefined
        if (!formData.hasRegisteredName) {
            updateFormData({ hasRegisteredName: 'No', nameOwnership: 'Un solo socio' });
        }
    }, []);

    // Forzar "Un solo socio" si es EIRL
    useEffect(() => {
        if (formData.companyType === 'EIRL' && formData.nameOwnership !== 'Un solo socio') {
            updateFormData({ nameOwnership: 'Un solo socio' });
        }
    }, [formData.companyType]);

    // Sync data when "isTitular" is true and Applicant data changes
    useEffect(() => {
        if (formData.applicant.isTitular && formData.titulars.length > 0) {
            const updatedTitulars = [...formData.titulars];
            let hasChanges = false;
            
            if (updatedTitulars[0].names !== formData.applicant.names) {
                updatedTitulars[0].names = formData.applicant.names;
                hasChanges = true;
            }
            if (updatedTitulars[0].surnames !== formData.applicant.surnames) {
                updatedTitulars[0].surnames = formData.applicant.surnames;
                hasChanges = true;
            }

            if (hasChanges) {
                updateFormData({ titulars: updatedTitulars });
            }
        }
    }, [formData.applicant.names, formData.applicant.surnames, formData.applicant.isTitular]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // --- QA: SANITIZATION ON BLUR ---
        let cleanValue = value;
        if (name === 'companyName' || name === 'socialObject') {
            if (name === 'companyName') cleanValue = sanitizeCompanyName(value);
            else cleanValue = sanitizeInput(value);
            
            if (cleanValue !== value) {
                if (name === 'companyName') updateFormData({ companyName: cleanValue });
                if (name === 'socialObject') updateFormData({ socialObject: cleanValue });
            }
        } else {
            cleanValue = sanitizeInput(value);
            if (cleanValue !== value && name !== 'email') { 
                 if (name === 'names' || name === 'surnames') updateFormData({ applicant: { ...formData.applicant, [name]: cleanValue }});
            }
        }
        // --------------------------------

        setTouched(prev => ({ ...prev, [name]: true }));
        validateField(name, cleanValue);
    };

    const validateField = (name: string, value: string) => {
        const newErrors = { ...errors };
        
        // Clear specific error for this field first
        delete newErrors[name];
        delete newErrors[name === 'names' ? 'appNames' : name === 'surnames' ? 'appSurnames' : 'appEmail'];
        if (name === 'phone') delete newErrors['appPhone'];

        // Validation Logic
        
        // REGLA CRÍTICA: Nombre comercial obligatorio SIEMPRE
        if (name === 'companyName' && !validateRequired(value)) {
            newErrors.companyName = 'Nombre comercial requerido';
        }
        
        if (formData.hasRegisteredName === 'Sí') {
             if (name === 'onapiNumber') {
                 if (!validateRequired(value)) newErrors.onapiNumber = 'Número de registro requerido';
                 else if (value.length !== 6) newErrors.onapiNumber = 'Debe tener 6 dígitos exactos';
             }
        }
        
        if (name === 'socialObject' && !validateRequired(value)) newErrors.socialObject = 'Objeto social requerido';
        if (name === 'email' && value && !validateEmail(value)) newErrors.appEmail = 'Formato de email inválido';
        
        // Address Fields
        if (name === 'companyStreet' && !validateRequired(value)) newErrors.companyStreet = 'Calle requerida';
        if (name === 'companySector' && !validateRequired(value)) newErrors.companySector = 'Sector requerido';
        if (name === 'companyCity' && !validateRequired(value)) newErrors.companyCity = 'Ciudad requerida';
        if (name === 'companyProvince' && !validateRequired(value)) newErrors.companyProvince = 'Provincia requerida';

        // Applicant Fields
        if (name === 'names' && !validateRequired(value)) newErrors.appNames = 'Nombres requeridos';
        if (name === 'surnames' && !validateRequired(value)) newErrors.appSurnames = 'Apellidos requeridos';
        if (name === 'email' && !validateRequired(value)) newErrors.appEmail = 'Email requerido';
        
        // Validación Telefónica Internacional (Flexible)
        if (name === 'phone') {
            if (!validateRequired(value)) newErrors.appPhone = 'Teléfono requerido';
            else if (!validatePhoneNumber(value)) newErrors.appPhone = 'Teléfono inválido. Verifica el número.';
        }

        setErrors(newErrors);
    };

    const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        let val = type === 'checkbox' ? checked : value;
        
        if (name === 'phone') val = formatPhoneNumber(val as string);
        
        // Clear error when typing
        const errorKey = name === 'names' ? 'appNames' : name === 'surnames' ? 'appSurnames' : name === 'email' ? 'appEmail' : name === 'phone' ? 'appPhone' : name;
        if (errors[errorKey]) {
             setErrors(prev => {
                 const next = {...prev};
                 delete next[errorKey];
                 return next;
             });
        }

        updateFormData({ applicant: { ...formData.applicant, [name]: val } });
    };

    // Obtener socios elegibles para ser segundo titular (excluyendo el que ya es el primer titular)
    const getEligiblePartnersForSecondTitular = () => {
        const firstTitularId = formData.titulars[0]?.id;
        return formData.partners.filter(p => 
            p.id !== firstTitularId && 
            p.names && 
            p.surnames
        );
    };

    const handleOwnershipChange = (value: 'Un solo socio' | 'Dos socios') => {
        const newOwnership = value;
        
        // EIRL solo permite "Un solo socio"
        if (formData.companyType === 'EIRL' && newOwnership === 'Dos socios') {
            return;
        }
        
        let newTitulars = [...formData.titulars];

        if (newOwnership === 'Dos socios' && newTitulars.length < 2) {
            const eligiblePartners = getEligiblePartnersForSecondTitular();
            
            if (eligiblePartners.length > 0) {
                // Hay socios disponibles, mostrar selector
                setShowSecondTitularSelector(true);
                setSecondTitularChoice(null);
                // Actualizar ownership pero no agregar titular aún
                updateFormData({ nameOwnership: newOwnership });
                return;
            } else {
                // No hay socios, agregar titular vacío directamente
                newTitulars.push({
                    id: Date.now(),
                    names: '', surnames: '', documentType: 'Cédula', idNumber: '', idFront: null, idBack: null
                });
            }
        } else if (newOwnership === 'Un solo socio' && newTitulars.length > 1) {
            // Remove second titular automatically, keep first
            newTitulars = [newTitulars[0]];
            setShowSecondTitularSelector(false);
            setSecondTitularChoice(null);
        }

        updateFormData({ 
            nameOwnership: newOwnership,
            titulars: newTitulars 
        });
    };

    const handleSecondTitularSelection = (choice: 'new' | number) => {
        setSecondTitularChoice(choice);
        let newTitulars = [...formData.titulars];
        
        // Asegurar que solo tengamos 1 titular antes de agregar el segundo
        if (newTitulars.length > 1) {
            newTitulars = [newTitulars[0]];
        }

        if (choice === 'new') {
            // Crear titular completamente nuevo
            newTitulars.push({
                id: Date.now(),
                names: '', surnames: '', documentType: 'Cédula', idNumber: '', idFront: null, idBack: null
            });
        } else {
            // Usar datos del socio existente
            const selectedPartner = formData.partners.find(p => p.id === choice);
            if (selectedPartner) {
                newTitulars.push({
                    id: selectedPartner.id, // Mantener el mismo ID para sincronización
                    names: selectedPartner.names,
                    surnames: selectedPartner.surnames,
                    idNumber: selectedPartner.idNumber,
                    idFront: selectedPartner.idFront,
                    idBack: selectedPartner.idBack
                });
            }
        }

        updateFormData({ titulars: newTitulars });
        setShowSecondTitularSelector(false);
    };

    const handleTitularChange = (index: number, field: keyof Titular, value: any) => {
        const newTitulars = [...formData.titulars];
        
        // Mask Cédula onChange
        if (field === 'idNumber' && newTitulars[index].documentType === 'Cédula') { value = formatCedula(value); }
        
        newTitulars[index] = { ...newTitulars[index], [field]: value };
        updateFormData({ titulars: newTitulars });
        
        // Clear errors on type
        const errorKey = `titular_${index}_${field === 'idFront' ? 'front' : field === 'idBack' ? 'back' : field === 'idNumber' ? 'id' : field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newState = {...prev};
                delete newState[errorKey];
                return newState;
            });
        }
    };

    // --- QA: FILE UPLOAD SIMULATION ---
    const handleFileUpload = (key: string, file: File, callback: (f: File) => void) => {
        // 🔥 FIX CRÍTICO: Guardar archivo INMEDIATAMENTE (antes de la animación)
        callback(file);
        
        // Simulate upload progress (solo visual)
        let progress = 0;
        setUploadProgress(prev => ({ ...prev, [key]: 0 }));
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setUploadProgress(prev => {
                    const next = { ...prev };
                    delete next[key]; // Remove progress bar when done
                    return next;
                });
            } else {
                setUploadProgress(prev => ({ ...prev, [key]: progress }));
            }
        }, 200);
    };

    const handleTitularBlur = (index: number, field: string, value: string) => {
        // QA: Sanitize Titular inputs
        let cleanValue = sanitizeInput(value);
        if (cleanValue !== value) {
             handleTitularChange(index, field as keyof Titular, cleanValue);
        }

        setTouched(prev => ({ ...prev, [`titular_${index}_${field}`]: true }));
        
        const newErrors = { ...errors };
        const errorKey = `titular_${index}_${field === 'idNumber' ? 'id' : field}`;

        if (field === 'idNumber') {
            if (!validateRequired(cleanValue)) newErrors[errorKey] = 'Documento requerido'; else if (formData.titulars[index].documentType === 'Cédula' && !validateCedula(cleanValue)) newErrors[errorKey] = 'Formato inválido (XXX-XXXXXXX-X)'; else if (formData.titulars[index].documentType === 'Pasaporte' && cleanValue.length > 20) newErrors[errorKey] = 'Máximo 20 caracteres'; else delete newErrors[errorKey];
        } else if (field === 'names' || field === 'surnames') {
             if (!validateRequired(cleanValue)) newErrors[errorKey] = 'Requerido';
             else delete newErrors[errorKey];
        }
        setErrors(newErrors);
    };

    const removeFile = (index: number, field: 'idFront' | 'idBack') => {
         const newTitulars = [...formData.titulars];
         newTitulars[index] = { ...newTitulars[index], [field]: null };
         updateFormData({ titulars: newTitulars });
    }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (errors[name]) {
            setErrors(prev => {
                const next = {...prev};
                delete next[name];
                return next;
            });
        }

        if (name === 'companyProvince') {
             updateFormData({ companyProvince: value, companyCity: '' });
        } else {
            updateFormData({ [name]: value });
        }
    };

    // --- DRAG AND DROP HANDLERS ---
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>, uploadKey: string, callback: (file: File) => void) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(uploadKey, e.dataTransfer.files[0], callback);
        }
    };

    const handleImproveWithAI = async () => {
        if (!formData.socialObject.trim()) return;
        setIsLoadingAI(true);
        try {
            const response = await fetch('/api/optimize-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: formData.socialObject, companyType: formData.companyType })
            });

            const data = await response.json();
            
            if (data.optimizedText) {
                updateFormData({ socialObject: data.optimizedText });
            } else {
                // Si hay error, mantener el texto original
                console.error('Error optimizando texto:', data.error);
            }
        } catch (e) {
            console.error('Error llamando al endpoint de optimización:', e);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const scrollToError = () => {
        setTimeout(() => {
            const firstErrorElement = document.querySelector('.border-red-300');
            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        
        // REGLA CRÍTICA: El nombre comercial (texto) es obligatorio SIEMPRE.
        // Si tiene registro, necesitamos el nombre para cotejar con el certificado.
        if (!validateRequired(formData.companyName)) {
             newErrors.companyName = 'El nombre de la empresa es obligatorio.';
        }

        if (formData.hasRegisteredName === 'Sí') {
            if (!validateRequired(formData.onapiNumber || '')) newErrors.onapiNumber = 'Número de registro ONAPI requerido';
            else if ((formData.onapiNumber || '').length !== 6) newErrors.onapiNumber = 'Debe tener 6 dígitos exactos';

            if (!formData.onapiCertificate) newErrors.onapiCertificate = 'Debes adjuntar el certificado de ONAPI.';
        }

        if (!validateRequired(formData.socialObject)) newErrors.socialObject = 'Requerido';
        if (!validateRequired(formData.applicant.names)) newErrors.appNames = 'Requerido';
        if (!validateRequired(formData.applicant.surnames)) newErrors.appSurnames = 'Requerido';
        if (!validateEmail(formData.applicant.email)) newErrors.appEmail = 'Email inválido';
        
        if (!validateRequired(formData.applicant.phone)) newErrors.appPhone = 'Requerido';
        else if (!validatePhoneNumber(formData.applicant.phone)) newErrors.appPhone = 'Teléfono inválido';

        if (!validateRequired(formData.companyStreet)) newErrors.companyStreet = 'Requerida';
        if (!validateRequired(formData.companyStreetNumber)) newErrors.companyStreetNumber = 'Requerido';
        if (!validateRequired(formData.companySector)) newErrors.companySector = 'Requerido';
        if (!validateRequired(formData.companyCity)) newErrors.companyCity = 'Requerida';
        if (!validateRequired(formData.companyProvince)) newErrors.companyProvince = 'Requerida';

        // Validaciones de titulares SOLO si NO tiene nombre registrado
        if (formData.hasRegisteredName === 'No') {
            formData.titulars.forEach((t, i) => {
                if (!validateRequired(t.names)) newErrors[`titular_${i}_names`] = 'Nombre requerido';
                if (!validateRequired(t.surnames)) newErrors[`titular_${i}_surnames`] = 'Apellido requerido';
                if (!validateRequired(t.idNumber)) newErrors[`titular_${i}_id`] = 'Documento requerido'; else if (t.documentType === 'Cédula' && !validateCedula(t.idNumber)) newErrors[`titular_${i}_id`] = 'Cédula inválida (XXX-XXXXXXX-X)'; else if (t.documentType === 'Pasaporte' && t.idNumber.length > 20) newErrors[`titular_${i}_id`] = 'Máximo 20 caracteres';
                if (!t.idFront) newErrors[`titular_${i}_front`] = 'Foto frontal requerida';
                if (!t.idBack) newErrors[`titular_${i}_back`] = 'Foto dorsal requerida';
            });

            if (formData.titulars.length > 1) {
                const id1 = formData.titulars[0].idNumber;
                const id2 = formData.titulars[1].idNumber;
                if (id1 && id2 && id1 === id2) {
                    newErrors[`titular_1_id`] = 'El titular 2 no puede ser el mismo que el titular 1.';
                }
            }
        }

        setErrors(newErrors);
        
        const allTouched: Record<string, boolean> = {};
        Object.keys(newErrors).forEach(key => allTouched[key] = true);
        setTouched(prev => ({...prev, ...allTouched}));

        const isValid = Object.keys(newErrors).length === 0;
        if (!isValid) {
            scrollToError();
        }
        return isValid;
    };

    const handleSubmit = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (validate()) {
            
            let updatedPartners: Partner[] = [];

            if (formData.hasRegisteredName === 'No') {
                const titularsAsPartners = formData.titulars.map(t => {
                    const existingPartner = formData.partners.find(p => p.id === t.id);
                    if (existingPartner) {
                        return {
                            ...existingPartner,
                            names: t.names,
                            surnames: t.surnames,
                            idNumber: t.idNumber,
                            idFront: t.idFront,
                            idBack: t.idBack
                        };
                    } else {
                        return {
                            id: t.id,
                            names: t.names,
                            surnames: t.surnames,
                            idNumber: t.idNumber,
                            idFront: t.idFront,
                            idBack: t.idBack,
                            nationality: 'República Dominicana',
                            birthDate: '', // Campo obligatorio, se llenará en StepB
                            maritalStatus: 'Soltero(a)',
                            profession: '',
                            documentType: t.documentType,
                            residenceCountry: 'República Dominicana', // País de residencia
                            addressStreet: '', addressNumber: '', addressSector: '', addressCity: '', addressProvince: '',
                            postalCode: '', // Código postal para direcciones internacionales
                            email: formData.applicant.isTitular && t.names === formData.applicant.names ? formData.applicant.email : '', 
                            mobilePhone: formData.applicant.isTitular && t.names === formData.applicant.names ? formData.applicant.phone : '',
                            role: '', roles: ['Socio'], percentage: 0, shares: 0
                        } as unknown as Partner; 
                    }
                });
                const manualPartners = formData.partners.filter(p => !formData.titulars.find(t => t.id === p.id));
                updatedPartners = [...titularsAsPartners, ...manualPartners];

            } else {
                if (formData.partners.length === 0) {
                     updatedPartners = [{
                        id: Date.now(),
                        names: formData.applicant.names,
                        surnames: formData.applicant.surnames,
                        documentType: 'Cédula', idNumber: '',
                        idFront: null,
                        idBack: null,
                        nationality: 'República Dominicana',
                        birthDate: '',
                        maritalStatus: 'Soltero(a)',
                        profession: '',
                        residenceCountry: 'República Dominicana', // País de residencia
                        addressStreet: '', addressNumber: '', addressSector: '', addressCity: '', addressProvince: '',
                        postalCode: '', // Código postal para direcciones internacionales
                        email: formData.applicant.email,
                        mobilePhone: formData.applicant.phone,
                        roles: ['Socio'], percentage: 0, shares: 0
                     } as unknown as Partner];
                } else {
                    updatedPartners = formData.partners;
                }
            }

            updateFormData({ partners: updatedPartners });
            nextStep();
        } 
        
        setTimeout(() => setIsSubmitting(false), 500);
    };

    const isError = (field: string) => touched[field] && errors[field];

    const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl w-full animate-fade-in-up shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mr-4">
                    <Check className="w-5 h-5" strokeWidth={3} />
                </div>
                <div>
                    <p className="text-[10px] text-green-700 font-bold uppercase mb-0.5 tracking-wider">Cargado con éxito</p>
                    <p className="text-sm text-text-primary font-bold truncate mr-2 max-w-[150px]">{file.name}</p>
                </div>
            </div>
            <button onClick={(e) => { e.preventDefault(); onRemove(); }} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Eliminar archivo">
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
    );

    const UploadProgress = ({ progress }: { progress: number }) => (
        <div className="w-full h-32 border-2 border-solid border-sbs-blue bg-blue-50 rounded-xl flex flex-col items-center justify-center px-8">
            <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
                <div className="bg-sbs-blue h-2.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs font-bold text-sbs-blue">Subiendo... {Math.round(progress)}%</span>
        </div>
    );

    const availableMunicipalities = formData.companyProvince ? MUNICIPALITIES[formData.companyProvince] || [] : [];

    return (
        <div id="step-a-container" className="animate-fade-in-up">
            
            {/* 0. Selector de Plan */}
            <section className={sectionClass}>
                <h3 className="text-2xl font-bold text-sbs-blue mb-6 flex items-center">
                    <span className="bg-premium-surface-subtle text-sbs-blue rounded-xl w-10 h-10 flex items-center justify-center text-sm mr-4 font-extrabold border border-premium-border">0</span>
                    Tu Plan Seleccionado
                </h3>
                <div className="bg-blue-50/50 border border-sbs-blue/20 rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-sbs-blue font-bold text-xs uppercase tracking-wider mb-1">Plan Actual</h4>
                        <p className="text-xl font-bold text-text-primary">{formData.packageName || 'Essential 360'}</p>
                    </div>
                </div>
            </section>

            {/* 1. Datos de la Empresa (ACTUALIZADO CON LÓGICA ONAPI Y ALTERNATIVAS) */}
            <section className={sectionClass}>
                <h3 className="text-2xl font-bold text-sbs-blue mb-8 flex items-center">
                    <span className="bg-premium-surface-subtle text-sbs-blue rounded-xl w-10 h-10 flex items-center justify-center text-sm mr-4 font-extrabold border border-premium-border">1</span>
                    Registro de Nombre y Servicio
                </h3>
                <div className="space-y-8">
                    
                    {/* Pregunta 4: Nombre Registrado? */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <label className={labelClass}>¿Ya posees el Nombre Comercial registrado en ONAPI?</label>
                        <div className="flex space-x-6 mt-3">
                            {['Sí', 'No'].map(opt => (
                                <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="hasRegisteredName" 
                                        value={opt} 
                                        checked={formData.hasRegisteredName === opt}
                                        onChange={(e) => updateFormData({ hasRegisteredName: e.target.value as 'Sí' | 'No' })}
                                        className="h-5 w-5 text-sbs-blue border-gray-300 focus:ring-sbs-blue"
                                    />
                                    <span className="text-sm font-bold text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* CAMPO DE NOMBRE DE EMPRESA (OBLIGATORIO SIEMPRE) */}
                    {/* Auditoría Crítica: No podemos validar un registro sin saber el nombre. */}
                    <div className="animate-fade-in-up">
                        <label className={labelClass}>
                            {formData.hasRegisteredName === 'Sí' ? 'Nombre de la Empresa (Tal cual figura en el Certificado)' : 'Nombre Preferido para la Empresa (Opción A)'}
                             <Tooltip text={formData.hasRegisteredName === 'Sí' ? "Escríbelo idéntico al documento." : "Tu primera elección para el nombre."} />
                        </label>
                        <input 
                            name="companyName"
                            value={formData.companyName} 
                            onChange={(e) => updateFormData({ companyName: e.target.value })}
                            onBlur={handleBlur}
                            className={`${inputClass} text-xl font-bold tracking-tight ${isError('companyName') ? 'border-red-300 bg-red-50' : ''}`}
                            placeholder="Ej: Mi Empresa Dominicana SRL"
                        />
                        {isError('companyName') && <p className="text-red-500 text-xs mt-2 font-bold ml-1">{errors.companyName}</p>}
                    </div>

                    {formData.hasRegisteredName === 'Sí' ? (
                        // Opción A: Tiene nombre, pedimos certificado y número
                        <div className="animate-fade-in-up space-y-6">
                            <div>
                                <label className={labelClass}>Registro ONAPI # (Num. de Certificado)</label>
                                <input 
                                    name="onapiNumber"
                                    value={formData.onapiNumber || ''} 
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        updateFormData({ onapiNumber: val });
                                    }}
                                    onBlur={handleBlur}
                                    className={`${inputClass} font-mono ${isError('onapiNumber') ? 'border-red-300 bg-red-50' : ''}`}
                                    placeholder="Ej: 567890"
                                    maxLength={6}
                                />
                                {isError('onapiNumber') && <p className="text-red-500 text-xs mt-2 font-bold ml-1">{errors.onapiNumber}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>Adjuntar Certificado (Obligatorio)</label>
                                {uploadProgress['onapiCertificate'] ? (
                                    <UploadProgress progress={uploadProgress['onapiCertificate']} />
                                ) : !formData.onapiCertificate ? (
                                    <label 
                                        className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-white group hover:shadow-lg ${errors.onapiCertificate ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-sbs-blue hover:bg-blue-50/50'}`}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, 'onapiCertificate', (file) => updateFormData({ onapiCertificate: file }))}
                                    >
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept={ALLOWED_FILE_TYPES}
                                            onChange={(e) => e.target.files && handleFileUpload('onapiCertificate', e.target.files[0], (file) => updateFormData({ onapiCertificate: file }))}
                                        />
                                        <div className="text-center text-gray-400 group-hover:text-sbs-blue transition-colors">
                                             <CloudUpload className="w-8 h-8 mx-auto mb-2" />
                                             <span className="text-sm font-bold uppercase tracking-wide block">Subir Certificado</span>
                                        </div>
                                    </label>
                                ) : (
                                    <FilePreview file={formData.onapiCertificate} onRemove={() => updateFormData({ onapiCertificate: null })} />
                                )}
                                {errors.onapiCertificate && <p className="text-red-500 text-xs mt-2 font-bold ml-1">{errors.onapiCertificate}</p>}
                            </div>
                        </div>
                    ) : (
                        // Opción No tiene nombre: Alternativas
                        <div className="animate-fade-in-up space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Alternativa (Opción B) <Tooltip text="Si la Opción A es objetada por ONAPI, usaremos esta." /></label>
                                    <input 
                                        name="altName1"
                                        value={formData.altName1 || ''} 
                                        onChange={(e) => updateFormData({ altName1: e.target.value })}
                                        onBlur={handleBlur}
                                        className={inputClass}
                                        placeholder="Segunda opción..."
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Segunda Alternativa (Opción C)</label>
                                    <input 
                                        name="altName2"
                                        value={formData.altName2 || ''} 
                                        onChange={(e) => updateFormData({ altName2: e.target.value })}
                                        onBlur={handleBlur}
                                        className={inputClass}
                                        placeholder="Tercera opción..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pregunta 9: Titularidad del Nombre - SOLO SI NO TIENE NOMBRE REGISTRADO Y NO ES EIRL */}
                    {formData.hasRegisteredName === 'No' && formData.companyType !== 'EIRL' && (
                    <div className="animate-fade-in-up">
                        <label className={labelClass}>Titularidad del Nombre <Tooltip text="¿A nombre de quién quedará registrado el nombre comercial?" /></label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {['Un solo socio', 'Dos socios'].filter(opt => 
                                formData.companyType === 'EIRL' ? opt === 'Un solo socio' : true
                            ).map(opt => (
                                <label key={opt} className={`border rounded-xl p-4 flex items-center cursor-pointer transition-all hover:border-sbs-blue ${formData.nameOwnership === opt ? 'bg-blue-50 border-sbs-blue' : 'bg-white border-gray-200'}`}>
                                    <input 
                                        type="radio" 
                                        name="nameOwnership" 
                                        value={opt}
                                        checked={formData.nameOwnership === opt}
                                        onChange={(e) => handleOwnershipChange(e.target.value as 'Un solo socio' | 'Dos socios')}
                                        className="h-5 w-5 text-sbs-blue border-gray-300 focus:ring-sbs-blue"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">
                                        {opt}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* SELECTOR DE SEGUNDO TITULAR - Sincronización con Socios */}
                    {showSecondTitularSelector && formData.nameOwnership === 'Dos socios' && (
                        <div className="animate-fade-in-up bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl">
                            <div className="flex items-start mb-4">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3 flex-shrink-0">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-800 text-sm mb-1">¿Quién será el Segundo Titular?</h4>
                                    <p className="text-xs text-amber-700">
                                        Detectamos que ya tienes socios registrados. Puedes seleccionar uno de ellos o agregar una persona nueva.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {/* Opción: Socios existentes */}
                                {getEligiblePartnersForSecondTitular().map(partner => (
                                    <label 
                                        key={partner.id}
                                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            secondTitularChoice === partner.id 
                                                ? 'border-sbs-blue bg-blue-50' 
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <input 
                                            type="radio" 
                                            name="secondTitularChoice"
                                            checked={secondTitularChoice === partner.id}
                                            onChange={() => setSecondTitularChoice(partner.id)}
                                            className="w-4 h-4 text-sbs-blue border-gray-300 focus:ring-sbs-blue"
                                        />
                                        <div className="ml-3 flex-1">
                                            <span className="font-bold text-text-primary block">
                                                {partner.names} {partner.surnames}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {partner.idNumber || 'Sin cédula registrada'} • Socio existente
                                            </span>
                                        </div>
                                        {secondTitularChoice === partner.id && (
                                            <span className="text-xs bg-sbs-blue text-white px-2 py-1 rounded-full font-bold">
                                                Seleccionado
                                            </span>
                                        )}
                                    </label>
                                ))}
                                
                                {/* Opción: Nueva persona */}
                                <label 
                                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        secondTitularChoice === 'new' 
                                            ? 'border-sbs-blue bg-blue-50' 
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <input 
                                        type="radio" 
                                        name="secondTitularChoice"
                                        checked={secondTitularChoice === 'new'}
                                        onChange={() => setSecondTitularChoice('new')}
                                        className="w-4 h-4 text-sbs-blue border-gray-300 focus:ring-sbs-blue"
                                    />
                                    <div className="ml-3 flex-1">
                                        <span className="font-bold text-text-primary block">
                                            Otra persona (nuevo titular)
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Agregar un titular que no está en la lista de socios. Se creará como nuevo socio.
                                        </span>
                                    </div>
                                </label>
                            </div>
                            
                            <div className="flex justify-end mt-4 pt-4 border-t border-amber-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSecondTitularSelector(false);
                                        setSecondTitularChoice(null);
                                        // Revertir a un solo socio si cancela
                                        updateFormData({ nameOwnership: 'Un solo socio' });
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 mr-3"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={secondTitularChoice === null}
                                    onClick={() => secondTitularChoice !== null && handleSecondTitularSelection(secondTitularChoice)}
                                    className="px-8 py-3 bg-sbs-blue text-white text-sm font-bold rounded-full shadow-lg hover:shadow-glow-blue hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    Confirmar Selección
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Objeto Social (Actividad) <Tooltip text="Describe a qué se dedicará la empresa. Nuestra IA puede ayudarte a redactarlo formalmente." /></label>
                        <textarea 
                            name="socialObject"
                            value={formData.socialObject}
                            onChange={(e) => updateFormData({ socialObject: e.target.value })}
                            onBlur={handleBlur}
                            rows={3}
                            className={`${inputClass} leading-relaxed ${isError('socialObject') ? 'border-red-300 bg-red-50' : ''}`}
                            placeholder="Ej: Compra y venta de materiales de construcción, servicios de ingeniería..."
                        />
                         {isError('socialObject') && <p className="text-red-500 text-xs mt-1 font-bold">{errors.socialObject}</p>}
                         <button 
                            onClick={handleImproveWithAI} 
                            disabled={isLoadingAI || !formData.socialObject.trim()} 
                            className={`text-sbs-blue text-xs font-bold mt-3 transition-colors flex items-center gap-2 px-2 py-1 rounded-md hover:bg-blue-50 w-fit ${(!formData.socialObject.trim() || isLoadingAI) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                         >
                            {isLoadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isLoadingAI ? 'Optimizando con IA...' : 'Mejorar redacción con IA'}
                        </button>
                    </div>
                    
                    <div className="bg-premium-surface-subtle p-8 rounded-2xl border border-premium-border">
                        <h4 className="text-xs font-bold text-text-tertiary mb-6 uppercase tracking-widest">Domicilio Social (Dirección Empresa)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <input name="companyStreet" placeholder="Calle / Avenida" value={formData.companyStreet} onChange={handleAddressChange} onBlur={handleBlur} className={`${inputClass} ${isError('companyStreet') ? 'border-red-300' : ''}`} />
                            </div>
                            <input name="companyStreetNumber" placeholder="Número" value={formData.companyStreetNumber} onChange={handleAddressChange} onBlur={handleBlur} className={`${inputClass} ${isError('companyStreetNumber') ? 'border-red-300' : ''}`} />
                            <input name="companyBuilding" placeholder="Edificio / Plaza / Residencial" value={formData.companyBuilding || ''} onChange={handleAddressChange} className={inputClass} />
                            <input name="companySuite" placeholder="Local # / Apto #" value={formData.companySuite} onChange={handleAddressChange} className={inputClass} />
                            <input name="companySector" placeholder="Sector / Barrio" value={formData.companySector} onChange={handleAddressChange} onBlur={handleBlur} className={`${inputClass} ${isError('companySector') ? 'border-red-300' : ''}`} />
                            
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <select name="companyProvince" value={formData.companyProvince} onChange={handleAddressChange} onBlur={handleBlur} className={`${inputClass} ${isError('companyProvince') ? 'border-red-300' : ''}`}>
                                    <option value="">Seleccionar Provincia...</option>
                                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                
                                {availableMunicipalities.length > 0 ? (
                                    <select name="companyCity" value={formData.companyCity} onChange={handleAddressChange} onBlur={handleBlur} className={`${inputClass} ${isError('companyCity') ? 'border-red-300' : ''}`}>
                                        <option value="">Seleccionar Municipio...</option>
                                        {availableMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                ) : (
                                    <input name="companyCity" placeholder="Municipio / Ciudad" value={formData.companyCity} onChange={handleAddressChange} onBlur={handleBlur} className={`${inputClass} ${isError('companyCity') ? 'border-red-300' : ''}`} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Datos del Solicitante */}
            <section className={sectionClass}>
                <h3 className="text-2xl font-bold text-sbs-blue mb-8 flex items-center">
                    <span className="bg-premium-surface-subtle text-sbs-blue rounded-xl w-10 h-10 flex items-center justify-center text-sm mr-4 font-extrabold border border-premium-border">2</span>
                    Datos del Solicitante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Nombres</label>
                        <input name="names" value={formData.applicant.names} onChange={handleApplicantChange} onBlur={handleBlur} className={`${inputClass} ${isError('appNames') ? 'border-red-300 bg-red-50' : ''}`} />
                        {isError('appNames') && <p className="text-red-500 text-xs mt-1 font-bold">{errors.appNames}</p>}
                    </div>
                    <div>
                         <label className={labelClass}>Apellidos</label>
                         <input name="surnames" value={formData.applicant.surnames} onChange={handleApplicantChange} onBlur={handleBlur} className={`${inputClass} ${isError('appSurnames') ? 'border-red-300 bg-red-50' : ''}`} />
                         {isError('appSurnames') && <p className="text-red-500 text-xs mt-1 font-bold">{errors.appSurnames}</p>}
                    </div>
                    <div>
                         <label className={labelClass}>Email</label>
                         <input name="email" type="email" value={formData.applicant.email} onChange={handleApplicantChange} onBlur={handleBlur} className={`${inputClass} ${isError('appEmail') ? 'border-red-300 bg-red-50' : ''}`} />
                         {isError('appEmail') && <p className="text-red-500 text-xs mt-1 font-bold">{errors.appEmail}</p>}
                    </div>
                    <div>
                         <label className={labelClass}>Teléfono Móvil (Soporte Int.)</label>
                         <input 
                            name="phone" 
                            value={formData.applicant.phone} 
                            onChange={handleApplicantChange} 
                            onBlur={handleBlur}
                            className={`${inputClass} ${isError('appPhone') ? 'border-red-300 bg-red-50' : ''}`} 
                            placeholder="+1 (809) 000-0000" 
                            maxLength={20} 
                        />
                         {isError('appPhone') && <p className="text-red-500 text-xs mt-1 font-bold">{errors.appPhone}</p>}
                    </div>
                </div>
                
                {formData.hasRegisteredName === 'No' && (
                <div className="mt-8">
                    <label className={`flex items-center space-x-4 cursor-pointer group p-4 rounded-xl border transition-all w-full md:w-fit ${formData.applicant.isTitular ? 'bg-blue-50 border-sbs-blue shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${formData.applicant.isTitular ? 'bg-sbs-blue border-sbs-blue' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                            {formData.applicant.isTitular && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                        </div>
                        <input type="checkbox" name="isTitular" checked={formData.applicant.isTitular} onChange={handleApplicantChange} className="hidden" />
                        <div>
                            <span className={`font-bold text-sm block ${formData.applicant.isTitular ? 'text-sbs-blue' : 'text-text-primary'}`}>
                                {formData.companyType === 'EIRL' 
                                    ? '¿Soy el titular de la empresa a registrar?' 
                                    : '¿Soy un socio del nombre comercial?'}
                            </span>
                            <span className="text-xs text-gray-500">Si marcas esto, tus datos se copiarán automáticamente.</span>
                        </div>
                    </label>
                </div>
                )}
            </section>

            {/* 3. Titulares ONAPI (SOLO VISIBLE SI NO TIENE NOMBRE REGISTRADO) */}
            {formData.hasRegisteredName === 'No' && (
            <section className={sectionClass}>
                <div className="flex justify-between items-center mb-8">
                     <h3 className="text-2xl font-bold text-sbs-blue flex items-center">
                        <span className="bg-premium-surface-subtle text-sbs-blue rounded-xl w-10 h-10 flex items-center justify-center text-sm mr-4 font-extrabold border border-premium-border">3</span>
                        {formData.companyType === 'EIRL' ? 'Titular (ONAPI)' : 'Titulares (ONAPI)'}
                    </h3>
                </div>
                
                <div className="space-y-6">
                    {formData.titulars.map((t, i) => {
                        const isHiddenBecauseApplicant = formData.applicant.isTitular && i === 0;
                        const errName = `titular_${i}_names`;
                        const errSur = `titular_${i}_surnames`;
                        const errId = `titular_${i}_id`;
                        const errFront = `titular_${i}_front`;
                        const errBack = `titular_${i}_back`;

                        return (
                        <div key={t.id} className={`bg-premium-surface-subtle p-8 rounded-2xl border border-premium-border relative transition-all hover:border-gray-200 ${isHiddenBecauseApplicant ? 'bg-blue-50/30' : ''}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">{`Titular ${i + 1}`}</h4>
                                {isHiddenBecauseApplicant && <span className="text-[10px] bg-sbs-blue text-white px-3 py-1 rounded-full font-bold shadow-sm flex items-center"><User className="w-3 h-3 mr-1" /> Datos del Solicitante</span>}
                            </div>

                            <div className="animate-fade-in-up">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div className={isHiddenBecauseApplicant ? 'opacity-70 pointer-events-none' : ''}>
                                        <input placeholder="Nombres" value={t.names} onChange={(e) => handleTitularChange(i, 'names', e.target.value)} onBlur={(e) => handleTitularBlur(i, 'names', e.target.value)} className={`${inputClass} ${isError(errName) ? 'border-red-300 bg-red-50' : ''}`} />
                                    </div>
                                    <div className={isHiddenBecauseApplicant ? 'opacity-70 pointer-events-none' : ''}>
                                        <input placeholder="Apellidos" value={t.surnames} onChange={(e) => handleTitularChange(i, 'surnames', e.target.value)} onBlur={(e) => handleTitularBlur(i, 'surnames', e.target.value)} className={`${inputClass} ${isError(errSur) ? 'border-red-300 bg-red-50' : ''}`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-5 mb-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center">
                                                Documento <Tooltip text="Cédula o Pasaporte" />
                                            </label>
                                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => { handleTitularChange(i, 'documentType', 'Cédula'); handleTitularChange(i, 'idNumber', ''); }}
                                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${t.documentType === 'Cédula' ? 'bg-white text-sbs-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    Cédula
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { handleTitularChange(i, 'documentType', 'Pasaporte'); handleTitularChange(i, 'idNumber', ''); }}
                                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${t.documentType === 'Pasaporte' ? 'bg-white text-sbs-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    Pasaporte
                                                </button>
                                            </div>
                                        </div>
                                        <input 
                                            placeholder={t.documentType === 'Cédula' ? "XXX-XXXXXXX-X" : "Número de Pasaporte"} 
                                            value={t.idNumber} 
                                            onChange={(e) => handleTitularChange(i, 'idNumber', e.target.value)} 
                                            onBlur={(e) => handleTitularBlur(i, 'idNumber', e.target.value)}
                                            className={`${inputClass} font-mono tracking-wide ${isError(errId) ? 'border-red-300 bg-red-50' : ''}`} 
                                            maxLength={t.documentType === 'Cédula' ? 13 : 20} 
                                        />
                                        {isError(errId) && <p className="text-red-500 text-xs mt-2 font-bold ml-1">{errors[errId]}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Front ID */}
                                <div>
                                    {uploadProgress[`titular_${i}_idFront`] ? (
                                        <UploadProgress progress={uploadProgress[`titular_${i}_idFront`]} />
                                    ) : !t.idFront ? (
                                        <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-white group hover:shadow-lg ${isError(errFront) ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-sbs-blue hover:bg-blue-50/50'}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, `titular_${i}_idFront`, (file) => handleTitularChange(i, 'idFront', file))}
                                        >
                                            <input type="file" className="hidden" accept={ALLOWED_FILE_TYPES} onChange={(e) => e.target.files && handleFileUpload(`titular_${i}_idFront`, e.target.files[0], (file) => handleTitularChange(i, 'idFront', file))} />
                                            <div className="text-center text-gray-400 group-hover:text-sbs-blue transition-colors">
                                                <Camera className="w-10 h-10 mx-auto mb-3" strokeWidth={1.5} />
                                                <span className="text-sm font-bold uppercase tracking-wide block">Arrastra tu ID aquí (Frente)</span>
                                                <span className="text-[10px] opacity-70">o haz click para buscar</span>
                                            </div>
                                        </label>
                                    ) : (
                                        <FilePreview file={t.idFront} onRemove={() => removeFile(i, 'idFront')} />
                                    )}
                                    {isError(errFront) && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{errors[errFront]}</p>}
                                </div>

                                {/* Back ID */}
                                <div>
                                    {uploadProgress[`titular_${i}_idBack`] ? (
                                        <UploadProgress progress={uploadProgress[`titular_${i}_idBack`]} />
                                    ) : !t.idBack ? (
                                        <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-white group hover:shadow-lg ${isError(errBack) ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-sbs-blue hover:bg-blue-50/50'}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, `titular_${i}_idBack`, (file) => handleTitularChange(i, 'idBack', file))}
                                        >
                                            <input type="file" className="hidden" accept={ALLOWED_FILE_TYPES} onChange={(e) => e.target.files && handleFileUpload(`titular_${i}_idBack`, e.target.files[0], (file) => handleTitularChange(i, 'idBack', file))} />
                                            <div className="text-center text-gray-400 group-hover:text-sbs-blue transition-colors">
                                                <Camera className="w-10 h-10 mx-auto mb-3" strokeWidth={1.5} />
                                                <span className="text-sm font-bold uppercase tracking-wide block">Arrastra tu ID aquí (Dorso)</span>
                                                <span className="text-[10px] opacity-70">o haz click para buscar</span>
                                            </div>
                                        </label>
                                    ) : (
                                        <FilePreview file={t.idBack} onRemove={() => removeFile(i, 'idBack')} />
                                    )}
                                     {isError(errBack) && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{errors[errBack]}</p>}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </section>
            )}

            <div className="flex justify-between items-center pt-8">
                <button onClick={prevStep} disabled={isSubmitting} className="px-8 py-4 rounded-full font-bold text-text-tertiary hover:text-sbs-blue transition-colors hover:bg-gray-50 disabled:opacity-50">Atrás</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="px-12 py-5 bg-sbs-blue hover:-translate-y-0.5 hover:shadow-glow-blue text-white rounded-full font-bold shadow-xl transition-all duration-300 tracking-wide text-lg active:scale-95 disabled:opacity-70 disabled:cursor-wait disabled:transform-none">
                    {isSubmitting ? (
                        <span className="flex items-center">
                            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Procesando...
                        </span>
                    ) : (
                        <span>Siguiente Paso &rarr;</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default StepA;
