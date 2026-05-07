import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg">
    <Loader2 className="w-8 h-8 text-sbs-blue animate-spin" />
    <p className="mt-4 text-text-secondary text-sm">Cargando tu dashboard...</p>
  </div>
);
