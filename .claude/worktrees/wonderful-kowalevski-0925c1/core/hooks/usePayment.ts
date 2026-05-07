import { useState, useEffect } from 'react';
import type { FormData } from '../../types';
import { PACKAGES, ORPHAN_SALE_KEY } from '../../constants';
import { calculateICCTax, formatCurrency } from '../utils/calculations';

export type PaymentMethod = 'azul' | 'gpay' | 'paypal' | 'transfer';

export const bankAccounts = [
    {
        name: 'BanReservas',
        type: 'Cta. Corriente',
        number: '9600492156',
        beneficiary: 'Smart Biz Services S.R.L.',
        legalId: 'RNC: 1-31-68858-6'
    },
    {
        name: 'Banco Popular',
        type: 'Cta. Corriente',
        number: '839077625',
        beneficiary: 'Julio Darwin Mendoza Estrella',
        legalId: 'Cédula: 223-0072682-9'
    },
    {
        name: 'Banco BHD',
        type: 'Cta. Ahorros',
        number: '08490540050',
        beneficiary: 'Julio Darwin Mendoza Estrella',
        legalId: 'Cédula: 223-0072682-9'
    },
    {
        name: 'Asociación Cibao',
        type: 'Cta. Ahorros',
        number: '100270095230',
        beneficiary: 'Julio Darwin Mendoza Estrella',
        legalId: 'Cédula: 223-0072682-9'
    }
];

const SAFE_FALLBACK_RATE = 60.00;

export const usePayment = (
    formData: FormData,
    updateFormData: (data: Partial<FormData>) => void,
    onPaymentSuccess: () => void,
) => {
    const [isPaying, setIsPaying] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');

    const [showBankModal, setShowBankModal] = useState(false);
    const [selectedBankIndex, setSelectedBankIndex] = useState<number | null>(null);
    const [voucherFile, setVoucherFile] = useState<File | null>(null);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [showAllFeatures, setShowAllFeatures] = useState(false);

    const [exchangeRate, setExchangeRate] = useState<number>(0);
    const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                const response = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await response.json();

                if (data && data.rates && data.rates.DOP) {
                    const rate = data.rates.DOP;
                    setExchangeRate(rate > 0 ? rate : SAFE_FALLBACK_RATE);
                } else {
                    throw new Error("No rate data");
                }
            } catch {
                setExchangeRate(SAFE_FALLBACK_RATE);
            } finally {
                setIsLoadingRate(false);
            }
        };

        fetchRate();
    }, []);

    const selectedPackageName = formData.packageName || 'Essential 360';
    const packageDetails = PACKAGES[selectedPackageName];
    const constitutionTax = calculateICCTax(formData.socialCapital);
    const totalAmount = packageDetails.price + constitutionTax;
    const formattedTotal = formatCurrency(totalAmount);

    const safeRate = exchangeRate > 0 ? exchangeRate : SAFE_FALLBACK_RATE;
    const amountInUSD = (totalAmount / safeRate).toFixed(2);

    const isBankSelected = selectedBankIndex !== null;

    const handlePayPalCreateOrder = (data: any, actions: any) => {
        return actions.order.create({
            purchase_units: [{
                description: `Formalizate - ${selectedPackageName}`.substring(0, 100),
                amount: {
                    currency_code: "USD",
                    value: amountInUSD
                }
            }]
        });
    };

    const handlePayPalApprove = async (data: any, actions: any) => {
        try {
            const details = await actions.order.capture();

            updateFormData({
                paymentMethod: 'paypal',
                paymentStatus: 'paid',
                totalAmount: totalAmount
            });

            localStorage.setItem(ORPHAN_SALE_KEY, details.id);

            onPaymentSuccess();
        } catch {
            setError("Hubo un error al procesar el pago. Por favor contacta soporte.");
        }
    };

    const handlePayPalError = (err: any) => {
        let message = "";

        try {
            if (err instanceof Error) {
                message = err.message;
            } else if (typeof err === 'object' && err !== null) {
                message = (err as any).message || (err as any).code || JSON.stringify(err);
            } else {
                message = String(err);
            }
        } catch {
            message = "Unknown error";
        }

        const lowerMsg = message.toLowerCase();

        const ignoredMessages = [
            "paypal_js_sdk_v5_unhandled_exception",
            "script error",
            "[object object]",
            "popup_close",
            "window_closed",
            "failed to load the app"
        ];

        if (message === "[object Object]" || ignoredMessages.some(ignored => lowerMsg.includes(ignored))) {
            return;
        }

        alert("Error de PayPal: " + message + "\n\nPor favor intenta de nuevo o usa Transferencia Bancaria.");
        setError("Hubo un error al procesar el pago con PayPal. Por favor intenta de nuevo o usa Transferencia.");
    };

    const handlePayPalCancel = () => {
        // No mostramos error ya que el usuario canceló intencionalmente
    };

    const handlePaymentClick = () => {
        if (!termsAccepted) return;

        if (paymentMethod === 'transfer') {
            setShowBankModal(true);
        }
    };

    const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const index = parseInt(e.target.value);
        if (isNaN(index)) {
            setSelectedBankIndex(null);
            return;
        }

        setSelectedBankIndex(index);
        setCopyFeedback(false);
    };

    const handleCopyDetails = () => {
        if (selectedBankIndex === null) return;

        const bank = bankAccounts[selectedBankIndex];
        navigator.clipboard.writeText(bank.number);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedBankIndex !== null) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (selectedBankIndex === null) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setVoucherFile(e.dataTransfer.files[0]);
            setUploadError(null);
        }
    };

    const confirmTransfer = async () => {
        if (!voucherFile) {
            setUploadError("Debes subir el comprobante antes de confirmar.");
            return;
        }

        setIsVerifying(true);
        setUploadError(null);

        setTimeout(() => {
            updateFormData({
                paymentMethod: 'transfer',
                paymentStatus: 'pending_confirmation',
                paymentReceipt: voucherFile,
                transferBankName: selectedBankIndex !== null
                    ? bankAccounts[selectedBankIndex].name
                    : undefined,
                totalAmount: totalAmount
            });

            const tempSaleId = `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            localStorage.setItem(ORPHAN_SALE_KEY, tempSaleId);

            onPaymentSuccess();
            setShowBankModal(false);
            setIsVerifying(false);
        }, 1500);
    };

    return {
        isPaying, setIsPaying,
        isVerifying,
        error,
        termsAccepted, setTermsAccepted,
        paymentMethod, setPaymentMethod,
        showBankModal, setShowBankModal,
        selectedBankIndex,
        voucherFile, setVoucherFile,
        copyFeedback,
        uploadError,
        isDragging,
        showAllFeatures, setShowAllFeatures,
        exchangeRate,
        isLoadingRate,
        selectedPackageName,
        packageDetails,
        constitutionTax,
        totalAmount,
        formattedTotal,
        amountInUSD,
        isBankSelected,
        handlePayPalCreateOrder,
        handlePayPalApprove,
        handlePayPalError,
        handlePayPalCancel,
        handlePaymentClick,
        handleBankSelect,
        handleCopyDetails,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        confirmTransfer,
    };
};
