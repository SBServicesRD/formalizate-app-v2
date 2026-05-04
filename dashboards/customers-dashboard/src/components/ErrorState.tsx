import React from 'react';

interface ErrorStateProps {
  message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg text-center p-6">
    <h2 className="text-2xl font-bold text-sbs-red mb-2">Ups, algo salió mal</h2>
    <p className="text-text-secondary text-sm max-w-md">{message}</p>
  </div>
);
