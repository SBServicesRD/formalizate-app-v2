import React, { useMemo, useState } from 'react';
import { FileText, Lock, Check, Download, Clock, Building, User, LifeBuoy, Send, LogOut, ChevronDown } from 'lucide-react';
import type { SaleRecord } from '../types';
import { formatCurrency } from '../utils/calculations';
import { CommentsPanel } from './CommentsPanel';

interface DashboardPageProps {
  sale: SaleRecord;
  onLogout: () => Promise<void>;
  currentUserUid: string;
}

const resolveDate = (value?: unknown): string => {
  if (!value) return '-';
  try {
    const date = typeof (value as { toDate?: () => Date }).toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : new Date(String(value));
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-DO');
  } catch {
    return '-';
  }
};

const deriveStageIndex = (sale: SaleRecord) => {
  const status = (sale.status || '').toLowerCase();
  const paymentStatus = (sale.paymentStatus || '').toLowerCase();

  if (status.includes('rnc') || status.includes('complet')) return 5;
  if (status.includes('mercantil')) return 4;
  if (status.includes('estatuto')) return 3;
  if (status.includes('onapi')) return 2;
  if (paymentStatus === 'paid') return 2;
  if (paymentStatus === 'pending_confirmation') return 1;
  return 0;
};

const DashboardPage: React.FC<DashboardPageProps> = ({ sale, onLogout, currentUserUid }) => {
  const companyName = sale.companyName || 'Nueva Empresa S.R.L.';
  const applicantName = sale.applicant?.names || 'Cliente';
  const applicantEmail = sale.applicant?.email || sale.userEmail || '';
  const currentStageIndex = deriveStageIndex(sale);

  const timelineSteps = useMemo(() => {
    const createdAt = resolveDate(sale.fecha || sale.createdAt || sale.requestDate);
    return [
      { title: 'Inicio del Expediente', date: createdAt, desc: 'Solicitud creada y datos capturados en sistema.' },
      { title: 'Validación Financiera', date: currentStageIndex >= 1 ? createdAt : 'En proceso...', desc: 'Conciliación de pago y revisión inicial.' },
      { title: 'Gestión ONAPI', date: currentStageIndex >= 2 ? 'En proceso...' : '-', desc: 'Análisis de disponibilidad y registro de nombre comercial.' },
      { title: 'Redacción Estatutaria', date: currentStageIndex >= 3 ? 'En proceso...' : '-', desc: 'Generación de estatutos sociales y asamblea constitutiva.' },
      { title: 'Registro Mercantil', date: currentStageIndex >= 4 ? 'En proceso...' : '-', desc: 'Matriculación en la Cámara de Comercio y Producción.' },
      { title: 'Emisión RNC / DGII', date: currentStageIndex >= 5 ? 'En proceso...' : '-', desc: 'Asignación tributaria y habilitación de comprobantes fiscales.' },
    ];
  }, [sale, currentStageIndex]);

  const documents = [
    { name: 'Comprobante de Pago', type: 'PDF', url: sale.paymentReceipt || '', status: sale.paymentReceipt ? 'ready' : 'locked' },
    { name: 'Certificado ONAPI', type: 'PDF', url: sale.onapiCertificate || '', status: sale.onapiCertificate ? 'ready' : 'locked' },
    { name: 'Estatutos Sociales', type: 'DOCX', url: sale.estatutosUrl || '', status: sale.estatutosUrl ? 'ready' : 'locked' },
    { name: 'Registro Mercantil', type: 'PDF', url: sale.registroMercantilUrl || '', status: sale.registroMercantilUrl ? 'ready' : 'locked' },
    { name: 'Acta de RNC', type: 'PDF', url: sale.rncUrl || '', status: sale.rncUrl ? 'ready' : 'locked' },
  ];

  const totalAmount = sale.totalAmount ?? 0;
  const packageName = sale.packageName || 'Plan formalizado';
  const [copied, setCopied] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-20">
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
              onClick={onLogout}
              className="group flex items-center space-x-2 text-gray-500 hover:text-sbs-red transition-colors"
            >
              <span className="text-xs font-medium hidden sm:block">Cerrar Sesión</span>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-in-up">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-6">
            <div>
              <h2 className="text-3xl font-bold text-sbs-blue mb-1 tracking-tight">Bienvenido, {applicantName}</h2>
              <p className="text-text-secondary font-light">Resumen ejecutivo del proceso de constitución.</p>
            </div>
            <div className="mt-4 md:mt-0 bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-3">ID Expediente</span>
              <span className="font-mono text-sm font-bold text-sbs-blue">{sale.id}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sale.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="ml-3 text-xs font-bold text-sbs-blue"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full filter blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-4">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold text-sbs-blue uppercase tracking-wide">Fase Actual: {timelineSteps[currentStageIndex].title}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Proceso en marcha</h3>
                <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">
                  Nuestro equipo está trabajando en tu expediente. Te notificaremos cada avance importante.
                </p>
              </div>

              <div className="flex-shrink-0 text-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#F1F5F9" strokeWidth="8" fill="none" />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#1D3557"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * ((currentStageIndex + 1) / timelineSteps.length))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold text-sbs-blue">
                    {Math.round(((currentStageIndex + 1) / timelineSteps.length) * 100)}%
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-400 mt-2 uppercase tracking-wider">Progreso Global</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
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
                    <div key={step.title} className="relative pl-10">
                      <div
                        className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-all duration-300 z-10
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

              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-sbs-blue" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">{doc.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{doc.type}</p>
                      </div>
                    </div>
                    {doc.status === 'ready' && doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-sbs-blue flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Bloqueado
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center">
                <span className="w-2 h-2 bg-sbs-blue rounded-full mr-2"></span>
                Resumen del Plan
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-sbs-blue" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Empresa</p>
                    <p className="text-sm font-bold text-gray-800">{companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-sbs-blue" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Solicitante</p>
                    <p className="text-sm font-bold text-gray-800">{applicantName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-sbs-blue" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Plan</p>
                    <p className="text-sm font-bold text-gray-800">{packageName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-sbs-blue" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Monto</p>
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center">
                <span className="w-2 h-2 bg-sbs-blue rounded-full mr-2"></span>
                Comentarios del Cliente
              </h3>
              <CommentsPanel saleId={sale.id} authorUid={currentUserUid} authorLabel={applicantEmail} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <LifeBuoy className="w-6 h-6 text-sbs-blue" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Soporte</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Si necesitas ayuda con tu expediente, responde al correo de confirmación o contacta a nuestro equipo.
              </p>
              <button className="mt-4 w-full text-xs font-bold text-white bg-sbs-blue py-3 rounded-xl flex items-center justify-center gap-2" disabled>
                <Send className="w-4 h-4" />
                Solicitar ayuda
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
