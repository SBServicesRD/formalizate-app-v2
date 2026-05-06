
import React, { useMemo } from 'react';
import { FormData } from '../types';
import { PACKAGES } from '../constants';
import { calculateICCTax, formatCurrency } from '../core/utils/calculations';
import { Building, Users, User, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface SummaryPageProps {
    formData: FormData;
    nextStep: () => void;
    prevStep: () => void;
}

const SummaryPage: React.FC<SummaryPageProps> = ({ formData, nextStep, prevStep }) => {
    const selectedPackage = formData.packageName ? PACKAGES[formData.packageName] : PACKAGES['Essential 360'];
    const constitutionTax = calculateICCTax(formData.socialCapital);
    const totalAmount = selectedPackage.price + constitutionTax;

    // --- LOGIC FIX: Resolve Managers Data (Plural) from Partners List + External Manager ---
    const activeManagers = useMemo(() => {
        const managers: { name: string; idNumber: string; type: 'socio' | 'externo' }[] = [];
        
        // 1. Si hay Gerente Externo, agregarlo primero
        if (formData.manager.type === 'Tercero' && formData.manager.name) {
            managers.push({
                name: formData.manager.name,
                idNumber: formData.manager.idNumber,
                type: 'externo'
            });
        }
        
        // 2. Agregar socios con rol de Gerente (Gerencia Mixta)
        const partnerManagers = formData.partners.filter(p => p.roles && p.roles.includes('Gerente'));
        partnerManagers.forEach(p => {
            managers.push({
                name: `${p.names} ${p.surnames}`,
                idNumber: p.idNumber,
                type: 'socio'
            });
        });
        
        // 3. Fallback si no hay ningún gerente
        if (managers.length === 0) {
            managers.push({
                name: formData.manager.name || 'No designado',
                idNumber: formData.manager.idNumber || '',
                type: 'externo'
            });
        }
        
        return managers;
    }, [formData.partners, formData.manager]);

    // Obtener el Titular de la Firma Digital (soporta gerente externo con id = -1)
    const digitalSignatureHolder = useMemo(() => {
        if (!formData.digitalSignatureHolderId) return null;
        if (formData.digitalSignatureHolderId === -1) {
            // Es el gerente externo
            return { names: formData.manager.name, surnames: '', idNumber: formData.manager.idNumber, isExternal: true };
        }
        const partner = formData.partners.find(p => p.id === formData.digitalSignatureHolderId);
        if (!partner) return null;
        return { ...partner, isExternal: false };
    }, [formData.partners, formData.digitalSignatureHolderId, formData.manager]);

    const SectionHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
        <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-sbs-blue flex items-center justify-center mr-3 shadow-sm">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-sbs-blue tracking-tight">{title}</h3>
        </div>
    );

    const DataField = ({ label, value, fullWidth = false }: { label: string, value: string | number | undefined, fullWidth?: boolean }) => (
        <div className={`${fullWidth ? 'col-span-2' : 'col-span-1'} mb-4`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-semibold text-gray-800 break-words leading-snug">
                {value || <span className="text-gray-300 italic">No especificado</span>}
            </p>
        </div>
    );

    return (
        <div className="animate-fade-in-up pb-12">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-sbs-blue mb-3">Revisión del Expediente</h2>
                <p className="text-text-secondary text-sm font-light max-w-lg mx-auto">
                    Verifica que todos los datos legales sean correctos antes de proceder a la activación del servicio.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                
                {/* COLUMNA IZQUIERDA: DATOS (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Identidad Corporativa */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-premium-border relative overflow-hidden group hover:border-blue-100 transition-colors">
                        <SectionHeader 
                            title="Identidad Corporativa" 
                            icon={<Building className="w-5 h-5" />}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <DataField label="Nombre Comercial" value={formData.companyName} fullWidth />
                            <DataField label="Tipo Societario" value={formData.companyType} />
                            <DataField label="Capital Social" value={formatCurrency(formData.socialCapital)} />
                            <DataField label="Objeto Social" value={formData.socialObject} fullWidth />
                        </div>
                    </div>


                    {/* 2. Estructura Administrativa */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-premium-border relative overflow-hidden group hover:border-blue-100 transition-colors">
                        <SectionHeader 
                            title={formData.companyType === 'EIRL' ? "Administración y Titular" : "Administración y Socios"}
                            icon={<Users className="w-5 h-5" />}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            {/* Dynamic list of Managers (including External + Partners) */}
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cuerpo Gerencial</p>
                                <div className="space-y-3">
                                    {activeManagers.map((mgr, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm bg-blue-50/50 p-3 rounded-xl border border-blue-50">
                                            <div>
                                                <span className="font-bold text-sbs-blue block">{mgr.name}</span>
                                                <span className="text-xs text-gray-500 font-mono">{mgr.idNumber}</span>
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                                                mgr.type === 'externo' 
                                                    ? 'bg-amber-500 text-white' 
                                                    : 'bg-sbs-blue text-white'
                                            }`}>
                                                {mgr.type === 'externo' ? 'GERENTE EXTERNO' : 'GERENTE'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Titular de Firma Digital */}
                            {digitalSignatureHolder && (
                                <div className="col-span-2 mt-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Titular Firma Digital</p>
                                    <div className="flex justify-between items-center text-sm bg-green-50 p-3 rounded-xl border border-green-100">
                                        <div>
                                            <span className="font-bold text-green-700 block">
                                                {digitalSignatureHolder.names}{digitalSignatureHolder.surnames ? ` ${digitalSignatureHolder.surnames}` : ''}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">{digitalSignatureHolder.idNumber}</span>
                                        </div>
                                        <span className="text-[10px] bg-green-600 text-white px-2 py-1 rounded font-bold">
                                            {(digitalSignatureHolder as any).isExternal ? 'GERENTE EXTERNO' : 'FIRMA DIGITAL'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            <DataField label="Duración Gerencia" value={`${formData.managementDuration} Años`} />
                            
                            <div className="col-span-2 mt-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    {formData.companyType === 'EIRL' ? 'Información del Titular' : 'Composición Accionaria'}
                                </p>
                                <div className="space-y-2">
                                    {formData.partners.map((p, i) => (
                                        <div key={p.id} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-xl">
                                            <span className="font-medium text-gray-700">{p.names} {p.surnames}</span>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-gray-500">{p.shares} cuotas</span>
                                                <span className="font-bold text-sbs-blue bg-blue-100 px-2 py-1 rounded-md">{p.percentage}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Solicitante */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-premium-border relative overflow-hidden group hover:border-blue-100 transition-colors">
                        <SectionHeader 
                            title="Datos de Contacto" 
                            icon={<User className="w-5 h-5" />}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <DataField label="Solicitante" value={`${formData.applicant.names} ${formData.applicant.surnames}`} />
                            <DataField label="Teléfono" value={formData.applicant.phone} />
                            <DataField label="Correo Electrónico" value={formData.applicant.email} fullWidth />
                        </div>
                    </div>

                </div>

                {/* COLUMNA DERECHA: RESUMEN FINANCIERO (Sticky) */}
                {/* --- DESIGN UPDATE: Clean Digital Invoice Look --- */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <div className="bg-white border border-gray-200 text-gray-900 p-8 rounded-[2rem] shadow-premium relative overflow-hidden">
                            {/* Header Invoice Style */}
                            <div className="border-b border-gray-100 pb-6 mb-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</p>
                                <h3 className="text-3xl font-extrabold text-sbs-blue tracking-tight">{formatCurrency(totalAmount)}</h3>
                                <p className="text-xs text-green-600 font-medium mt-2 flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Impuestos incluidos
                                </p>
                            </div>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-medium">{formData.packageName}</span>
                                    <span className="font-bold text-gray-900">{selectedPackage?.formattedPrice}</span>
                                </div>
                                
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

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-900">Monto Final</span>
                                    <span className="text-lg font-bold text-sbs-blue">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>

                            {/* Aviso legal: Beneficiarios Finales (Ley 155-17) */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    <strong className="text-gray-600">Aviso legal:</strong> En cumplimiento de la Ley No. 155-17, la información de socios y beneficiarios finales proporcionada podrá ser utilizada para verificaciones de debida diligencia y, cuando la ley lo exija, reportada a las autoridades competentes. Formalizate.app podrá solicitar documentación adicional si fuese necesario.
                                </p>
                            </div>

                            <button 
                                onClick={nextStep} 
                                className="w-full py-5 bg-sbs-blue text-white font-bold rounded-full shadow-xl hover:shadow-glow-blue hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-center"
                            >
                                Proceder al Pago
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>

                            <button 
                                onClick={prevStep}
                                className="w-full mt-4 text-xs text-gray-400 hover:text-sbs-blue transition-colors underline decoration-gray-200 hover:decoration-sbs-blue"
                            >
                                Volver y editar datos
                            </button>
                        </div>

                        {/* Trust Badge Simple */}
                        <div className="mt-6 flex items-center justify-center space-x-2 text-gray-400 opacity-80">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Garantía de Satisfacción</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SummaryPage;