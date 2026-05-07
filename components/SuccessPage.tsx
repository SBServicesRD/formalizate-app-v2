import React from 'react';
import { FormData } from '../types';
import { PACKAGES, PackageName } from '../constants';
import { calculateICCTax, formatCurrency } from '../utils/calculations';
import { CheckCircle2, Mail, ArrowUpRight, KeyRound } from 'lucide-react';

const CUSTOMER_DASHBOARD_URL = 'https://formalizate-dash.web.app';

interface SuccessPageProps {
    formData: FormData;
    /** @deprecated No longer used — kept for backwards compat with App.tsx */
    startOver?: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ formData }) => {
    const packageName = formData.packageName || 'Essential 360';
    const selectedPackage = PACKAGES[packageName as PackageName] || PACKAGES['Essential 360'];
    const constitutionTax = calculateICCTax(formData.socialCapital);
    const totalAmount = selectedPackage.price + constitutionTax;

    const applicantName = formData.applicant
        ? `${formData.applicant.names ?? ''} ${formData.applicant.surnames ?? ''}`.trim()
        : 'N/A';
    const email = formData.applicant?.email ?? '';
    const companyName = formData.companyName ?? '—';

    return (
        <div className="py-8 animate-fade-in-up">

            {/* ── Hero ─────────────────────────────────────────── */}
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-sbs-blue mb-2">
                    ¡Solicitud enviada exitosamente! 🎉
                </h2>
                <p className="text-sbs-gray-600 max-w-2xl mx-auto">
                    Hemos recibido tu expediente y ya comenzamos a trabajar en él.
                    En las próximas 24–48 h un especialista de Formalizate.app se pondrá en contacto contigo.
                </p>
            </div>

            {/* ── Resumen ──────────────────────────────────────── */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-sbs-gray-200 max-w-2xl mx-auto mb-6">
                <h3 className="text-lg font-bold text-sbs-blue mb-4 border-b pb-3">
                    Resumen de tu Solicitud
                </h3>
                <div className="space-y-3 text-sbs-gray-700">
                    <div className="flex justify-between">
                        <span className="font-semibold">Solicitante:</span>
                        <span>{applicantName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Empresa:</span>
                        <span>{companyName}</span>
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
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Impuesto de Constitución:</span>
                            <span>{formatCurrency(constitutionTax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t border-gray-100 pt-3 mt-1">
                        <span className="font-semibold text-lg">Monto Total:</span>
                        <span className="font-bold text-lg text-sbs-blue">
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>

                    {email && (
                        <div className="mt-2 pt-3 border-t border-sbs-gray-100">
                            <p className="text-xs text-sbs-gray-500 mb-1">
                                Enviamos la confirmación a:
                            </p>
                            <p className="font-mono font-bold text-sbs-blue text-sm">{email}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Próximos pasos ───────────────────────────────── */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto mb-8">
                <h3 className="font-bold text-sbs-blue mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 shrink-0" />
                    ¿Cómo accedo a mi expediente?
                </h3>
                <ol className="space-y-4 text-sm text-sbs-gray-700">
                    <li className="flex gap-3">
                        <span className="font-bold text-sbs-blue shrink-0 mt-0.5">1.</span>
                        <span>
                            <strong>Revisa tu correo</strong>
                            {email ? ` (${email})` : ''} —
                            te enviamos un correo con tu <strong>ID de orden</strong>,
                            tu <strong>PIN de acceso de 6 caracteres</strong> y el
                            enlace directo a tu dashboard.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-bold text-sbs-blue shrink-0 mt-0.5">2.</span>
                        <span>
                            Haz clic en <em>«Acceder a mi expediente»</em> dentro del correo.
                            Eso abrirá tu dashboard con la sesión ya iniciada.
                        </span>
                    </li>
                    <li className="flex gap-3 items-start">
                        <span className="font-bold text-sbs-blue shrink-0 mt-0.5">3.</span>
                        <span className="flex items-center gap-2 flex-wrap">
                            <KeyRound className="w-4 h-4 text-sbs-blue shrink-0" />
                            Ingresa tu <strong>PIN</strong> cuando se solicite y podrás
                            ver el avance de tu empresa en tiempo real.
                        </span>
                    </li>
                </ol>
            </div>

            {/* ── CTA ──────────────────────────────────────────── */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
                <a
                    href={CUSTOMER_DASHBOARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-sbs-blue text-white font-bold py-4 px-8 rounded-full shadow-xl hover:shadow-glow-blue hover:-translate-y-0.5 transition-all duration-300 text-base"
                >
                    Ir al Dashboard
                    <ArrowUpRight className="w-4 h-4" />
                </a>
                <p className="text-xs text-gray-400">
                    Necesitas el enlace de tu correo para iniciar sesión automáticamente
                </p>
            </div>

        </div>
    );
};

export default SuccessPage;
