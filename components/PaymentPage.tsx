
import React, { useState, useEffect } from 'react';
import { FormData } from '../types';
import { PACKAGES, ALLOWED_FILE_TYPES, ORPHAN_SALE_KEY } from '../constants';
import { calculateICCTax, formatCurrency } from '../utils/calculations';
import { Check, CheckCircle, Landmark, CreditCard, ChevronDown, X, Building, Upload, Trash2, Loader2, ChevronLeft } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// PayPal Configuration - Desde variable de entorno
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

interface PaymentPageProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onPaymentSuccess: () => void;
    prevStep: () => void;
}

type PaymentMethod = 'azul' | 'gpay' | 'paypal' | 'transfer';

// Datos bancarios simplificados (Sin colores de marca)
const bankAccounts = [
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

const PaymentPage: React.FC<PaymentPageProps> = ({ formData, updateFormData, onPaymentSuccess, prevStep }) => {
    const [isPaying, setIsPaying] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
    
    // Modal & Copy Logic
    const [showBankModal, setShowBankModal] = useState(false);
    const [selectedBankIndex, setSelectedBankIndex] = useState<number | null>(null);
    const [voucherFile, setVoucherFile] = useState<File | null>(null);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    
    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);
    
    // Estado para expandir lista de beneficios
    const [showAllFeatures, setShowAllFeatures] = useState(true);
    
    // Estado para la tasa de cambio dinámica
    const [exchangeRate, setExchangeRate] = useState<number>(0);
    const [isLoadingRate, setIsLoadingRate] = useState<boolean>(true);

    const SAFE_FALLBACK_RATE = 60.00; // Critical Fallback to prevent Div by Zero

    // Obtener detalles del paquete seleccionado
    const selectedPackageName = formData.packageName || 'Essential 360';
    const packageDetails = PACKAGES[selectedPackageName];
    
    // Calcular total
    const constitutionTax = calculateICCTax(formData.socialCapital);
    const totalAmount = packageDetails.price + constitutionTax;
    const formattedTotal = formatCurrency(totalAmount);

    // Fetch Live Exchange Rate
    useEffect(() => {
        const fetchRate = async () => {
            try {
                // Usamos una API pública confiable para obtener la tasa real
                const response = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await response.json();
                
                if (data && data.rates && data.rates.DOP) {
                    const rate = data.rates.DOP; 
                    // Validate rate is sane (e.g. not 0)
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

    // FINANCIAL SAFETY: Ensure exchangeRate is strictly > 0 before division
    const safeRate = exchangeRate > 0 ? exchangeRate : SAFE_FALLBACK_RATE;
    const amountInUSD = (totalAmount / safeRate).toFixed(2);

    // PayPal Handlers
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

            // 🔗 VENTA HUÉRFANA: Guardar ID de transacción PayPal para vincular después del login
            localStorage.setItem(ORPHAN_SALE_KEY, details.id);

            onPaymentSuccess();
        } catch {
            setError("Hubo un error al procesar el pago. Por favor contacta soporte.");
        }
    };

    const handlePayPalError = (err: any) => {
        // Robust Error Extraction
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

        // Suppress known noise errors
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
        setCopyFeedback(false); // Reset feedback on change
    };

    const handleCopyDetails = () => {
        if (selectedBankIndex === null) return;
        
        const bank = bankAccounts[selectedBankIndex];
        // SOLO copiar el número de cuenta (sin banco ni tipo)
        navigator.clipboard.writeText(bank.number);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
    }

    // --- DRAG AND DROP HANDLERS ---
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
            setUploadError(null); // Clear previous errors
        }
    };

    const confirmTransfer = async () => {
        if (!voucherFile) {
            setUploadError("Debes subir el comprobante antes de confirmar.");
            return;
        }

        setIsVerifying(true);
        setUploadError(null);
        
        // --- SIMPLIFIED FLOW WITHOUT AI ---
        // Just simulate a brief network request/upload
        setTimeout(() => {
            updateFormData({ 
                paymentMethod: 'transfer',
                paymentStatus: 'pending_confirmation',
                paymentReceipt: voucherFile, // 🔥 CRÍTICO: Persistir el archivo en formData
                transferBankName: selectedBankIndex !== null 
                    ? bankAccounts[selectedBankIndex].name 
                    : undefined,
                totalAmount: totalAmount
            });

            // 🔗 VENTA HUÉRFANA: Generar ID temporal único para transferencias
            const tempSaleId = `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            localStorage.setItem(ORPHAN_SALE_KEY, tempSaleId);

            onPaymentSuccess();
            setShowBankModal(false);
            setIsVerifying(false);
        }, 1500);
    };

    const CheckIcon = () => (
        <Check className="w-4 h-4 text-sbs-blue mr-3 flex-shrink-0" />
    );

    const isBankSelected = selectedBankIndex !== null;

    return (
        <div className="text-center py-12 animate-fade-in-up relative">
            <h2 className="text-3xl font-bold text-sbs-blue mb-4">Activación de Cuenta</h2>
            <p className="text-text-secondary mb-12 max-w-lg mx-auto font-light">Estás a un paso de iniciar la formalización legal.</p>
            
             <div className="bg-white border border-gray-200 text-gray-900 p-10 rounded-[2.5rem] shadow-premium mb-10 max-w-lg w-full text-left relative mx-auto overflow-hidden">
                {/* Visual Consistency: Invoice Style Header */}
                <div className="border-b border-gray-100 pb-6 mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</p>
                    <h3 className="text-4xl font-extrabold text-sbs-blue tracking-tight">{formattedTotal}</h3>
                    <p className="text-xs text-green-600 font-medium mt-2 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Impuestos incluidos
                    </p>
                </div>
                
                <div className="text-sm text-gray-500 mb-8 mt-4 flex items-center bg-gray-50 py-2 rounded-lg px-4 border border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                    Solicitante: <span className="font-semibold ml-1 text-gray-700">{formData.applicant.names} {formData.applicant.surnames}</span>
                </div>

                <div className="space-y-4 mb-8">
                    {/* Package Price Row */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-medium">{selectedPackageName}</span>
                        <span className="font-bold text-gray-900">{packageDetails.formattedPrice}</span>
                    </div>
                    
                    {/* Tax Row */}
                    {constitutionTax > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <div>
                                <span className="text-gray-600 font-medium block">Impuesto Constitución</span>
                                <span className="text-[10px] text-gray-400">1% excedente capital</span>
                            </div>
                            <span className="font-bold text-gray-900">+ {formatCurrency(constitutionTax)}</span>
                        </div>
                    )}
                    
                    <div className="border-t border-dashed border-gray-200 my-4"></div>

                    {/* Features List - Expandable */}
                    <div className="space-y-2">
                        {(showAllFeatures ? packageDetails.features : packageDetails.features.slice(0, 3)).map((feat, i) => {
                            // Agregar "(por 1 año)" a Página Web si no lo tiene ya
                            let displayFeat = feat;
                            if (feat.includes('Página Web') && !feat.includes('año')) {
                                displayFeat = feat + ' (por 1 año)';
                            }
                            return (
                                <div key={i} className="flex items-start animate-fade-in">
                                    <CheckIcon />
                                    <span className="text-text-secondary text-xs font-medium">{displayFeat}</span>
                                </div>
                            );
                        })}
                        {packageDetails.features.length > 3 && (
                            <button 
                                onClick={() => setShowAllFeatures(!showAllFeatures)}
                                className="text-sbs-blue text-xs font-medium ml-5 hover:underline transition-all flex items-center gap-1"
                            >
                                {showAllFeatures ? 'Ver menos' : 'Ver todos los beneficios'}
                                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showAllFeatures ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto mb-8">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 text-left">Selecciona Método de Pago</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => { setPaymentMethod('transfer'); setTermsAccepted(false); setError(''); }}
                        className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${paymentMethod === 'transfer' ? 'border-sbs-blue bg-blue-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                        <div className="w-8 h-8 text-sbs-blue mb-2">
                            <Landmark className="w-full h-full" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Transferencia</span>
                        {paymentMethod === 'transfer' && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-sbs-blue rounded-full"></div>
                        )}
                    </button>

                    <button 
                        onClick={() => { setPaymentMethod('paypal'); setTermsAccepted(false); setError(''); }}
                        className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${paymentMethod === 'paypal' ? 'border-[#003087] bg-blue-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                        <div className="w-8 h-8 mb-2 flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.62 1.091 4.498-.596 5.25-3.096 8.137-7.401 8.137H11.07l-1.406 6.135a.66.66 0 0 1-.65.517l-1.938.24z" fill="#003087"/></svg>
                        </div>
                        <span className="text-sm font-bold text-[#003087]">PayPal</span>
                        {paymentMethod === 'paypal' && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-[#003087] rounded-full"></div>
                        )}
                    </button>

                    <div className="relative p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center opacity-60 cursor-not-allowed">
                        <span className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">Pronto</span>
                        <div className="w-8 h-8 mb-2 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-gray-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-400">AZUL / Tarjeta</span>
                    </div>

                     <div className="relative p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center opacity-60 cursor-not-allowed">
                        <span className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">Pronto</span>
                        <div className="w-8 h-8 mb-2 flex items-center justify-center">
                             <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
                        </div>
                        <span className="text-sm font-bold text-gray-400">Google Pay</span>
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 mb-4 font-bold bg-red-50 p-3 rounded-lg inline-block">{error}</p>}

            <div className="mb-8 flex justify-center px-4">
                <label className="flex items-start md:items-center cursor-pointer group text-left">
                    <div className="relative flex items-center mt-0.5 md:mt-0">
                        <input 
                            type="checkbox" 
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white checked:border-sbs-red checked:bg-sbs-red transition-all"
                        />
                         <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                    </div>
                    <span className="ml-3 text-sm text-text-secondary group-hover:text-text-primary transition-colors select-none">
                        He leído y acepto los <span className="font-bold text-sbs-blue underline">Términos y Condiciones</span>, la <span className="font-bold text-sbs-blue underline">Política de Privacidad</span> y la <span className="font-bold text-sbs-blue underline">Política de Reembolso</span>, incluyendo el tratamiento de mis datos personales para la constitución de mi empresa.
                    </span>
                </label>
            </div>

            <div className="flex flex-col items-center gap-6">
                
                {paymentMethod === 'paypal' ? (
                    <div className="w-full max-w-[300px] min-h-[150px]">
                        {!termsAccepted ? (
                             <div className="bg-gray-100 text-gray-500 text-xs p-4 rounded-xl border border-gray-200 font-medium">
                                 Por favor acepta los términos y condiciones arriba para habilitar el botón de pago seguro de PayPal.
                             </div>
                        ) : isLoadingRate ? (
                            <div className="flex flex-col items-center justify-center p-4">
                                <div className="w-6 h-6 border-2 border-sbs-blue border-t-transparent rounded-full animate-spin mb-2"></div>
                                <span className="text-xs text-gray-500">Obteniendo tasa de cambio actual...</span>
                            </div>
                        ) : (
                             <>
                                <PayPalScriptProvider options={{ 
                                    clientId: PAYPAL_CLIENT_ID,
                                    currency: "USD",
                                    intent: "capture"
                                }}>
                                    <PayPalButtons
                                        style={{
                                            shape: 'rect',
                                            color: 'blue',
                                            layout: 'vertical',
                                            label: 'pay',
                                        }}
                                        createOrder={handlePayPalCreateOrder}
                                        onApprove={handlePayPalApprove}
                                        onError={handlePayPalError}
                                        onCancel={handlePayPalCancel}
                                        disabled={!termsAccepted || parseFloat(amountInUSD) <= 0}
                                    />
                                </PayPalScriptProvider>
                                <p className="text-[10px] text-gray-400 mt-2 flex flex-col items-center">
                                    <span>*Tasa de mercado aplicada: <strong className="text-gray-600">RD$ {safeRate.toFixed(2)} / USD</strong></span>
                                    <span>Total a procesar: <strong className="text-gray-600">${amountInUSD} USD</strong></span>
                                </p>
                             </>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={handlePaymentClick}
                        disabled={isPaying || !termsAccepted}
                        className={`font-bold py-6 px-20 rounded-full text-xl transition-all duration-300 transform shadow-xl flex items-center justify-center min-w-[300px]
                            ${termsAccepted 
                                ? 'bg-red-gradient text-white hover:shadow-glow-red hover:-translate-y-0.5 cursor-pointer' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            }
                            ${isPaying ? 'opacity-70 cursor-wait' : ''}
                        `}
                    >
                        Pagar {formattedTotal}
                    </button>
                )}

                <button onClick={prevStep} className="text-gray-400 hover:text-sbs-blue font-medium transition-colors text-sm flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Volver y editar datos
                </button>
            </div>
            
            <div className="mt-12 flex flex-col items-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-bold">Transacción Protegida SSL</p>
                <div className="flex items-center space-x-6 opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                    {/* Badge Visa Secure: preparado para versión WebP con fallback PNG actual */}
                    <img 
                        src="https://storage.googleapis.com/pics_html/verified-by-visa-seeklogo.svg" 
                        alt="Verified by Visa" 
                        className="h-10 w-auto"
                        width={120}
                        height={40}
                        loading="lazy"
                        decoding="async"
                    />
                    <div className="flex items-center space-x-2 border-l border-gray-300 pl-6">
                        <img 
                            src="https://storage.googleapis.com/pics_html/Mastercard-logo.svg" 
                            alt="MasterCard" 
                            className="h-8 w-auto" 
                            width={96}
                            height={32}
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-600 leading-none">ID</span>
                            <span className="text-[10px] font-bold text-gray-600 leading-none">Check</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE TRANSFERENCIA BANCARIA - REDISEÑO PAYPAL STYLE (CLEAN INFO PANEL) */}
            {showBankModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Darker Blur Backdrop for Focus */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500" onClick={() => setShowBankModal(false)}></div>
                    
                    {/* Modal Container */}
                    <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                        
                        {/* Elegant Minimal Header */}
                        <div className="bg-white p-6 pt-8 pb-4 text-center relative border-b border-gray-50">
                            <button onClick={() => setShowBankModal(false)} className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                            
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Instrucciones de Pago</p>
                            <h3 className="text-3xl font-bold text-sbs-blue tracking-tight">{formattedTotal}</h3>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-8 bg-white flex-1 overflow-y-auto">
                            
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-sbs-blue uppercase tracking-widest mb-3">Banco de Destino</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                         <Building className="w-5 h-5 text-gray-400 group-focus-within:text-sbs-blue transition-colors" />
                                    </div>
                                    <select 
                                        onChange={handleBankSelect}
                                        value={selectedBankIndex === null ? '' : selectedBankIndex}
                                        className="w-full appearance-none bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 py-4 pl-12 pr-10 rounded-xl leading-tight focus:outline-none focus:border-sbs-blue focus:ring-4 focus:ring-sbs-blue/10 transition-all font-bold cursor-pointer text-sm shadow-sm"
                                    >
                                        <option value="" disabled>Seleccionar Banco...</option>
                                        {bankAccounts.map((bank, idx) => (
                                            <option key={idx} value={idx}>{bank.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* "PayPal Style" Info Panel - Clean, White, Listed */}
                            {selectedBankIndex !== null && (
                                <div 
                                    onClick={handleCopyDetails}
                                    className="animate-fade-in-up bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-sbs-blue hover:shadow-md transition-all cursor-pointer group relative mb-8"
                                >
                                     {/* Header Row */}
                                     <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
                                         <div className="flex items-center">
                                             <div className="w-10 h-10 rounded-full bg-blue-50 text-sbs-blue flex items-center justify-center mr-3">
                                                 <Landmark className="w-5 h-5" />
                                             </div>
                                             <div>
                                                 <p className="font-bold text-gray-800 text-base">{bankAccounts[selectedBankIndex].name}</p>
                                                 <p className="text-xs text-gray-500">{bankAccounts[selectedBankIndex].type}</p>
                                             </div>
                                         </div>
                                         <div className={`text-xs font-bold px-3 py-1 rounded-full transition-colors duration-300 ${copyFeedback ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-sbs-blue'}`}>
                                             {copyFeedback ? "¡Copiado!" : "Copiar"}
                                         </div>
                                     </div>

                                     {/* Account Number Box */}
                                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5 text-center">
                                         <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Número de Cuenta</p>
                                         <p className="font-mono text-2xl font-bold text-sbs-blue tracking-wider">{bankAccounts[selectedBankIndex].number}</p>
                                     </div>

                                     {/* Details List */}
                                     <div className="space-y-3 text-sm">
                                         <div className="flex justify-between items-center">
                                             <span className="text-gray-500">Beneficiario</span>
                                             <span className="font-medium text-gray-800 text-right">{bankAccounts[selectedBankIndex].beneficiary}</span>
                                         </div>
                                         <div className="flex justify-between items-center">
                                             <span className="text-gray-500">Identificación</span>
                                             <span className="font-mono font-medium text-gray-800 text-right bg-gray-50 px-2 py-0.5 rounded">{bankAccounts[selectedBankIndex].legalId}</span>
                                         </div>
                                     </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-6">
                                <label className={`block text-xs font-bold text-sbs-blue uppercase tracking-widest mb-3 text-center ${!isBankSelected ? 'opacity-50' : ''}`}>
                                    Comprobante de Pago
                                </label>
                                
                                {!voucherFile ? (
                                    <label 
                                        className={`flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-2xl transition-all relative overflow-hidden
                                        ${!isBankSelected 
                                            ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                                            : isDragging
                                                ? 'border-sbs-blue bg-blue-50 border-solid scale-[1.02]'
                                                : 'cursor-pointer hover:border-sbs-blue hover:bg-blue-50/20 group bg-gray-50/50'
                                        }`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                                        <div className="relative z-10 flex flex-col items-center text-gray-400 group-hover:text-sbs-blue transition-colors">
                                            <div className={`p-3 bg-white rounded-full shadow-sm mb-2 transition-transform duration-300 ${isBankSelected ? 'group-hover:scale-110' : ''}`}>
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs font-bold">{!isBankSelected ? 'Selecciona un banco primero' : isDragging ? 'Suelta el archivo aquí' : 'Arrastra o haz clic para subir imagen'}</span>
                                        </div>
                                        <input type="file" className="hidden" accept={ALLOWED_FILE_TYPES} disabled={!isBankSelected} onChange={(e) => { setVoucherFile(e.target.files ? e.target.files[0] : null); setUploadError(null); }} />
                                    </label>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-white border border-green-100 rounded-xl shadow-sm relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                                        <div className="flex items-center overflow-hidden pl-2">
                                             <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500 mr-3">
                                                <Check className="w-5 h-5" />
                                             </div>
                                             <div>
                                                 <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-0.5">Archivo Listo</p>
                                                 <span className="text-xs font-bold text-gray-700 truncate max-w-[150px] block">{voucherFile.name}</span>
                                             </div>
                                        </div>
                                        <button onClick={() => setVoucherFile(null)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                {uploadError && <p className="text-red-500 text-xs font-bold mt-2 text-center bg-red-50 p-2 rounded">{uploadError}</p>}

                                <button 
                                    onClick={confirmTransfer}
                                    disabled={!voucherFile || isVerifying}
                                    className={`w-full mt-6 font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center text-sm
                                        ${!voucherFile || isVerifying 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                                            : 'bg-sbs-blue text-white hover:shadow-glow-blue hover:-translate-y-0.5'
                                        }`}
                                >
                                    {isVerifying ? (
                                        <>
                                            <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                                            Procesando...
                                        </>
                                    ) : 'Confirmar Transferencia'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentPage;