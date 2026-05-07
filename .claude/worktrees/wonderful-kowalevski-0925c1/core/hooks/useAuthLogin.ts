import { useState } from 'react';
import type { FormEvent } from 'react';
import { auth, googleProvider } from '../services/firebase';
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    AuthError,
} from 'firebase/auth';

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

export const useAuthLogin = (onLogin: () => void) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);

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

    const handleSubmit = async (e: FormEvent) => {
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

    return {
        email, setEmail,
        password, setPassword,
        showPassword, setShowPassword,
        isLoading,
        isGoogleLoading,
        error, setError,
        isSignUp, setIsSignUp,
        handleGoogleLogin,
        handleSubmit,
    };
};
