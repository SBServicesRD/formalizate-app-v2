import React from 'react';
import { AtSign, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useSignup } from '../core/hooks/useSignup';

interface SignupPostPaymentPageProps {
    onSignupComplete: () => void;
}

const SignupPostPaymentPage: React.FC<SignupPostPaymentPageProps> = ({ onSignupComplete }) => {
    const {
        email, setEmail,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        showPassword, setShowPassword,
        isLoading,
        error,
        handleSubmit,
    } = useSignup(onSignupComplete);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in-up py-12 px-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-premium border border-premium-border p-8 sm:p-10 relative overflow-hidden">
                {/* Decorative header gradient */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 to-emerald-400"></div>

                {/* Success indicator */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-sbs-blue mb-2">
                        ¡Pago Recibido!
                    </h2>
                    <p className="text-text-secondary text-sm">
                        Crea tu cuenta para acceder a tu expediente y dar seguimiento a tu proceso.
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <AtSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="email" 
                            required
                            placeholder="correo@ejemplo.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-sbs-blue focus:border-sbs-blue block transition-all"
                        />
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            placeholder="Crea una contraseña" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-sbs-blue focus:border-sbs-blue block transition-all"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-sbs-blue focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            placeholder="Confirma tu contraseña" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-sbs-blue focus:border-sbs-blue block transition-all"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !email || !password || !confirmPassword}
                        className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center
                            ${isLoading || !email || !password || !confirmPassword 
                                ? 'bg-sbs-blue/70 cursor-wait' 
                                : 'bg-sbs-blue hover:bg-sbs-blue-light hover:shadow-xl'
                            }
                        `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                                Creando cuenta...
                            </>
                        ) : (
                            'Crear Mi Cuenta'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        Tu cuenta te permitirá dar seguimiento al proceso de formalización de tu empresa.
                    </p>
                </div>
            </div>
            
            <p className="mt-8 text-xs text-gray-400 text-center max-w-xs">
                Al crear tu cuenta, aceptas nuestros <a href="#" className="underline hover:text-gray-500">Términos de Servicio</a> y <a href="#" className="underline hover:text-gray-500">Política de Privacidad</a>.
            </p>
        </div>
    );
};

export default SignupPostPaymentPage;
