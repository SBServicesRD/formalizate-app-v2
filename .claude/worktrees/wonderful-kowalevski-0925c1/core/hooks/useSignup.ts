import { useState } from 'react';
import type { FormEvent } from 'react';
import { auth } from '../services/firebase';
import {
    createUserWithEmailAndPassword,
    AuthError,
} from 'firebase/auth';

const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
        'auth/invalid-email': 'El correo electrónico no es válido.',
        'auth/email-already-in-use': 'Este correo ya está registrado. Usa otro correo para continuar.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
        'auth/operation-not-allowed': 'Este método de registro no está habilitado.',
    };
    return errorMessages[errorCode] || 'Ocurrió un error al crear tu cuenta. Intenta nuevamente.';
};

export const useSignup = (onSignupComplete: () => void) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password || !confirmPassword) return;

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            onSignupComplete();
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
        confirmPassword, setConfirmPassword,
        showPassword, setShowPassword,
        isLoading,
        error,
        handleSubmit,
    };
};
