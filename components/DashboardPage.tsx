
import React, { useState } from 'react';
import { FormData } from '../types';
import { formatCurrency } from '../core/utils/calculations';
import { FileText, Lock, Check, Download, Clock, Building, User, LifeBuoy, Send, LogOut, ChevronDown } from 'lucide-react';

interface DashboardPageProps {
    formData: FormData;
    onExit: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ formData, onExit }) => {
    // Estado derivado
    const companyName = formData.companyName || 'Nueva Empresa S.R.L.';
    const isTransferPending = formData.paymentMethod === 'transfer' && formData.paymentStatus === 'pending_confirmation';
    const applicantName = formData.applicant.names;
    
    // Lógica de progreso simulada
    const currentStageIndex = isTransferPending ? 1 : 2; 
    
    const timelineSteps = [
        { title: "Inicio del Expediente", date: new Date().toLocaleDateString(), status: "completed", desc: "Solicitud creada y datos capturados en sistema." },
        { title: "Validación Financiera", date: isTransferPending ? "En proceso..." : new Date().toLocaleDateString(), status: isTransferPending ? "active" : "completed", desc: isTransferPending ? "Auditando comprobante de transferencia." : "Pago conciliado correctamente." },
        { title: "Gestión ONAPI", date: "Estimado: 2-3 días", status: isTransferPending ? "pending" : "active", desc: "Análisis de disponibilidad y registro de nombre comercial." },
        { title: "Redacción Estatutaria", date: "-", status: "pending", desc: "Generación de estatutos sociales y asamblea constitutiva." },
        { title: "Registro Mercantil", date: "-", status: "pending", desc: "Matriculación en la Cámara de Comercio y Producción." },
        { title: "Emisión RNC / DGII", date: "-", status: "pending", desc: "Asignación tributaria y habilitación de comprobantes fiscales." },
    ];

    const documents = [
        { name: "Resumen de Solicitud", type: "PDF", status: "ready", size: "1.2 MB" },
        { name: "Recibo de Transacción", type: "PDF", status: "ready", size: "840 KB" },
        { name: "Certificado ONAPI", type: "PDF", status: "locked", size: "--" },
        { name: "Estatutos Sociales", type: "DOCX", status: "locked", size: "--" },
        { name: "Registro Mercantil", type: "PDF", status: "locked", size: "--" },
        { name: "Acta de RNC", type: "PDF", status: "locked", size: "--" },
    ];

    // Icon Components using Lucide
    const Icons = {
        Document: () => <FileText className="w-5 h-5" />,
        Lock: () => <Lock className="w-4 h-4" />,
        Check: () => <Check className="w-4 h-4" />,
        Download: () => <Download className="w-4 h-4" />,
        Time: () => <Clock className="w-4 h-4" />,
        Building: () => <Building className="w-5 h-5" />,
        User: () => <User className="w-5 h-5" />,
        Support: () => <LifeBuoy className="w-6 h-6" />,
        Send: () => <Send className="w-4 h-4" />,
        Logout: () => <LogOut className="w-5 h-5" />
    };

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
                            <Icons.Logout />
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
                        <div className="mt-4 md:mt-0 bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-3">ID Expediente</span>
                            <span className="font-mono text-sm font-bold text-sbs-blue">SBS-2024-{Math.floor(Math.random() * 9000) + 1000}</span>
                        </div>
                    </div>

                    {/* Estado Actual Card */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-premium relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full filter blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1">
                                <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-4">
                                    <Icons.Time />
                                    <span className="text-xs font-bold text-sbs-blue uppercase tracking-wide">Fase Actual: {timelineSteps[currentStageIndex].title}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {isTransferPending 
                                        ? "Validando su comprobante de pago." 
                                        : "El equipo legal está procesando su solicitud."}
                                </h3>
                                <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">
                                    {isTransferPending 
                                        ? "Nuestro departamento de contabilidad está conciliando la transferencia. Este proceso suele tomar menos de 2 horas laborables." 
                                        : "Hemos iniciado el análisis de viabilidad del nombre comercial en ONAPI. Le notificaremos inmediatamente obtengamos la certificación."}
                                </p>
                            </div>
                            
                            {/* Progress Circle Minimalist */}
                            <div className="flex-shrink-0 text-center">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="#F1F5F9" strokeWidth="8" fill="none" />
                                        <circle cx="48" cy="48" r="40" stroke="#1D3557" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * ((currentStageIndex + 1) / 6))} strokeLinecap="round" />
                                    </svg>
                                    <span className="absolute text-lg font-bold text-sbs-blue">{Math.round(((currentStageIndex + 1) / 6) * 100)}%</span>
                                </div>
                                <p className="text-xs font-medium text-gray-400 mt-2 uppercase tracking-wider">Progreso Global</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BENTO GRID LAYOUT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* COLUMNA IZQUIERDA (8/12) */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* LÍNEA DE TIEMPO */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-8 flex items-center">
                                <span className="w-2 h-2 bg-sbs-blue rounded-full mr-2"></span>
                                Trazabilidad del Proceso
                            </h3>
                            
                            <div className="relative border-l-2 border-gray-100 ml-3 space-y-10 pb-2">
                                {timelineSteps.map((step, index) => {
                                    const isActive = index === currentStageIndex;
                                    const isCompleted = index < currentStageIndex;
                                    const isPending = index > currentStageIndex;

                                    return (
                                        <div key={index} className="relative pl-10">
                                            {/* Dot Indicator */}
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-all duration-300 z-10
                                                ${isCompleted 
                                                    ? 'bg-sbs-blue border-sbs-blue' 
                                                    : isActive 
                                                        ? 'bg-white border-sbs-blue ring-4 ring-blue-50' 
                                                        : 'bg-white border-gray-300'
                                                }`}
                                            >
                                                {isCompleted && (
                                                    <div className="absolute inset-0 flex items-center justify-center text-white">
                                                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`transition-all duration-300 ${isPending ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                                                    <h4 className={`text-sm font-bold ${isActive ? 'text-sbs-blue' : 'text-gray-900'}`}>{step.title}</h4>
                                                    <span className="text-xs font-mono text-gray-400">{step.date}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* BÓVEDA DIGITAL */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                    Documentación Legal
                                </h3>
                                <button disabled className="text-xs font-bold text-sbs-blue hover:underline flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                                    Descargar Todo
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documents.map((doc, idx) => (
                                    <div key={idx} className="group p-4 rounded-xl border transition-all duration-200 bg-gray-50 border-gray-100 opacity-70">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="p-2 rounded-lg bg-gray-200 text-gray-400">
                                                <Icons.Document />
                                            </div>
                                            {doc.status === 'locked' ? (
                                                <Icons.Lock />
                                            ) : (
                                                <Icons.Lock />
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 mb-1 truncate">{doc.name}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{doc.type}</span>
                                            <span className="text-[10px] text-gray-400">{doc.size}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                            <Icons.User />
                                            <span className="text-sm font-medium text-gray-700 ml-1">{formData.partners.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Domicilio</p>
                                    <div className="flex items-start">
                                        <div className="text-gray-400 mt-0.5 mr-2"><Icons.Building /></div>
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

                        {/* SOPORTE LEGAL WIDGET (WHITE THEME) */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group">
                             <div className="flex items-center gap-3 mb-6 relative z-10">
                                 <div className="p-2 bg-blue-50 rounded-lg text-sbs-blue">
                                     <Icons.Support />
                                 </div>
                                 <div>
                                     <p className="font-bold text-sm text-gray-900">Asistencia Legal</p>
                                     <p className="text-[10px] text-gray-400 uppercase tracking-wider">Soporte Prioritario</p>
                                 </div>
                             </div>
                             
                             <div className="relative z-10">
                                 <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Mensaje Directo</label>
                                 <div className="relative">
                                     <textarea 
                                        placeholder="Escriba su consulta..." 
                                        disabled
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 placeholder-gray-400 focus:outline-none transition-all resize-none h-24 disabled:opacity-50 disabled:cursor-not-allowed"
                                     ></textarea>
                                     <button 
                                        disabled
                                        className="absolute bottom-2 right-2 p-1.5 bg-sbs-blue rounded-lg text-white transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                     >
                                         <Icons.Send />
                                     </button>
                                 </div>
                                 <p className="text-[10px] text-gray-400 mt-3 text-center">Tiempo de respuesta promedio: &lt; 2 horas</p>
                             </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
