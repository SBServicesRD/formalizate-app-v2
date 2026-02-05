import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const hasOpenedRef = useRef(false);

    // Lógica de Auto-Apertura con Sonido Seguro
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!hasOpenedRef.current) {
                setIsOpen(true);
                
                // Intento de reproducir sonido (Manejo de errores para navegadores estrictos)
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5; // Volumen al 50% para no asustar
                audio.play().catch(error => {
                    // Si el navegador bloquea el autoplay (común en Chrome/Safari), 
                    // simplemente ignoramos el error y abrimos el chat en silencio.
                    console.log("Audio autoplay bloqueado por el navegador (comportamiento normal).");
                });

                hasOpenedRef.current = true;
            }
        }, 4000); // Se abre a los 4 segundos
        return () => clearTimeout(timer);
    }, []);

    // MENSAJE DE ATAQUE (MENTALIDAD "S.O.S.")
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
        { 
            role: 'model', 
            text: '👋 Hola. Veo que estás analizando formalizarte.\n\nSoy Julia, la IA de SBS. Te regalo una consulta preliminar AHORA MISMO.\n\n¿No sabes qué plan te conviene o tienes dudas con los impuestos? Escríbeme aquí:' 
        }
    ]);
    
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const [isRateLimited, setIsRateLimited] = useState(false);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isRateLimited) return;

        const userMsg = inputText;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputText('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMsg,
                    sessionId: sessionIdRef.current
                })
            });

            if (response.status === 429) {
                setIsRateLimited(true);
                setMessages(prev => [...prev, { 
                    role: 'model', 
                    text: 'Has alcanzado el límite de consultas gratuitas por hoy. Para asesoría ilimitada y profesional, te invitamos a formalizar tu empresa con uno de nuestros planes.' 
                }]);
                return;
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'model', text: data.response || "Lo siento, no pude procesar eso." }]);
        } catch (error) {
            console.error("Error en chat:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Tuve un pequeño problema técnico. ¿Podrías repetirlo?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up flex flex-col max-h-[500px]">
                    <div className="bg-gradient-to-r from-sbs-blue to-sbs-blue-light p-4 flex justify-between items-center text-white">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 border border-white/30">
                                <span className="font-bold text-xs">J</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Julia AI</h3>
                                <p className="text-[10px] text-blue-100 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                                    En línea • Responde en 2s
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-gray-50 max-h-80">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-sbs-blue text-white rounded-br-none' 
                                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none whitespace-pre-wrap'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start mb-3">
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex space-x-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className={`flex items-center bg-gray-50 rounded-full px-4 py-2 border transition-all ${isRateLimited ? 'border-gray-300 opacity-60' : 'border-gray-200 focus-within:border-sbs-blue focus-within:ring-1 focus-within:ring-sbs-blue/20'}`}>
                            <input 
                                type="text" 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 text-gray-700"
                                placeholder={isRateLimited ? "Límite alcanzado" : "Escribe aquí tu duda..."}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isRateLimited}
                                autoFocus={isOpen && !isRateLimited} 
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() || isRateLimited}
                                className={`ml-2 p-1.5 rounded-full transition-colors ${inputText.trim() && !isRateLimited ? 'bg-sbs-blue text-white hover:bg-sbs-blue-light' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative w-14 h-14 bg-sbs-red rounded-full shadow-lg flex items-center justify-center hover:bg-sbs-red-dark transition-all duration-300 hover:scale-110 ring-4 ring-white/20 animate-bounce-subtle"
                >
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    <MessageCircle className="w-7 h-7 text-white" />
                    
                    <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl shadow-xl text-xs font-bold text-gray-700 whitespace-nowrap opacity-100 transition-opacity transform translate-x-0 hidden md:block">
                        ¿Tienes dudas? ¡Pregúntame!
                        <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white transform rotate-45 -translate-y-1/2"></div>
                    </div>
                </button>
            )}
        </div>
    );
};

export default Chatbot;