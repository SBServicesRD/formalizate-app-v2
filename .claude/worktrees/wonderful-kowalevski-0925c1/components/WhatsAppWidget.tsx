import React from 'react';
import { X } from 'lucide-react';
import { useWhatsAppAutoOpen } from '../core/hooks/useWhatsAppAutoOpen';

const WHATSAPP_NUMBER = '18296487176';
const PREFILLED_MESSAGE = 'Hola, me interesa formalizar mi empresa. Vi su página y quiero más información.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`;

const WHATSAPP_ICON_URL = 'https://storage.googleapis.com/pics_html/whatsapp-icon.png';
const PROFILE_PHOTO_URL = 'https://storage.googleapis.com/pics_html/foto_jdme.jpg';

const WhatsAppWidget: React.FC = () => {
    const { isOpen, setIsOpen } = useWhatsAppAutoOpen();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Panel del widget abierto */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col border-2 border-black/10">
                    {/* Header estilo WhatsApp */}
                    <div className="bg-[#075E54] p-4 flex justify-between items-center text-white">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full mr-3 border border-white/30 overflow-hidden">
                                <img src={PROFILE_PHOTO_URL} alt="Julio" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Julio - Formalizate.app</h3>
                                <p className="text-[10px] text-green-200 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                                    En línea • Responde en minutos
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Área de chat con fondo estilo WhatsApp */}
                    <div 
                        className="p-4 min-h-[160px] flex flex-col justify-end"
                        style={{ backgroundColor: '#ECE5DD' }}
                    >
                        {/* Mensaje ficticio de bienvenida */}
                        <div className="flex justify-start mb-3">
                            <div className="relative max-w-[85%] bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-gray-800 leading-relaxed">
                                <div className="absolute -top-0 -left-2 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent"></div>
                                <p className="font-semibold text-[#075E54] text-xs mb-1">Julio</p>
                                <p>Hola! Soy Julio de <strong>Formalizate.app</strong>. Si tienes dudas sobre cómo constituir tu empresa, escríbeme directo por aquí y te oriento.</p>
                                <span className="text-[10px] text-gray-400 float-right mt-1">ahora</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA - Botón para abrir WhatsApp */}
                    <div className="bg-[#F0F0F0] p-3">
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 px-4 rounded-full transition-all duration-300 hover:scale-[1.02] shadow-md text-sm"
                        >
                            <img src={WHATSAPP_ICON_URL} alt="WhatsApp" className="w-5 h-5" />
                            Iniciar chat en WhatsApp
                        </a>
                    </div>
                </div>
            )}

            {/* Botón flotante cuando el widget está cerrado */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative w-14 h-14 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center hover:bg-[#1DA851] transition-all duration-300 hover:scale-110 ring-4 ring-white/20 animate-bounce-subtle"
                    aria-label="Abrir chat de WhatsApp"
                >
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">1</span>
                    </div>
                    <img src={WHATSAPP_ICON_URL} alt="WhatsApp" className="w-7 h-7" />

                    <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl shadow-xl text-xs font-bold text-gray-700 whitespace-nowrap opacity-100 transition-opacity transform translate-x-0 hidden md:block">
                        Te asesoramos por WhatsApp
                        <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white transform rotate-45 -translate-y-1/2"></div>
                    </div>
                </button>
            )}
        </div>
    );
};

export default WhatsAppWidget;
