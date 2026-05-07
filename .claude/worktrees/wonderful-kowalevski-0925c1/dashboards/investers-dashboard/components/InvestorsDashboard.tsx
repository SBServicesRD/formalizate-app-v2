import React, { useMemo } from 'react';
import { InvestorMetrics } from '../services/investorsService';
import { formatCurrency } from '../utils/calculations';
import { TrendingUp, DollarSign, Users, Calendar, Loader2, RefreshCw } from 'lucide-react';
interface InvestorsDashboardProps {
  onExit?: () => void;
  investorName?: string | null;
  metrics?: InvestorMetrics | null;
  loading?: boolean;
  lastUpdatedAt?: Date | string | null;
}

const InvestorsDashboard: React.FC<InvestorsDashboardProps> = ({
  onExit,
  investorName,
  metrics,
  loading,
  lastUpdatedAt,
}) => {
  const emptyMetrics: InvestorMetrics = {
    totalVentas: 0,
    ingresosBrutos: 0,
    utilidadNetaTotal: 0,
    ventasPorPlan: {},
    progresoPrimerasVentas: {
      actual: 0,
      meta: 120,
      porcentaje: 0,
    },
    comision25: 0,
    fechaUltimaVenta: null,
  };
  const resolvedMetrics = metrics ?? emptyMetrics;
  const isLoading = Boolean(loading);
  const lastUpdate = useMemo(() => {
    if (!lastUpdatedAt) {
      return new Date();
    }
    const date = lastUpdatedAt instanceof Date ? lastUpdatedAt : new Date(lastUpdatedAt);
    if (Number.isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  }, [lastUpdatedAt]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'N/A';
    }
  };

  const resolvedInvestorName = useMemo(() => {
    return investorName || 'Inversionista';
  }, [investorName]);

  const progressPercentage = Math.min(resolvedMetrics.progresoPrimerasVentas.porcentaje, 100);
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-20">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-sbs-blue rounded-lg flex items-center justify-center text-white font-bold shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sbs-blue leading-tight">Dashboard de Inversionistas</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Métricas en Tiempo Real</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {lastUpdate && (
              <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500">
                <RefreshCw className="w-3 h-3" />
                <span>Actualizado: {lastUpdate.toLocaleTimeString('es-DO')}</span>
              </div>
            )}
            {onExit && (
              <>
                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                <button 
                  onClick={onExit}
                  className="text-xs font-medium text-gray-500 hover:text-sbs-red transition-colors"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-in-up">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Bienvenido, {resolvedInvestorName}</h2>
        </div>
        {/* Cards de Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Ventas */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-sbs-blue" />
              </div>
              {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Ventas</h3>
            <p className="text-3xl font-bold text-gray-900">{resolvedMetrics.totalVentas}</p>
            <p className="text-xs text-gray-500 mt-2">Ventas pagadas</p>
          </div>

          {/* Ingresos Brutos */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ingresos Brutos</h3>
            <p className="text-2xl sm:text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap">
              {formatCurrency(resolvedMetrics.ingresosBrutos)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Acumulado total</p>
          </div>

          {/* Utilidad neta total */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Utilidad neta total</h3>
            <p className="text-2xl sm:text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap">
              {formatCurrency(resolvedMetrics.utilidadNetaTotal)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Acumulado total</p>
          </div>

          {/* Comisión 25% */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Comisión inversionistas (25% sobre utilidad neta)</h3>
            <p className="text-2xl sm:text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap">
              {formatCurrency(resolvedMetrics.comision25)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Participación inversionistas</p>
          </div>

          {/* Última Venta */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              {isLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Última Venta</h3>
            <p className="text-lg font-bold text-gray-900">{formatDate(resolvedMetrics.fechaUltimaVenta)}</p>
            <p className="text-xs text-gray-500 mt-2">Fecha más reciente</p>
          </div>
        </div>

        {/* Barra de Progreso - Primeras 120 Ventas */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
              Progreso primera ronda: 120 ventas
            </h3>
            <span className="text-sm font-bold text-sbs-blue">
              {resolvedMetrics.progresoPrimerasVentas.actual} / {resolvedMetrics.progresoPrimerasVentas.meta}
            </span>
          </div>
          
          <div className="relative w-full h-8 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-sbs-blue to-blue-600 transition-all duration-500 ease-out rounded-full flex items-center justify-end pr-4"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage > 10 && (
                <span className="text-xs font-bold text-white">
                  {Math.round(progressPercentage)}%
                </span>
              )}
            </div>
            {progressPercentage <= 10 && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
                {Math.round(progressPercentage)}%
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            {resolvedMetrics.progresoPrimerasVentas.meta - resolvedMetrics.progresoPrimerasVentas.actual} ventas restantes para alcanzar la meta
          </p>
        </div>

        {/* Gráfico de Ventas por Plan */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">
            Ventas por Plan
          </h3>
          
          <div className="space-y-6">
            {(Object.entries(resolvedMetrics.ventasPorPlan) as Array<[string, number]>).map(([plan, cantidad]) => {
              const planValues = Object.values(resolvedMetrics.ventasPorPlan) as number[];
              const totalPlanes = planValues.reduce((acc, value) => acc + value, 0);
              const porcentaje = totalPlanes > 0 ? (cantidad / totalPlanes) * 100 : 0;
              
              return (
                <div key={plan} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{plan}</span>
                    <span className="text-sm font-bold text-sbs-blue">{cantidad} ventas</span>
                  </div>
                  <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-sbs-blue to-blue-600 transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{Math.round(porcentaje)}% del total</p>
                </div>
              );
            })}
            
            {Object.keys(resolvedMetrics.ventasPorPlan).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No hay ventas por plan disponibles</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default InvestorsDashboard;

