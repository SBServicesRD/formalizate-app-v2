
import React from 'react';
import { FormData, MaritalStatus } from '../types';
import { PROVINCES, MUNICIPALITIES, COUNTRIES, INTERNATIONAL_REGIONS, ALLOWED_FILE_TYPES, PACKAGES, POSTAL_CODE_CONFIG } from '../constants';
import { calculateICCTax, formatCurrency } from '../core/utils/calculations';
import { formatDateMask } from '../core/utils/validation';
import { useStepBForm } from '../core/hooks/useStepBForm';
import { HelpCircle, Check, Trash2, ChevronDown, Image, IdCard, FileSignature } from 'lucide-react';

interface StepBProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    nextStep: () => void;
    prevStep: () => void;
}

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2 align-middle">
        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help hover:text-sbs-blue transition-colors" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-sbs-blue text-white text-xs rounded-lg p-3 shadow-xl z-20 text-center leading-relaxed">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-sbs-blue rotate-45"></div>
        </div>
    </div>
);

// Reuse FilePreview component for consistency
const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl w-full animate-fade-in-up shadow-sm group hover:shadow-md transition-all">
        <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mr-3">
                <Check className="w-4 h-4" strokeWidth={3} />
            </div>
            <div>
                <p className="text-[9px] text-green-700 font-bold uppercase mb-0.5 tracking-wider">Cargado</p>
                <p className="text-xs text-text-primary font-bold truncate mr-2 max-w-[100px]">{file.name}</p>
            </div>
        </div>
        <button onClick={(e) => { e.preventDefault(); onRemove(); }} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Eliminar archivo">
            <Trash2 className="w-4 h-4" />
        </button>
    </div>
);

const UploadProgress = ({ progress }: { progress: number }) => (
    <div className="h-32 w-full border-2 border-solid border-sbs-blue bg-blue-50 rounded-xl flex flex-col items-center justify-center px-6">
        <div className="w-full bg-blue-200 rounded-full h-1.5 mb-2">
            <div className="bg-sbs-blue h-1.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-[10px] font-bold text-sbs-blue uppercase">Subiendo... {Math.round(progress)}%</span>
    </div>
);

const StepB: React.FC<StepBProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
    const {
        touched, errors, isSubmitting, uploadProgress,
        isExternalManager, totalPercentage, isError,
        handleFileUpload, toggleManagerMode, handleCapitalChange,
        handlePartnerChange, toggleRole, handleBlur, validateSingleField,
        addPartner, removePartner, handleNext, handleDragOver, handleDrop,
    } = useStepBForm(formData, updateFormData, nextStep);

    const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-text-primary placeholder-gray-400 focus:outline-none focus:border-sbs-blue focus:ring-4 focus:ring-sbs-blue/10 transition-all duration-300 shadow-sm text-base font-medium";

    const currentPackage = formData.packageName ? PACKAGES[formData.packageName] : PACKAGES['Essential 360'];
    const estimatedTax = calculateICCTax(formData.socialCapital);
    const estimatedTotal = currentPackage.price + estimatedTax;

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-sbs-blue mb-6">{formData.companyType === 'EIRL' ? 'Paso 2: Titular y Capital' : 'Paso 2: Socios y Capital'}</h2>
            
            {/* --- AVISO DEPÃ“SITO BANCARIO PARA EIRL --- */}
            {formData.companyType === 'EIRL' && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-start gap-4">
                    <div className="text-sbs-blue flex-shrink-0 mt-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-sbs-blue mb-2">Sobre el Capital Social en la E.I.R.L.</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            El capital social se deposita <strong>a nombre de la sociedad en formaciÃ³n</strong> en una cuenta bancaria designada para ese fin (Art. 455 Ley 479-08). El banco emite una certificaciÃ³n del depÃ³sito. Una vez completada la constituciÃ³n y obtengas el Registro Mercantil, presentas ese documento al banco y este libera los fondos. No existe capital mÃ­nimo legal; deberÃ¡s depositar el 100% del monto declarado.
                        </p>
                    </div>
                </div>
            )}
            
            {/* --- ADMINISTRATION MODE TOGGLE --- */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1">
                            Modalidad de AdministraciÃ³n
                        </label>
                        <p className="text-sm text-gray-500">Â¿QuiÃ©n gestionarÃ¡ el dÃ­a a dÃ­a de la empresa?</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => toggleManagerMode('Socio')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${!isExternalManager ? 'bg-white text-sbs-blue shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {formData.companyType === 'EIRL' ? 'El Titular' : 'Socios'}
                        </button>
                        <button
                            onClick={() => toggleManagerMode('Tercero')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${isExternalManager ? 'bg-white text-sbs-blue shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Gerente Externo
                        </button>
                    </div>
                </div>
                    {isExternalManager && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start text-xs text-blue-800">
                        <HelpCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Has seleccionado <strong>Gerente Externo</strong>. Completa sus datos a continuaciÃ³n. {formData.companyType === 'EIRL' ? 'El titular seguirÃ¡ siendo propietario de la empresa.' : 'Opcionalmente, tambiÃ©n puedes designar socios con rol de "Gerente" para una administraciÃ³n mixta.'}</span>
                    </div>
                )}

                {/* --- CAMPOS DEL GERENTE EXTERNO --- */}
                {isExternalManager && (
                    <div className="mt-6 p-5 bg-white border-2 border-sbs-blue/20 rounded-xl animate-fade-in-up">
                        <h4 className="font-bold text-sbs-blue text-sm uppercase tracking-wider mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-sbs-blue text-white flex items-center justify-center text-xs mr-2">G</span>
                            Datos del Gerente Externo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    Nombre Completo <span className="text-sbs-red">*</span>
                                </label>
                                <input 
                                    placeholder="Nombres y Apellidos" 
                                    value={formData.manager.name} 
                                    onChange={e => updateFormData({ 
                                        manager: { ...formData.manager, name: e.target.value } 
                                    })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    {(formData.manager.nationality || 'RepÃºblica Dominicana') === 'RepÃºblica Dominicana' ? 'CÃ©dula' : 'Pasaporte'} <span className="text-sbs-red">*</span>
                                </label>
                                <input 
                                    placeholder={(formData.manager.nationality || 'RepÃºblica Dominicana') === 'RepÃºblica Dominicana' ? 'XXX-XXXXXXX-X' : 'NÃºmero de Pasaporte'} 
                                    value={formData.manager.idNumber} 
                                    onChange={e => {
                                        const isDominican = (formData.manager.nationality || 'RepÃºblica Dominicana') === 'RepÃºblica Dominicana';
                                        const value = isDominican ? formatCedula(e.target.value) : e.target.value;
                                        updateFormData({ 
                                            manager: { ...formData.manager, idNumber: value } 
                                        });
                                    }}
                                    className={`${inputClass} font-mono`}
                                    maxLength={(formData.manager.nationality || 'RepÃºblica Dominicana') === 'RepÃºblica Dominicana' ? 13 : 20}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    Nacionalidad <span className="text-sbs-red">*</span>
                                </label>
                                <select 
                                    value={formData.manager.nationality || 'RepÃºblica Dominicana'} 
                                    onChange={e => updateFormData({ 
                                        manager: { ...formData.manager, nationality: e.target.value } 
                                    })}
                                    className={inputClass}
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 p-8 rounded-[1.5rem] mb-8 border border-blue-100 shadow-sm relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <h3 className="font-bold text-lg text-sbs-blue mb-2 flex items-center relative z-10">
                    Capital Social
                    <Tooltip text={formData.companyType === 'EIRL' 
                        ? "El capital que el titular aporta para iniciar la empresa. Se divide en cuotas." 
                        : "El dinero total que los socios invierten para iniciar la empresa. Se divide en cuotas."
                    } />
                </h3>
                <p className="text-sm text-gray-600 mb-4 relative z-10">
                    {formData.companyType === 'EIRL' 
                        ? "Define el monto a aportar. No hay mÃ­nimo legal, pero deberÃ¡s depositar el total en el banco."
                        : "Define el monto total a aportar. (MÃ­nimo sugerido RD$ 100,000 â€” solo se paga 1% de impuesto sobre el excedente)"
                    }
                </p>
                
                <div className="relative z-10">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-sbs-blue/40">RD$</span>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.socialCapital === 0 ? '' : formData.socialCapital} 
                        onChange={handleCapitalChange} 
                        className="w-full pl-14 p-4 border-b-2 border-blue-200 bg-transparent text-3xl font-bold text-sbs-blue focus:outline-none focus:border-sbs-blue placeholder-blue-200/50"
                        placeholder="0"
                    />
                </div>

                {/* --- REAL-TIME TAX CALCULATOR --- */}
                {estimatedTax > 0 && (
                    <div className="mt-4 p-4 bg-white/60 rounded-xl border border-blue-100 backdrop-blur-sm animate-fade-in-up">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                            <span>Impuesto ConstituciÃ³n (1% excedente 100k):</span>
                            <span className="font-bold text-sbs-red">+ {formatCurrency(estimatedTax)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-sbs-blue pt-2 border-t border-blue-100">
                            <span>Total Estimado a Pagar:</span>
                            <span className="text-base">{formatCurrency(estimatedTotal)}</span>
                        </div>
                    </div>
                )}
                {/* ------------------------------- */}
            </div>

            {/* DuraciÃ³n de la Gerencia */}
            <div className="mb-8 p-6 bg-white border border-premium-border rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center">
                        DuraciÃ³n de la Gerencia
                        <Tooltip text="Tiempo de vigencia del Consejo de Gerencia antes de requerir ratificaciÃ³n." />
                    </label>
                </div>
                    <div className="relative">
                    <select
                        id="managementDuration"
                        value={formData.managementDuration}
                        onChange={(e) => updateFormData({ managementDuration: parseInt(e.target.value) })}
                        className={inputClass}
                    >
                        {Array.from({ length: 6 }, (_, i) => i + 1).map(year => (
                            <option key={year} value={year}>{year} {year === 1 ? 'AÃ±o' : 'AÃ±os'}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-sbs-blue">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Recomendado: 6 aÃ±os para evitar renovaciones frecuentes.</p>
            </div>

            <h3 className="font-bold text-lg text-sbs-blue mb-4 flex items-center">{formData.companyType === 'EIRL' ? 'InformaciÃ³n del Titular' : 'Estructura de Socios'} <span className="ml-2 text-xs bg-blue-100 text-sbs-blue px-2 py-1 rounded-full">{formData.partners.length} {formData.companyType === 'EIRL' ? 'Persona' : 'Personas'}</span></h3>
            
            {formData.partners.map((partner, i) => {
                 // International Address Logic - Basado en PAÃS DE RESIDENCIA, no nacionalidad
                 const residenceCountry = partner.residenceCountry || 'RepÃºblica Dominicana';
                 const isDominicanResident = residenceCountry === 'RepÃºblica Dominicana';
                 const hasSpecialRegions = INTERNATIONAL_REGIONS[residenceCountry] !== undefined;
                 const regionOptions = hasSpecialRegions ? INTERNATIONAL_REGIONS[residenceCountry] : [];
                 
                 const availableMunicipalities = isDominicanResident && partner.addressProvince ? MUNICIPALITIES[partner.addressProvince] || [] : [];
                 
                 const partnerRoles = partner.roles || ['Socio'];
                 const isForeigner = partner.nationality !== 'RepÃºblica Dominicana';
                 const isPassport = partner.documentType === 'Pasaporte';

                 return (
                <div key={partner.id} className="border border-premium-border shadow-sm p-6 rounded-2xl mb-6 relative bg-white hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-sbs-blue text-sm uppercase tracking-wider">{formData.companyType === 'EIRL' ? 'Titular' : `Socio ${i+1}`}</h4>
                         {formData.partners.length > 1 && formData.companyType !== 'EIRL' && (
                            <button onClick={() => removePartner(partner.id)} className="text-red-400 text-xs font-bold uppercase tracking-wider hover:text-red-600 bg-red-50 px-2 py-1 rounded">Eliminar</button>
                        )}
                    </div>
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Nombres</label>
                            <input 
                                placeholder="Nombres" 
                                value={partner.names} 
                                onChange={e => handlePartnerChange(partner.id, 'names', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'names', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'names') ? 'border-red-300 bg-red-50' : ''}`} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Apellidos</label>
                            <input 
                                placeholder="Apellidos" 
                                value={partner.surnames} 
                                onChange={e => handlePartnerChange(partner.id, 'surnames', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'surnames', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'surnames') ? 'border-red-300 bg-red-50' : ''}`} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Nacionalidad</label>
                            <select 
                                value={partner.nationality} 
                                onChange={e => handlePartnerChange(partner.id, 'nationality', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'nationality', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'nationality') ? 'border-red-300 bg-red-50' : ''}`} 
                            >
                                {COUNTRIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Estado Civil</label>
                            <select value={partner.maritalStatus} onChange={e => handlePartnerChange(partner.id, 'maritalStatus', e.target.value as MaritalStatus)} className={inputClass}>
                                <option value="Soltero(a)">Soltero(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                                <option value="UniÃ³n Libre">UniÃ³n Libre</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                Fecha de Nacimiento <span className="text-sbs-red">*</span>
                            </label>
                            <input 
                                type="text"
                                placeholder="DD/MM/AAAA"
                                value={partner.birthDate || ''} 
                                onChange={e => {
                                    // Formatear con barras: DD/MM/AAAA usando formatDateMask
                                    const formatted = formatDateMask(e.target.value);
                                    handlePartnerChange(partner.id, 'birthDate', formatted);
                                }} 
                                onBlur={(e) => handleBlur(partner.id, 'birthDate', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'birthDate') ? 'border-red-300 bg-red-50' : ''}`}
                                maxLength={10}
                            />
                            {isError(partner.id, 'birthDate') && <p className="text-red-500 text-xs mt-1">{errors[partner.id]['birthDate']}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">ProfesiÃ³n/OcupaciÃ³n</label>
                            <input 
                                placeholder="Ej: Ingeniero" 
                                value={partner.profession} 
                                onChange={e => handlePartnerChange(partner.id, 'profession', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'profession', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'profession') ? 'border-red-300 bg-red-50' : ''}`} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                {partner.documentType} <Tooltip text={isForeigner ? "NÃºmero de Pasaporte" : "Formato: XXX-XXXXXXX-X"} />
                            </label>
                            <input 
                                placeholder={isForeigner ? "NÃºmero Pasaporte" : "XXX-XXXXXXX-X"} 
                                value={partner.idNumber} 
                                onChange={e => handlePartnerChange(partner.id, 'idNumber', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'idNumber', e.target.value)}
                                className={`${inputClass} font-mono ${isError(partner.id, 'idNumber') ? 'border-red-300 bg-red-50' : ''}`} 
                                maxLength={isForeigner ? 20 : 13}
                                inputMode={isForeigner ? "text" : "numeric"}
                            />
                            {isError(partner.id, 'idNumber') && <p className="text-red-500 text-xs mt-1">{errors[partner.id]['idNumber']}</p>}
                        </div>
                        
                        {/* Contact Info */}
                         <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">TelÃ©fono MÃ³vil</label>
                            <input 
                                placeholder="+1 (809) 000-0000" 
                                value={partner.mobilePhone} 
                                onChange={e => handlePartnerChange(partner.id, 'mobilePhone', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'mobilePhone', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'mobilePhone') ? 'border-red-300 bg-red-50' : ''}`}
                                maxLength={20}
                                type="tel"
                            />
                             {isError(partner.id, 'mobilePhone') && <p className="text-red-500 text-xs mt-1">{errors[partner.id]['mobilePhone']}</p>}
                        </div>
                         <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Correo Personal</label>
                            <input 
                                placeholder="Email" 
                                type="email"
                                value={partner.email} 
                                onChange={e => handlePartnerChange(partner.id, 'email', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'email', e.target.value)}
                                className={`${inputClass} ${isError(partner.id, 'email') ? 'border-red-300 bg-red-50' : ''}`} 
                            />
                             {isError(partner.id, 'email') && <p className="text-red-500 text-xs mt-1">{errors[partner.id]['email']}</p>}
                        </div>

                        {/* --- PREMIUM ID UPLOAD SECTION (CONDITIONAL) --- */}
                        <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sbs-blue mr-3">
                                    <IdCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block">IdentificaciÃ³n Oficial</label>
                                    <p className="text-[10px] text-gray-400">
                                        {isPassport ? "Sube una foto clara de la pÃ¡gina de datos del Pasaporte." : "Sube ambas caras de la CÃ©dula."}
                                    </p>
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 ${isPassport ? '' : 'sm:grid-cols-2'} gap-6`}>
                                {/* Front Side */}
                                <div className="relative">
                                    {uploadProgress[`${partner.id}_idFront`] ? (
                                        <UploadProgress progress={uploadProgress[`${partner.id}_idFront`]} />
                                    ) : !partner.idFront ? (
                                        <label className={`h-32 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden ${errors[partner.id]?.idFront ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/30 hover:border-sbs-blue hover:bg-blue-50/30'}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, partner.id, 'idFront', (file) => handlePartnerChange(partner.id, 'idFront', file))}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="relative z-10 flex flex-col items-center">
                                                <Image className="w-8 h-8 text-gray-300 group-hover:text-sbs-blue transition-colors mb-2" strokeWidth={1.5} />
                                                <span className="text-xs font-bold text-gray-400 group-hover:text-sbs-blue transition-colors">Subir Imagen</span>
                                            </div>
                                            <input type="file" className="hidden" accept={ALLOWED_FILE_TYPES} onChange={(e) => e.target.files && handleFileUpload(`${partner.id}_idFront`, e.target.files[0], (file) => handlePartnerChange(partner.id, 'idFront', file))} />
                                        </label>
                                    ) : (
                                        <FilePreview file={partner.idFront} onRemove={() => handlePartnerChange(partner.id, 'idFront', null)} />
                                    )}
                                    {errors[partner.id]?.idFront && <p className="text-red-500 text-[10px] mt-1 font-bold text-center">{errors[partner.id]['idFront']}</p>}
                                </div>

                                {/* Back Side - HIDDEN IF PASSPORT */}
                                {!isPassport && (
                                    <div className="relative">
                                        {uploadProgress[`${partner.id}_idBack`] ? (
                                            <UploadProgress progress={uploadProgress[`${partner.id}_idBack`]} />
                                        ) : !partner.idBack ? (
                                            <label className={`h-32 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group relative overflow-hidden ${errors[partner.id]?.idBack ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/30 hover:border-sbs-blue hover:bg-blue-50/30'}`}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, partner.id, 'idBack', (file) => handlePartnerChange(partner.id, 'idBack', file))}
                                            >
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <Image className="w-8 h-8 text-gray-300 group-hover:text-sbs-blue transition-colors mb-2" strokeWidth={1.5} />
                                                    <span className="text-xs font-bold text-gray-400 group-hover:text-sbs-blue transition-colors">Subir Imagen</span>
                                                </div>
                                                <input type="file" className="hidden" accept={ALLOWED_FILE_TYPES} onChange={(e) => e.target.files && handleFileUpload(`${partner.id}_idBack`, e.target.files[0], (file) => handlePartnerChange(partner.id, 'idBack', file))} />
                                            </label>
                                        ) : (
                                           <FilePreview file={partner.idBack} onRemove={() => handlePartnerChange(partner.id, 'idBack', null)} />
                                        )}
                                        {errors[partner.id]?.idBack && <p className="text-red-500 text-[10px] mt-1 font-bold text-center">{errors[partner.id]['idBack']}</p>}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Selector de Cargos (Multi-select) - SIEMPRE VISIBLE para Gerencia Mixta */}
                        <div className="md:col-span-2 mt-2">
                             <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">
                                Cargos Asignados {!isExternalManager && formData.companyType !== 'EIRL' && <span className="text-sbs-red">*</span>}
                                <Tooltip text={
                                    formData.companyType === 'EIRL'
                                        ? "El titular de la E.I.R.L. es siempre Propietario y Gerente por disposiciÃ³n legal."
                                        : isExternalManager
                                            ? "Opcional: Puedes designar socios como Gerentes adicionales para una administraciÃ³n mixta."
                                            : "Al menos un socio debe ser designado como Gerente para representar a la empresa."
                                } />
                             </label>
                             <div className="flex flex-wrap gap-2">
                                 {['Socio', 'Gerente'].map(role => {
                                     const isActive = partnerRoles.includes(role);
                                     const isFixed = role === 'Socio' || (formData.companyType === 'EIRL' && role === 'Gerente');
                                     
                                     return (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => !isFixed && toggleRole(partner.id, role)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                                                isActive 
                                                    ? isFixed 
                                                        ? 'bg-sbs-blue text-white border-sbs-blue cursor-not-allowed opacity-90' 
                                                        : 'bg-sbs-blue text-white border-sbs-blue hover:bg-sbs-blue-light'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {role} {isActive && <span className="ml-1">âœ“</span>}
                                        </button>
                                     )
                                 })}
                             </div>
                        </div>
                        
                        {/* Granular Address (Smart International Logic) */}
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3 bg-premium-surface-subtle p-4 rounded-xl border border-premium-border mt-2">
                            <div className="col-span-2 md:col-span-3 mb-1 flex items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">DirecciÃ³n Residencial</span>
                                <Tooltip text="DirecciÃ³n personal del socio (no de la empresa). El paÃ­s de residencia determina el formato de la direcciÃ³n." />
                            </div>
                            
                            {/* PaÃ­s de Residencia - Determina el formato de direcciÃ³n */}
                            <div className="col-span-2 md:col-span-3 mb-2 relative z-10">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">
                                    PaÃ­s de Residencia <span className="text-sbs-red">*</span>
                                </label>
                                <select 
                                    value={partner.residenceCountry || 'RepÃºblica Dominicana'} 
                                    onChange={e => {
                                        // Actualizar residenceCountry Y limpiar campos en UNA SOLA operaciÃ³n
                                        const updatedPartners = formData.partners.map(p => 
                                            p.id === partner.id 
                                                ? { 
                                                    ...p, 
                                                    residenceCountry: e.target.value,
                                                    addressProvince: '',
                                                    addressCity: '',
                                                    postalCode: ''
                                                  } 
                                                : p
                                        );
                                        updateFormData({ partners: updatedPartners });
                                    }}
                                    className={`${inputClass} text-xs cursor-pointer`}
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <input 
                                placeholder="Calle" 
                                value={partner.addressStreet} 
                                onChange={e => handlePartnerChange(partner.id, 'addressStreet', e.target.value)} 
                                onBlur={(e) => handleBlur(partner.id, 'addressStreet', e.target.value)}
                                className={`${inputClass} text-xs ${isError(partner.id, 'addressStreet') ? 'border-red-300' : ''}`} 
                            />
                            <input placeholder="NÃºmero" value={partner.addressNumber} onChange={e => handlePartnerChange(partner.id, 'addressNumber', e.target.value)} className={`${inputClass} text-xs`} />
                            <input placeholder="Edificio / Res." value={partner.addressBuilding || ''} onChange={e => handlePartnerChange(partner.id, 'addressBuilding', e.target.value)} className={`${inputClass} text-xs`} />
                            <input placeholder="Apto / Casa #" value={partner.addressSuite || ''} onChange={e => handlePartnerChange(partner.id, 'addressSuite', e.target.value)} className={`${inputClass} text-xs`} />
                            
                            <input placeholder="Sector" value={partner.addressSector} onChange={e => handlePartnerChange(partner.id, 'addressSector', e.target.value)} className={`${inputClass} text-xs`} />
                            
                            {/* SMART ADDRESS LOGIC - International Support */}
                            {(() => {
                                const postalConfig = POSTAL_CODE_CONFIG[residenceCountry];
                                const regionLabel = postalConfig?.regionLabel || 'Estado / Provincia';
                                
                                if (isDominicanResident) {
                                    // RepÃºblica Dominicana: Provincias + Municipios (sin cÃ³digo postal)
                                    return (
                                        <>
                                            <select 
                                                value={partner.addressProvince} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressProvince', e.target.value)} 
                                                onBlur={(e) => handleBlur(partner.id, 'addressProvince', e.target.value)}
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressProvince') ? 'border-red-300' : ''}`}
                                            >
                                                <option value="">Provincia...</option>
                                                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                            
                                            {availableMunicipalities.length > 0 ? (
                                                <select 
                                                    value={partner.addressCity} 
                                                    onChange={e => handlePartnerChange(partner.id, 'addressCity', e.target.value)} 
                                                    onBlur={(e) => handleBlur(partner.id, 'addressCity', e.target.value)}
                                                    className={`${inputClass} text-xs ${isError(partner.id, 'addressCity') ? 'border-red-300' : ''}`}
                                                >
                                                    <option value="">Municipio...</option>
                                                    {availableMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            ) : (
                                                <input 
                                                    placeholder="Municipio" 
                                                    value={partner.addressCity} 
                                                    onChange={e => handlePartnerChange(partner.id, 'addressCity', e.target.value)} 
                                                    className={`${inputClass} text-xs`} 
                                                />
                                            )}
                                        </>
                                    );
                                } else if (hasSpecialRegions) {
                                    // PaÃ­ses con regiones especiales (USA, EspaÃ±a, Italia, Chile, CanadÃ¡)
                                    return (
                                        <>
                                            <select 
                                                value={partner.addressProvince} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressProvince', e.target.value)} 
                                                onBlur={(e) => handleBlur(partner.id, 'addressProvince', e.target.value)}
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressProvince') ? 'border-red-300' : ''}`}
                                            >
                                                <option value="">{regionLabel}...</option>
                                                {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            <input 
                                                placeholder="Ciudad" 
                                                value={partner.addressCity} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressCity', e.target.value)}
                                                onBlur={(e) => handleBlur(partner.id, 'addressCity', e.target.value)} 
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressCity') ? 'border-red-300' : ''}`} 
                                            />
                                            {/* CÃ³digo Postal con etiqueta dinÃ¡mica */}
                                            {postalConfig && (
                                                <input 
                                                    placeholder={postalConfig.label}
                                                    value={partner.postalCode || ''} 
                                                    onChange={e => handlePartnerChange(partner.id, 'postalCode', e.target.value)}
                                                    className={`${inputClass} text-xs font-mono`}
                                                    maxLength={postalConfig.maxLength}
                                                />
                                            )}
                                        </>
                                    );
                                } else {
                                    // Otros paÃ­ses (campos libres + cÃ³digo postal genÃ©rico)
                                    return (
                                        <>
                                            <input 
                                                placeholder="Estado / Provincia" 
                                                value={partner.addressProvince} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressProvince', e.target.value)} 
                                                onBlur={(e) => handleBlur(partner.id, 'addressProvince', e.target.value)}
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressProvince') ? 'border-red-300' : ''}`}
                                            />
                                            <input 
                                                placeholder="Ciudad" 
                                                value={partner.addressCity} 
                                                onChange={e => handlePartnerChange(partner.id, 'addressCity', e.target.value)}
                                                onBlur={(e) => handleBlur(partner.id, 'addressCity', e.target.value)} 
                                                className={`${inputClass} text-xs ${isError(partner.id, 'addressCity') ? 'border-red-300' : ''}`} 
                                            />
                                            <input 
                                                placeholder="CÃ³digo Postal" 
                                                value={partner.postalCode || ''} 
                                                onChange={e => handlePartnerChange(partner.id, 'postalCode', e.target.value)}
                                                className={`${inputClass} text-xs font-mono`}
                                                maxLength={10}
                                            />
                                        </>
                                    );
                                }
                            })()}
                        </div>

                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 md:col-span-2 flex items-center justify-between mt-2">
                            <div className="w-1/2 pr-4 border-r border-blue-200">
                                <label className="block text-[10px] font-bold text-sbs-blue uppercase mb-1 tracking-wider">Porcentaje (%)</label>
                                <div className="flex items-center">
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={formData.companyType === 'EIRL' ? '100' : (partner.percentage === 0 ? '' : partner.percentage)}
                                        onChange={e => formData.companyType !== 'EIRL' && handlePartnerChange(partner.id, 'percentage', e.target.value)}
                                        disabled={formData.companyType === 'EIRL'}
                                        className={`w-full bg-transparent font-bold focus:outline-none text-2xl placeholder-blue-300 ${
                                            formData.companyType === 'EIRL' 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'text-sbs-blue'
                                        }`}
                                        max="100" 
                                        placeholder="0" 
                                    />
                                    <span className="text-sbs-blue font-bold">%</span>
                                </div>
                            </div>
                            <div className="w-1/2 pl-4 text-right">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cuotas Asignadas</span>
                                <span className="text-2xl font-bold text-text-primary font-mono block">{partner.shares}</span>
                                <span className="text-xs text-gray-400">Valor nom. RD$ 100</span>
                            </div>
                        </div>
                    </div>
                </div>
            )})}
            
            <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-xl">
                <button 
                    onClick={addPartner}
                    disabled={formData.companyType === 'EIRL' && formData.partners.length >= 1}
                    className={`text-sm font-bold flex items-center px-3 py-2 rounded-lg transition-colors ${
                        formData.companyType === 'EIRL' && formData.partners.length >= 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-sbs-blue hover:underline hover:bg-blue-50'
                    }`}
                    title={formData.companyType === 'EIRL' ? "Una E.I.R.L. puede tener solo 1 titular" : ""}
                >
                    <span className="text-lg mr-1">+</span> {formData.companyType === 'EIRL' ? 'Titular Ãºnico' : 'AÃ±adir Socio'}
                </button>
                <div className={`font-bold text-sm px-4 py-2 rounded-lg border ${Math.abs(totalPercentage - 100) < 0.1 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    Total: {totalPercentage}%
                </div>
            </div>

            {/* --- SELECTOR DE TITULAR DE FIRMA DIGITAL --- */}
            {formData.partners.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-8 shadow-sm">
                    <div className="flex items-start mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sbs-blue mr-3 flex-shrink-0">
                            <FileSignature className="w-4 h-4" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-sbs-blue mb-1">
                                Titular de la Firma Digital <span className="text-sbs-red">*</span>
                            </label>
                            <p className="text-xs text-gray-500">
                                {formData.companyType === 'EIRL'
                                    ? isExternalManager
                                        ? 'Selecciona quiÃ©n serÃ¡ el titular de la firma digital: el propietario o el gerente externo.'
                                        : 'El titular de la empresa serÃ¡ el responsable de la firma digital.'
                                    : 'Selecciona cuÃ¡l socio serÃ¡ el responsable de la firma digital de la empresa. Solo puede ser uno.'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {/* OpciÃ³n: Gerente Externo (cuando aplica) */}
                        {isExternalManager && formData.manager.name && (
                            <label
                                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    formData.digitalSignatureHolderId === -1
                                        ? 'border-sbs-blue bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="digitalSignatureHolder"
                                    checked={formData.digitalSignatureHolderId === -1}
                                    onChange={() => updateFormData({ digitalSignatureHolderId: -1 })}
                                    className="w-4 h-4 text-sbs-blue border-gray-300 focus:ring-sbs-blue"
                                />
                                <div className="ml-3 flex-1">
                                    <span className="font-bold text-text-primary">{formData.manager.name}</span>
                                    <span className="text-xs text-gray-400 ml-2">{formData.manager.idNumber || 'Sin documento'}</span>
                                </div>
                                <span className="text-[10px] bg-amber-500 text-white px-2 py-1 rounded-full font-bold ml-2">GERENTE EXTERNO</span>
                            </label>
                        )}
                        {/* OpciÃ³n: Socios / Titular */}
                        {formData.partners.map((partner) => (
                            <label
                                key={partner.id}
                                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    formData.digitalSignatureHolderId === partner.id
                                        ? 'border-sbs-blue bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="digitalSignatureHolder"
                                    checked={formData.digitalSignatureHolderId === partner.id}
                                    onChange={() => updateFormData({ digitalSignatureHolderId: partner.id })}
                                    className="w-4 h-4 text-sbs-blue border-gray-300 focus:ring-sbs-blue"
                                />
                                <div className="ml-3 flex-1">
                                    <span className="font-bold text-text-primary">
                                        {partner.names && partner.surnames
                                            ? `${partner.names} ${partner.surnames}`
                                            : formData.companyType === 'EIRL' ? 'Titular' : `Socio ${formData.partners.indexOf(partner) + 1}`
                                        }
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2">
                                        {partner.idNumber || 'Sin documento'}
                                    </span>
                                </div>
                                {formData.digitalSignatureHolderId === partner.id && (
                                    <span className="text-xs bg-sbs-blue text-white px-2 py-1 rounded-full font-bold">
                                        Seleccionado
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                    
                    {!formData.digitalSignatureHolderId && (
                        <p className="text-xs text-amber-600 mt-3 flex items-center">
                            <HelpCircle className="w-3 h-3 mr-1" />
                            Debes seleccionar un titular para continuar.
                        </p>
                    )}
                </div>
            )}
            
            <div className="flex justify-between pt-4">
                <button onClick={prevStep} disabled={isSubmitting} className="px-8 py-4 rounded-full font-bold text-text-tertiary hover:text-sbs-blue transition-colors hover:bg-gray-50 disabled:opacity-50">AtrÃ¡s</button>
                <button 
                    onClick={handleNext} 
                    disabled={isSubmitting} 
                    className="px-12 py-5 bg-sbs-blue text-white rounded-full font-bold shadow-xl hover:shadow-glow-blue hover:-translate-y-0.5 transition-all duration-300 tracking-wide text-lg active:scale-95 disabled:opacity-70 disabled:cursor-wait disabled:transform-none"
                >
                    {isSubmitting ? 'Verificando...' : 'Siguiente Paso \u2192'}
                </button>
            </div>
        </div>
    );
};

export default StepB;