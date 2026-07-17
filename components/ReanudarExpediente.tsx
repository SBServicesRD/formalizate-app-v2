import React, { useState } from 'react';
import { KeyRound, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { reanudarExpediente, ExpedienteReanudado } from '../services/documentService';

interface ReanudarExpedienteProps {
    token: string;
    onSuccess: (datos: ExpedienteReanudado) => void;
}

/**
 * Pantalla de reanudación — el cliente llega desde el enlace de su correo
 * (app.formalizate.app/?continuar=<token>) y desbloquea su expediente con el
 * PIN del mismo correo. Sin cuentas ni contraseñas: el enlace+PIN es la llave.
 */
const ReanudarExpediente: React.FC<ReanudarExpedienteProps> = ({ token, onSuccess }) => {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [yaEnviado, setYaEnviado] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin.trim() || isLoading) return;
        setError(null);
        setIsLoading(true);
        try {
            const datos = await reanudarExpediente(token, pin.trim());
            if (datos.completado) {
                setYaEnviado(true);
                return;
            }
            onSuccess(datos);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo reanudar. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (yaEnviado) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in-up py-12 px-4">
                <div className="w-full max-w-md bg-white rounded-[2rem] shadow-premium border border-premium-border p-8 sm:p-10 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-sbs-blue mb-3">Tu expediente ya fue enviado</h2>
                    <p className="text-text-secondary text-sm mb-8">
                        No hay nada pendiente por completar. Puedes seguir el avance de tu
                        empresa desde tu Panel de Seguimiento — el acceso te llegó por correo.
                    </p>
                    <a
                        href="https://dash.formalizate.app"
                        className="inline-flex items-center justify-center bg-sbs-blue text-white font-bold py-3.5 px-8 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all"
                    >
                        Ir a mi Panel
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in-up py-12 px-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-premium border border-premium-border p-8 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sbs-blue to-blue-400"></div>

                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                        <KeyRound className="w-8 h-8 text-sbs-blue" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-sbs-blue mb-2">Continúa tu Expediente</h2>
                    <p className="text-text-secondary text-sm">
                        Tu pago está registrado y tu avance guardado. Ingresa el PIN que te
                        enviamos por correo para retomar exactamente donde ibas.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                        type="text"
                        required
                        autoFocus
                        placeholder="PIN"
                        value={pin}
                        maxLength={8}
                        onChange={(e) => setPin(e.target.value.toUpperCase())}
                        className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold text-sbs-blue py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-sbs-blue focus:border-sbs-blue transition-all uppercase"
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !pin.trim()}
                        className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center
                            ${isLoading || !pin.trim()
                                ? 'bg-sbs-blue/70 cursor-wait'
                                : 'bg-sbs-blue hover:bg-sbs-blue-light hover:shadow-xl'
                            }
                        `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                                Verificando...
                            </>
                        ) : (
                            'Continuar donde iba'
                        )}
                    </button>
                </form>

                <p className="mt-8 text-xs text-gray-400 text-center">
                    El PIN está en el correo "Pago registrado" que te enviamos al pagar.
                    ¿No lo encuentras? Escríbenos a ventas@formalizate.app.
                </p>
            </div>
        </div>
    );
};

export default ReanudarExpediente;
