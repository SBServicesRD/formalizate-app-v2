import { useState, useEffect } from 'react';
import type { FormData, Titular, Partner } from '../../types';
import { validateEmail, validateRequired, validateCedula, formatCedula, formatPhoneNumber, sanitizeInput, sanitizeCompanyName, validatePhoneNumber } from '../utils/validation';
import { ALLOWED_FILE_TYPES } from '../../constants';

export const useStepAForm = (
    formData: FormData,
    updateFormData: (data: Partial<FormData>) => void,
    nextStep: () => void,
) => {
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSecondTitularSelector, setShowSecondTitularSelector] = useState(false);
    const [secondTitularChoice, setSecondTitularChoice] = useState<'new' | number | null>(null);

    useEffect(() => {
        if (formData.titulars.length === 0) {
            updateFormData({
                titulars: [{
                    id: Date.now(),
                    names: '',
                    surnames: '',
                    idNumber: '',
                    idFront: null,
                    idBack: null
                }]
            });
        }
        if (!formData.hasRegisteredName) {
            updateFormData({ hasRegisteredName: 'No', nameOwnership: 'Un solo socio' });
        }
    }, []);

    useEffect(() => {
        if (formData.companyType === 'EIRL' && formData.nameOwnership !== 'Un solo socio') {
            updateFormData({ nameOwnership: 'Un solo socio' });
        }
    }, [formData.companyType]);

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

    const validateField = (name: string, value: string) => {
        const newErrors = { ...errors };

        delete newErrors[name];
        delete newErrors[name === 'names' ? 'appNames' : name === 'surnames' ? 'appSurnames' : 'appEmail'];
        if (name === 'phone') delete newErrors['appPhone'];

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

        if (name === 'companyStreet' && !validateRequired(value)) newErrors.companyStreet = 'Calle requerida';
        if (name === 'companySector' && !validateRequired(value)) newErrors.companySector = 'Sector requerido';
        if (name === 'companyCity' && !validateRequired(value)) newErrors.companyCity = 'Ciudad requerida';
        if (name === 'companyProvince' && !validateRequired(value)) newErrors.companyProvince = 'Provincia requerida';

        if (name === 'names' && !validateRequired(value)) newErrors.appNames = 'Nombres requeridos';
        if (name === 'surnames' && !validateRequired(value)) newErrors.appSurnames = 'Apellidos requeridos';
        if (name === 'email' && !validateRequired(value)) newErrors.appEmail = 'Email requerido';

        if (name === 'phone') {
            if (!validateRequired(value)) newErrors.appPhone = 'Teléfono requerido';
            else if (!validatePhoneNumber(value)) newErrors.appPhone = 'Teléfono inválido. Verifica el número.';
        }

        setErrors(newErrors);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

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
                if (name === 'names' || name === 'surnames') updateFormData({ applicant: { ...formData.applicant, [name]: cleanValue } });
            }
        }

        setTouched(prev => ({ ...prev, [name]: true }));
        validateField(name, cleanValue);
    };

    const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        let val: any = type === 'checkbox' ? checked : value;

        if (name === 'phone') val = formatPhoneNumber(val as string);

        const errorKey = name === 'names' ? 'appNames' : name === 'surnames' ? 'appSurnames' : name === 'email' ? 'appEmail' : name === 'phone' ? 'appPhone' : name;
        if (errors[errorKey]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[errorKey];
                return next;
            });
        }

        updateFormData({ applicant: { ...formData.applicant, [name]: val } });
    };

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

        if (formData.companyType === 'EIRL' && newOwnership === 'Dos socios') {
            return;
        }

        let newTitulars = [...formData.titulars];

        if (newOwnership === 'Dos socios' && newTitulars.length < 2) {
            const eligiblePartners = getEligiblePartnersForSecondTitular();

            if (eligiblePartners.length > 0) {
                setShowSecondTitularSelector(true);
                setSecondTitularChoice(null);
                updateFormData({ nameOwnership: newOwnership });
                return;
            } else {
                newTitulars.push({
                    id: Date.now(),
                    names: '', surnames: '', idNumber: '', idFront: null, idBack: null
                });
            }
        } else if (newOwnership === 'Un solo socio' && newTitulars.length > 1) {
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

        if (newTitulars.length > 1) {
            newTitulars = [newTitulars[0]];
        }

        if (choice === 'new') {
            newTitulars.push({
                id: Date.now(),
                names: '', surnames: '', idNumber: '', idFront: null, idBack: null
            });
        } else {
            const selectedPartner = formData.partners.find(p => p.id === choice);
            if (selectedPartner) {
                newTitulars.push({
                    id: selectedPartner.id,
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

        if (field === 'idNumber') {
            value = formatCedula(value);
        }

        newTitulars[index] = { ...newTitulars[index], [field]: value };
        updateFormData({ titulars: newTitulars });

        const errorKey = `titular_${index}_${field === 'idFront' ? 'front' : field === 'idBack' ? 'back' : field === 'idNumber' ? 'id' : field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newState = { ...prev };
                delete newState[errorKey];
                return newState;
            });
        }
    };

    const handleFileUpload = (key: string, file: File, callback: (f: File) => void) => {
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

    const handleTitularBlur = (index: number, field: string, value: string) => {
        let cleanValue = sanitizeInput(value);
        if (cleanValue !== value) {
            handleTitularChange(index, field as keyof Titular, cleanValue);
        }

        setTouched(prev => ({ ...prev, [`titular_${index}_${field}`]: true }));

        const newErrors = { ...errors };
        const errorKey = `titular_${index}_${field === 'idNumber' ? 'id' : field}`;

        if (field === 'idNumber') {
            if (!validateRequired(cleanValue)) newErrors[errorKey] = 'Cédula requerida';
            else if (!validateCedula(cleanValue)) newErrors[errorKey] = 'Formato inválido (XXX-XXXXXXX-X)';
            else delete newErrors[errorKey];
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
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
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

        if (formData.hasRegisteredName === 'No') {
            formData.titulars.forEach((t, i) => {
                if (!validateRequired(t.names)) newErrors[`titular_${i}_names`] = 'Nombre requerido';
                if (!validateRequired(t.surnames)) newErrors[`titular_${i}_surnames`] = 'Apellido requerido';
                if (!validateCedula(t.idNumber)) newErrors[`titular_${i}_id`] = 'Cédula inválida (XXX-XXXXXXX-X)';
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
        setTouched(prev => ({ ...prev, ...allTouched }));

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
                            birthDate: '',
                            maritalStatus: 'Soltero(a)',
                            profession: '',
                            documentType: 'Cédula',
                            residenceCountry: 'República Dominicana',
                            addressStreet: '', addressNumber: '', addressSector: '', addressCity: '', addressProvince: '',
                            postalCode: '',
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
                        idNumber: '',
                        idFront: null,
                        idBack: null,
                        nationality: 'República Dominicana',
                        birthDate: '',
                        maritalStatus: 'Soltero(a)',
                        profession: '',
                        documentType: 'Cédula',
                        residenceCountry: 'República Dominicana',
                        addressStreet: '', addressNumber: '', addressSector: '', addressCity: '', addressProvince: '',
                        postalCode: '',
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

    return {
        isLoadingAI,
        isSubmitting,
        uploadProgress,
        touched,
        errors,
        showSecondTitularSelector, setShowSecondTitularSelector,
        secondTitularChoice, setSecondTitularChoice,
        isError,
        handleBlur,
        validateField,
        handleApplicantChange,
        getEligiblePartnersForSecondTitular,
        handleOwnershipChange,
        handleSecondTitularSelection,
        handleTitularChange,
        handleFileUpload,
        handleTitularBlur,
        removeFile,
        handleAddressChange,
        handleDragOver,
        handleDrop,
        handleImproveWithAI,
        handleSubmit,
    };
};
