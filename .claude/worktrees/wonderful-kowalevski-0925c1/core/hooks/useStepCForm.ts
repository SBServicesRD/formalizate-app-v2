import { useState, useMemo } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import type { FormData } from '../../types';
import { validateCedula, validateRequired, formatCedula } from '../utils/validation';

export const useStepCForm = (
    formData: FormData,
    updateFormData: (data: Partial<FormData>) => void,
) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleManagerTypeChange = (type: 'Socio' | 'Tercero') => {
        updateFormData({ manager: { type, name: '', idNumber: '', nationality: 'República Dominicana' } });
        setErrors({});
    };

    const handleSocioManagerChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedPartnerName = e.target.value;
        const partner = formData.partners.find(p => `${p.names} ${p.surnames}` === selectedPartnerName);
        if (partner) {
            updateFormData({ manager: { ...formData.manager, name: `${partner.names} ${partner.surnames}`, idNumber: partner.idNumber } });
        }
    };

    const handleThirdPartyManagerChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        let finalValue = value;
        if (name === 'idNumber') {
            finalValue = formatCedula(value);
        }

        updateFormData({ manager: { ...formData.manager, [name]: finalValue } });

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleThirdPartyBlur = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let error = '';
        if (!validateRequired(value)) {
            error = 'Este campo es requerido.';
        } else if (name === 'idNumber' && !validateCedula(value)) {
            error = 'Formato de cédula inválido.';
        }
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const isFormValid = useMemo(() => {
        const { manager } = formData;
        if (!validateRequired(manager.name)) return false;
        if (!validateRequired(manager.idNumber)) return false;
        if (!validateCedula(manager.idNumber)) return false;
        return true;
    }, [formData.manager]);

    return {
        errors,
        isFormValid,
        handleManagerTypeChange,
        handleSocioManagerChange,
        handleThirdPartyManagerChange,
        handleThirdPartyBlur,
    };
};
