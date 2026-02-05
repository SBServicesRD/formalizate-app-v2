import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import DashboardPage from './DashboardPage';
import { AppStep, FormData } from '../types';

interface SecureDashboardProps {
    user: User;
    formData: FormData;
    onExit: () => void;
    setStep: (step: AppStep) => void;
}

const SecureDashboard: React.FC<SecureDashboardProps> = ({ user, formData, onExit, setStep }) => {
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            if (!user) {
                setStep(AppStep.Landing);
                return;
            }

            try {
                const response = await fetch(`/api/verify-payment-status?uid=${user.uid}`);
                if (!response.ok) {
                    throw new Error('La verificación del servidor falló');
                }
                const data = await response.json();
                if (data.hasPaid) {
                    setIsVerified(true);
                } else {
                    setIsVerified(false);
                    // Forzar redirección si el servidor dice que no ha pagado
                    setTimeout(() => setStep(AppStep.Landing), 3000); 
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Un error desconocido ocurrió.');
                setIsVerified(false);
                setTimeout(() => setStep(AppStep.Landing), 3000);
            }
        };

        verifyPayment();
    }, [user, setStep]);

    if (isVerified === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg">
                <Loader2 className="w-8 h-8 text-sbs-blue animate-spin" />
                <p className="mt-4 text-text-secondary text-sm">Verificando estado de tu plan...</p>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg text-center p-4">
                <h2 className="text-2xl font-bold text-premium-text mb-2">Acceso denegado</h2>
                <p className="text-text-secondary mb-4">
                    {error || 'No hemos podido confirmar un plan activo para tu cuenta.'}
                </p>
                <p className="text-text-secondary text-sm">
                    Serás redirigido al inicio en 3 segundos.
                </p>
            </div>
        );
    }

    return <DashboardPage formData={formData} onExit={onExit} />;
};

export default SecureDashboard;