import { useState, useEffect, useMemo } from 'react';
import type { FormData, Partner } from '../../types';
import { SHARE_VALUE } from '../../constants';
import { distributeShares } from '../utils/calculations';
import { validateCedula, validateRequired, formatCedula, formatPhoneNumber, validateEmail, sanitizeInput, validatePhoneNumber, validateBirthDate } from '../utils/validation';

export const useStepBForm = (
    formData: FormData,
    updateFormData: (data: Partial<FormData>) => void,
    nextStep: () => void,
) => {
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    const isExternalManager = formData.manager.type === 'Tercero';

    useEffect(() => {
        if (formData.companyType === 'EIRL' && formData.partners.length > 0) {
            const updatedPartners = formData.partners.map((p, idx) => {
                const roles = p.roles || ['Socio'];
                const updatedRoles = roles.includes('Gerente') ? roles : [...roles, 'Gerente'];
                return idx === 0
                    ? { ...p, percentage: 100, shares: Math.floor(formData.socialCapital / SHARE_VALUE), roles: updatedRoles }
                    : p;
            });
            if (JSON.stringify(updatedPartners) !== JSON.stringify(formData.partners)) {
                updateFormData({ partners: updatedPartners });
            }
        }
    }, [formData.companyType, formData.socialCapital]);

    useEffect(() => {
        const isExt = formData.manager.type === 'Tercero';
        if (formData.companyType === 'EIRL' && formData.partners.length > 0 && !formData.digitalSignatureHolderId && !isExt) {
            updateFormData({ digitalSignatureHolderId: formData.partners[0].id });
        }
    }, [formData.companyType, formData.partners, formData.manager.type]);

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

    const toggleManagerMode = (mode: 'Socio' | 'Tercero') => {
        updateFormData({
            manager: {
                ...formData.manager,
                type: mode
            }
        });
    };

    const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valStr = e.target.value.replace(/[^0-9]/g, '');

        if (valStr === '') {
            updateFormData({ socialCapital: 0 });
            return;
        }

        let value = parseInt(valStr, 10);
        if (isNaN(value)) value = 0;

        value = Math.max(0, value);

        updateFormData({ socialCapital: value });

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

                if (field === 'mobilePhone') {
                    finalValue = formatPhoneNumber(value);
                }

                const updatedPartner = { ...p, [field]: finalValue };

                if (field === 'nationality') {
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
                    if (pct < 0) pct = 0;
                    if (pct > 100) pct = 100;
                    updatedPartner.percentage = pct;
                    updatedPartner.shares = distributeShares(formData.socialCapital, pct);
                }
                return updatedPartner;
            }
            return p;
        });

        updateFormData({ partners: updatedPartners });

        if (errors[id] && errors[id][field as string]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                const partnerErrors = { ...newErrors[id] };
                delete partnerErrors[field as string];
                newErrors[id] = partnerErrors;
                return newErrors;
            });
        }
    };

    const toggleRole = (id: number, role: string) => {
        const partner = formData.partners.find(p => p.id === id);
        if (!partner) return;

        let newRoles = [...(partner.roles || [])];

        if (!newRoles.includes('Socio')) newRoles.push('Socio');

        if (newRoles.includes(role)) {
            if (role === 'Socio') return;
            newRoles = newRoles.filter(r => r !== role);
        } else {
            newRoles.push(role);
        }

        handlePartnerChange(id, 'roles', newRoles);
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
        }

        if (field === 'addressStreet' && !validateRequired(value)) error = "Calle requerida";
        if (field === 'addressProvince' && !validateRequired(value)) error = "Provincia/Estado requerido";
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

    const handleBlur = (partnerId: number, field: string, value: string) => {
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

    const addPartner = () => {
        const newPartner: Partner = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            names: '', surnames: '', nationality: 'República Dominicana',
            birthDate: '',
            maritalStatus: 'Soltero(a)', profession: '', documentType: 'Cédula', idNumber: '',
            idFront: null, idBack: null,
            residenceCountry: 'República Dominicana',
            addressStreet: '', addressNumber: '', addressSuite: '', addressSector: '', addressCity: '', addressProvince: '',
            postalCode: '',
            email: '', mobilePhone: '', roles: formData.companyType === 'EIRL' ? ['Socio', 'Gerente'] : ['Socio'], percentage: 0, shares: 0,
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

            if (!p.idFront) pErr.idFront = "Foto Frontal Requerida";

            if (p.documentType !== 'Pasaporte' && !p.idBack) {
                pErr.idBack = "Foto Dorsal Requerida";
            }

            if (Object.keys(pErr).length > 0) {
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
    };

    const totalPercentage = useMemo(() => formData.partners.reduce((sum, p) => sum + (p.percentage || 0), 0), [formData.partners]);

    const scrollToError = () => {
        setTimeout(() => {
            const firstErrorElement = document.querySelector('.border-red-300');
            if (firstErrorElement) {
                firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                const fileError = document.querySelector('.text-red-500');
                if (fileError) fileError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleNext = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (formData.socialCapital < 1000) {
            alert("El capital social debe ser mayor a RD$ 1,000.");
            setIsSubmitting(false);
            return;
        }

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

        const idNumbers = formData.partners.map(p => p.idNumber.trim());
        const uniqueIdNumbers = new Set(idNumbers);
        if (uniqueIdNumbers.size !== idNumbers.length) {
            alert("Existen socios con la misma cédula/pasaporte. Por favor verifica que no haya duplicados.");
            setIsSubmitting(false);
            return;
        }

        if (Math.abs(totalPercentage - 100) > 0.1) {
            alert(`Los porcentajes deben sumar 100%. Actual: ${totalPercentage}%`);
            setIsSubmitting(false);
            return;
        }

        if (!isExternalManager) {
            const hasManager = formData.partners.some(p => p.roles.includes('Gerente'));
            if (!hasManager) {
                alert("Si la administración es por socios, debes seleccionar al menos uno como 'Gerente'.");
                setIsSubmitting(false);
                return;
            }
        }

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

        if (!formData.digitalSignatureHolderId) {
            alert(formData.companyType === 'EIRL' ? "Debes seleccionar un titular como Titular de la Firma Digital." : "Debes seleccionar un socio como Titular de la Firma Digital.");
            setIsSubmitting(false);
            return;
        }

        if (validateAllPartners()) {
            nextStep();
        } else {
            scrollToError();
        }

        setTimeout(() => setIsSubmitting(false), 500);
    };

    const isError = (id: number, field: string) => touched[`${id}_${field}`] && errors[id]?.[field];

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

    return {
        touched,
        errors,
        isSubmitting,
        uploadProgress,
        isExternalManager,
        totalPercentage,
        isError,
        handleFileUpload,
        toggleManagerMode,
        handleCapitalChange,
        handlePartnerChange,
        toggleRole,
        handleBlur,
        validateSingleField,
        addPartner,
        removePartner,
        handleNext,
        handleDragOver,
        handleDrop,
    };
};
