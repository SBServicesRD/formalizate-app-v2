import { useState, useEffect } from 'react';
import type { FormData } from '../../types';
import { validateRequired, formatPhoneNumber, validateEmail, formatDateMask, validateDate, validatePhoneNumber, sanitizeInput } from '../utils/validation';
import { saveFullApplication } from '../services/documentService';

export type Section = 'details' | 'location' | 'powers' | 'fiscal' | 'references';

export const usePostPaymentForm = (
    formData: FormData,
    updateFormData: (data: Partial<FormData>) => void,
    onComplete: () => void,
) => {
    const [activeSection, setActiveSection] = useState<Section>('details');
    const [errors, setErrors] = useState<Record<string, string | Record<string, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);

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
                const newState = { ...prev };
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
                const next = { ...prev };
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
        const newErrors: Record<string, string | Record<string, string>> = {};
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

    return {
        activeSection, setActiveSection,
        errors,
        isSubmitting,
        submissionError,
        handleChange,
        handleCopyApplicant,
        handleNcfToggle,
        validateSection,
        toggleSection,
        nextSection,
        handleFinalSubmit,
    };
};
