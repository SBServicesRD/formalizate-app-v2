import { TAX_EXEMPTION_LIMIT, TAX_RATE_PER_BLOCK, SHARE_VALUE } from '../../constants';
import { FormData } from '../../types';

export const calculateICCTax = (capital: number): number => {
    if (!capital || capital <= TAX_EXEMPTION_LIMIT) return 0;
    
    const taxableAmount = capital - TAX_EXEMPTION_LIMIT;
    return taxableAmount * 0.01;
};

export const calculateTotalExtraCosts = (formData: FormData): number => {
    return calculateICCTax(formData.socialCapital);
};

export const distributeShares = (capital: number, percentage: number): number => {
    if (!capital) return 0;
    const totalShares = Math.floor(capital / SHARE_VALUE);
    return Math.round(totalShares * (percentage / 100));
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
};
