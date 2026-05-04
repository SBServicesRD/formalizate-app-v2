import React, { useEffect, useState } from 'react';
import DashboardPage from './components/DashboardPage';
import { LoadingState } from './components/LoadingState';
import { NotFoundState } from './components/NotFoundState';
import { ErrorState } from './components/ErrorState';
import { fetchLatestSale } from './services/salesService';
import type { SaleRecord } from './types';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';

const App: React.FC = () => {
  const [sale, setSale] = useState<SaleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isLoading: isAuthLoading, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const loadSale = async () => {
      if (!user) {
        setSale(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await fetchLatestSale({ uid: user.uid });
        if (!isMounted) return;
        setSale(result);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'No se pudo cargar el dashboard.';
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSale();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isAuthLoading || isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!sale) {
    return <NotFoundState />;
  }

  return <DashboardPage sale={sale} onLogout={logout} currentUserUid={user.uid} />;
};

export default App;
