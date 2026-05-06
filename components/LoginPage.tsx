import React, { useState } from 'react';
import { AtSign, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { auth, googleProvider } from '../core/services/firebase';
import { 
    signInWithPopup, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    AuthError
} from 'firebase/auth';

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);

    // Mapeo de errores de Firebase a mensajes amigables
    const getErrorMessage = (errorCode: string): string => {
        const errorMessages: Record<string, string> = {
            'auth/invalid-email': 'El correo electrónico no es válido.',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
            'auth/user-not-found': 'No existe una cuenta con este correo. Si eres nuevo, primero debes adquirir un plan.',
            'auth/wrong-password': 'Contraseña incorrecta.',
            'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.',
            'auth/popup-closed-by-user': 'Cerraste la ventana de inicio de sesión.',
            'auth/cancelled-popup-request': 'Operación cancelada.',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
            'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
            'auth/email-already-in-use': 'Este correo ya está registrado. Inicia sesión en su lugar.',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        };
        return errorMessages[errorCode] || 'Ocurrió un error. Intenta nuevamente.';
    };

    // Login con Google
    const handleGoogleLogin = async () => {
        setError(null);
        setIsGoogleLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            onLogin();
        } catch (err) {
            const authError = err as AuthError;
            setError(getErrorMessage(authError.code));
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // Login o Registro con Email y Contraseña
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        
        setError(null);
        setIsLoading(true);
        
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLogin();
        } catch (err) {
            const authError = err as AuthError;
            setError(getErrorMessage(authError.code));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in-up py-12 px-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-premium border border-premium-border p-8 sm:p-10 relative overflow-hidden">
                {/* Decorative header gradient */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sbs-blue to-sbs-blue-light"></div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-sbs-blue mb-2">
                        {isSignUp ? 'Crear cuenta' : 'Bienvenido de nuevo'}
                    </h2>
                    <p className="text-text-secondary text-sm">
                        {isSignUp ? 'Regístrate para gestionar tu proceso legal.' : 'Accede para gestionar tu proceso legal.'}
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Social Login Grid */}
                <div className="space-y-3 mb-8">
                    {/* Google */}
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        type="button"
                        className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center transition-all transform hover:-translate-y-0.5 group relative disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-3 absolute left-4 group-hover:scale-110 transition-transform" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.657-3.356-11.303-7.962l-6.571 4.819C9.656 39.663 16.318 44 24 44z"/>
                                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.574l6.19 5.238C42.012 36.49 44 30.686 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                                </svg>
                                <span>Continuar con Google</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-gray-400 font-medium uppercase tracking-widest">O con tu email</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

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
                            placeholder="Tu contraseña" 
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

                    <div className="flex justify-between items-center">
                        {!isSignUp && (
                            <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-sbs-blue hover:text-sbs-blue-light">
                                ¿Olvidaste tu contraseña?
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            className="text-xs font-medium text-sbs-blue hover:text-sbs-blue-light ml-auto"
                        >
                            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nuevo? Crear cuenta'}
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !email || !password}
                        className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center
                            ${isLoading || !email || !password 
                                ? 'bg-sbs-blue/70 cursor-wait' 
                                : 'bg-sbs-blue hover:bg-sbs-blue-light hover:shadow-xl'
                            }
                        `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" />
                                Procesando...
                            </>
                        ) : (
                            isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        ¿Aún no eres cliente? <a href="#servicios" className="font-bold text-sbs-blue hover:text-sbs-blue-light hover:underline transition-colors">Conoce nuestros planes</a>
                    </p>
                </div>
            </div>
            
            <p className="mt-8 text-xs text-gray-400 text-center max-w-xs">
                Al continuar, aceptas nuestros <a href="#" className="underline hover:text-gray-500">Términos de Servicio</a> y <a href="#" className="underline hover:text-gray-500">Política de Privacidad</a>.
            </p>
        </div>
    );
};

export default LoginPage;
