
import React from 'react';
import { FormData } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Clock, Building, User, LifeBuoy, LogOut, ArrowUpRight } from 'lucide-react';

interface DashboardPageProps {
    formData: FormData;
    onExit: () => void;
}

// El seguimiento en vivo y la aprobación de documentos viven en el panel REAL
// (dash.formalizate.app). Este panel del wizard da la bienvenida y puentea hacia él
// — no replica el progreso para evitar mostrar datos congelados/desactualizados.
const DASHBOARD_URL = 'https://dash.formalizate.app';

const DashboardPage: React.FC<DashboardPageProps> = ({ formData, onExit }) => {
    const companyName = formData.companyName || 'Nueva Empresa S.R.L.';
    const isTransferPending = formData.paymentMethod === 'transfer' && formData.paymentStatus === 'pending_confirmation';
    const applicantName = formData.applicant.names;

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans pb-20">
            {/* --- HEADER EJECUTIVO --- */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-sbs-blue rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            {companyName.charAt(0)}
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-sm font-bold text-sbs-blue leading-tight">{companyName}</h1>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Panel de Control</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center space-x-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Sistema Operativo</span>
                        </div>
                        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                        <button
                            onClick={onExit}
                            className="group flex items-center space-x-2 text-gray-500 hover:text-sbs-red transition-colors"
                        >
                            <span className="text-xs font-medium hidden sm:block">Cerrar Sesión</span>
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-in-up">

                {/* --- ACTION CENTER (HERO) --- */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-sbs-blue mb-1 tracking-tight">Bienvenido, {applicantName}</h2>
                            <p className="text-text-secondary font-light">Resumen ejecutivo del proceso de constitución.</p>
                        </div>
                    </div>

                    {/* Estado Actual Card */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-premium relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full filter blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1">
                                <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-4">
                                    <Clock className="w-4 h-4 text-sbs-blue" />
                                    <span className="text-xs font-bold text-sbs-blue uppercase tracking-wide">Expediente en proceso</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {isTransferPending
                                        ? "Validando su comprobante de pago."
                                        : "El equipo legal está procesando su solicitud."}
                                </h3>
                                <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">
                                    {isTransferPending
                                        ? "Nuestro departamento de contabilidad está conciliando la transferencia. Este proceso suele tomar menos de 2 horas laborables."
                                        : "Te notificaremos por correo en cada etapa. El seguimiento en tiempo real y la aprobación de tus documentos están en tu Panel de Expediente."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BENTO GRID LAYOUT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* COLUMNA IZQUIERDA (8/12) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* PUENTE AL PANEL DE EXPEDIENTE EN VIVO */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center">
                                <span className="w-2 h-2 bg-sbs-blue rounded-full mr-2"></span>
                                Tu Panel de Expediente
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                El seguimiento en tiempo real de tu proceso —y la <strong>revisión y aprobación de tus documentos constitutivos</strong>— está en tu Panel de Expediente. Ahí verás cada etapa actualizada, podrás aprobar tus documentos y escribirnos.
                            </p>
                            <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 mb-6">
                                <div className="text-sbs-blue mt-0.5"><Clock className="w-4 h-4" /></div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Te enviamos el <strong>enlace de acceso y tu PIN</strong> al correo registrado. Ábrelo desde el correo o con el botón de aquí abajo (te pedirá tu PIN).
                                </p>
                            </div>
                            <a
                                href={DASHBOARD_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-sbs-blue hover:bg-[#16293f] px-6 py-3 rounded-xl transition-colors shadow-md"
                            >
                                Ir a mi Panel de Expediente
                                <ArrowUpRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA (4/12) - Sidebar */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* FICHA TÉCNICA CORPORATIVA */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Ficha Corporativa</h3>

                            <div className="space-y-5">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Razón Social</p>
                                    <p className="text-sm font-bold text-gray-900 leading-tight">{companyName}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Capital</p>
                                        <p className="text-sm font-medium text-gray-700">{formatCurrency(formData.socialCapital)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Socios</p>
                                        <div className="flex items-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700 ml-1">{formData.partners.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Domicilio</p>
                                    <div className="flex items-start">
                                        <div className="text-gray-400 mt-0.5 mr-2"><Building className="w-5 h-5" /></div>
                                        <p className="text-xs text-gray-600 font-medium leading-snug">
                                            {formData.companyStreet} #{formData.companyStreetNumber}, {formData.companySector}, {formData.companyCity}.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Plan Contratado</p>
                                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-md">
                                        {formData.packageName || 'Essential 360'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SOPORTE LEGAL WIDGET */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group">
                             <div className="flex items-center gap-3 mb-4 relative z-10">
                                 <div className="p-2 bg-blue-50 rounded-lg text-sbs-blue">
                                     <LifeBuoy className="w-6 h-6" />
                                 </div>
                                 <div>
                                     <p className="font-bold text-sm text-gray-900">Asistencia Legal</p>
                                     <p className="text-[10px] text-gray-400 uppercase tracking-wider">Soporte Prioritario</p>
                                 </div>
                             </div>

                             <div className="relative z-10">
                                 <p className="text-xs text-gray-500 leading-relaxed mb-4">
                                     ¿Dudas sobre tu proceso? Escríbenos desde tu Panel de Expediente: tu equipo te responde y queda todo en tu historial.
                                 </p>
                                 <a
                                    href={DASHBOARD_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full text-xs font-bold text-sbs-blue border border-sbs-blue/20 bg-blue-50/60 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-colors"
                                 >
                                     Abrir mi Panel
                                     <ArrowUpRight className="w-3.5 h-3.5" />
                                 </a>
                             </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
