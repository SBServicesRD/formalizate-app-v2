import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogle = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Completa tu correo y contraseña.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión con tu correo.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-premium p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-sbs-blue text-white flex items-center justify-center font-bold text-lg">
            SBS
          </div>
          <div>
            <h1 className="text-lg font-bold text-sbs-blue">Panel de Clientes</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Formalizate</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Inicia sesión</h2>
        <p className="text-sm text-gray-500 mb-6">
          Accede con el mismo correo que usaste durante la compra.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isLoading}
          className="w-full rounded-xl border border-gray-200 py-3 text-xs font-bold text-gray-700 flex items-center justify-center gap-2 hover:border-sbs-blue/40 hover:text-sbs-blue disabled:opacity-60"
        >
          <Lock className="w-4 h-4" />
          Continuar con Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex-1 h-px bg-gray-200"></span>
          o con correo
          <span className="flex-1 h-px bg-gray-200"></span>
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Correo electrónico</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                className="w-full text-sm outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Contraseña</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-sbs-blue py-3 text-xs font-bold text-white disabled:opacity-60"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};
