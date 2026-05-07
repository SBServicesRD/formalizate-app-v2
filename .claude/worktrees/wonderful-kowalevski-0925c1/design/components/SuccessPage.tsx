import React, { useMemo } from 'react';
import { FormData } from '../../types';
import { PACKAGES, PackageName } from '../../constants';
import { calculateICCTax, formatCurrency } from '../../core/utils/calculations';
import { ClipboardCheck } from 'lucide-react';

interface SuccessPageProps {
    formData: FormData;
    startOver: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ formData, startOver }) => {
    const referenceId = useMemo(() => {
        const year = new Date().getFullYear();
        const randomNumber = String(Math.floor(100000 + Math.random() * 900000));
        return `SBS-${year}-${randomNumber.substring(0, 6)}`;
    }, []);

    // Obtener datos del paquete y calcular totales con ICC
    const packageName = formData.packageName || 'Essential 360';
    const selectedPackage = PACKAGES[packageName as PackageName] || PACKAGES['Essential 360'];
    
    const constitutionTax = calculateICCTax(formData.socialCapital);
    const totalAmount = selectedPackage.price + constitutionTax;
    
    const applicantName = formData.applicant ? `${formData.applicant.names} ${formData.applicant.surnames}` : 'N/A';

    return (
        <div className="py-8 animate-fade-in-up">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ClipboardCheck className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-sbs-blue mb-2">¡Tu solicitud fue enviada exitosamente! 🎉</h2>
                <p className="text-sbs-gray-600 max-w-2xl mx-auto">
                    Hemos recibido tu información y comenzaremos el proceso de constitución de tu empresa. En las próximas 24–48 horas un especialista de Formalizate.app se pondrá en contacto contigo.
                </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-sbs-gray-200 max-w-2xl mx-auto">
                <h3 className="text-lg font-bold text-sbs-blue mb-4 border-b pb-3">Resumen de tu Solicitud</h3>
                <div className="space-y-3 text-sbs-gray-700">
                    <div className="flex justify-between">
                        <span className="font-semibold">ID de Referencia:</span>
                        <span className="font-mono font-bold text-sbs-red bg-red-50 px-2 py-1 rounded">{referenceId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Solicitante:</span>
                        <span>{applicantName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Paquete:</span>
                        <span className="font-bold text-sbs-blue">{packageName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Fecha:</span>
                        <span>{new Date().toLocaleDateString('es-DO')}</span>
                    </div>

                    {constitutionTax > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="font-semibold text-gray-600">Impuesto Constitución:</span>
                            <span>{formatCurrency(constitutionTax)}</span>
                        </div>
                    )}

                    <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                        <span className="font-semibold text-lg">Monto Pagado:</span>
                        <span className="font-bold text-lg text-sbs-blue">{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-sbs-gray-100">
                        <p className="text-xs text-sbs-gray-500 mb-1">Hemos enviado un email de confirmación a:</p>
                        <p className="font-mono font-bold text-sbs-blue">{formData.applicant?.email || 'Email no registrado'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                 <button
                    onClick={startOver}
                    className="bg-sbs-blue text-white font-bold py-4 px-8 rounded-full shadow-xl hover:shadow-glow-blue hover:-translate-y-0.5 transition-all duration-300 text-base"
                >
                    Ir al Dashboard →
                </button>
            </div>
        </div>
    );
};

export default SuccessPage;