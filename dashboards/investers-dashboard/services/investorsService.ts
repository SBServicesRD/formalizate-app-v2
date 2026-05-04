export interface InvestorMetrics {
  totalVentas: number;
  ingresosBrutos: number;
  utilidadNetaTotal: number;
  ventasPorPlan: Record<string, number>;
  progresoPrimerasVentas: {
    actual: number;
    meta: number;
    porcentaje: number;
  };
  comision25: number;
  fechaUltimaVenta: string | null;
}

export const fetchInvestorMetrics = async (magicToken: string): Promise<InvestorMetrics> => {
  if (!magicToken) {
    throw new Error('Magic token requerido');
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Missing VITE_FIREBASE_PROJECT_ID');
  }

  const response = await fetch(
    `https://us-central1-${projectId}.cloudfunctions.net/investorsDashboard`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Investor-Token': magicToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Acceso inválido o expirado');
  }

  return response.json();
};

