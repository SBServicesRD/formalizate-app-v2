import React from 'react';

export const NotFoundState: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg text-center p-6">
    <h2 className="text-2xl font-bold text-sbs-blue mb-2">No encontramos tu expediente</h2>
    <p className="text-text-secondary text-sm max-w-md">
      Verifica que el enlace tenga el email o UID correcto. Si necesitas ayuda, contacta a nuestro equipo.
    </p>
  </div>
);
