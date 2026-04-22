import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Chart, registerables } from 'chart.js';
import { Loader2, Package, CheckCircle, AlertTriangle, FileText, CalendarDays } from 'lucide-react';

Chart.register(...registerables);

const API_BASE_URL = '/api';

interface DashboardData {
  summary: {
    totalShipments: number;
    successful: number;
    errors: number;
    withInvoice: number;
  };
  dailyVolume: { date: string; count: number }[];
  topCountries: { country: string; count: number }[];
}

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Default to 0s instead of null
  const [data, setData] = useState<DashboardData>({
    summary: { totalShipments: 0, successful: 0, errors: 0, withInvoice: 0 },
    dailyVolume: [],
    topCountries: []
  });

  const dailyChartRef = useRef<HTMLCanvasElement | null>(null);
  const countriesChartRef = useRef<HTMLCanvasElement | null>(null);
  const dailyChartInstance = useRef<Chart | null>(null);
  const countriesChartInstance = useRef<Chart | null>(null);


  const renderCharts = useCallback((dashData: DashboardData) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDarkMode ? '#d1d5db' : '#4b5563';

    // Daily Volume Chart
    if (dailyChartInstance.current) dailyChartInstance.current.destroy();
    if (dailyChartRef.current) {
      const ctx = dailyChartRef.current.getContext('2d');
      if (ctx) {
        dailyChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: dashData.dailyVolume?.map((d) => d.date) || [],
            datasets: [{
              label: 'Shipments',
              data: dashData.dailyVolume?.map((d) => d.count) || [],
              backgroundColor: 'rgba(212, 5, 17, 0.6)',
              borderColor: 'rgba(212, 5, 17, 1)',
              borderWidth: 1,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
              x: { ticks: { color: textColor }, grid: { display: false } },
            },
          },
        });
      }
    }

    // Top Countries Chart
    if (countriesChartInstance.current) countriesChartInstance.current.destroy();
    if (countriesChartRef.current) {
      const ctx = countriesChartRef.current.getContext('2d');
      if (ctx) {
        countriesChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: dashData.topCountries?.map((c) => c.country) || [],
            datasets: [{
              label: 'Shipments',
              data: dashData.topCountries?.map((c) => c.count) || [],
              backgroundColor: [
                'rgba(255, 204, 0, 0.8)',
                'rgba(212, 5, 17, 0.7)',
                'rgba(107, 114, 128, 0.7)',
                'rgba(249, 115, 22, 0.7)',
                'rgba(59, 130, 246, 0.7)',
              ],
              borderColor: isDarkMode ? '#1f2937' : '#fff',
              borderWidth: 3,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: { color: textColor, padding: 16, usePointStyle: true, pointStyleWidth: 10 },
              },
            },
          },
        });
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    if (!dateFrom || !dateTo) {
      setErrorMessage('Please select a valid date range.');
      setIsLoading(false);
      return;
    }

    try {
      const env = sessionStorage.getItem('dbs_environment') || 'Prod';
      const tableName = env === 'Test' ? 'shipment_test_logs' : 'shipment_logs';

      const response = await fetch(`${API_BASE_URL}/dashboard-stats?dateFrom=${dateFrom}&dateTo=${dateTo}&table=${tableName}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const dashData = await response.json();
      setData(dashData);

      // Wait for next frame to ensure canvas is rendered
      requestAnimationFrame(() => {
        renderCharts(dashData);
      });
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(t('errorFetch'));
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, renderCharts, t]);

  // Do not load data on mount to save quota
  useEffect(() => {
    // Initial empty chart render
    renderCharts(data);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (dailyChartInstance.current) dailyChartInstance.current.destroy();
      if (countriesChartInstance.current) countriesChartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Title Row */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('dashboardTitle')}
        </h1>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="d-from" className="block text-sm font-medium mb-1">{t('dateFrom')}</label>
            <input id="d-from" type="date" className="input-field !py-2 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label htmlFor="d-to" className="block text-sm font-medium mb-1">{t('dateTo')}</label>
            <input id="d-to" type="date" className="input-field !py-2 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button onClick={fetchData} disabled={isLoading} className="btn-primary btn-yellow !py-2 flex items-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
            {t('getData')}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-dhl-red mb-3" />
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="text-center py-8 text-red-500 font-medium">{errorMessage}</div>
      )}

      {/* Stats + Charts */}
      {!isLoading && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="stat-card group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('statTotal')}</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {(data.summary.totalShipments || 0).toLocaleString()}
              </p>
            </div>

            <div className="stat-card group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('statSuccess')}</h3>
              </div>
              <p className="text-3xl font-bold text-green-500">
                {(data.summary.successful || 0).toLocaleString()}
              </p>
            </div>

            <div className="stat-card group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('statError')}</h3>
              </div>
              <p className="text-3xl font-bold text-red-500">
                {(data.summary.errors || 0).toLocaleString()}
              </p>
            </div>

            <div className="stat-card group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('statWithInvoice')}</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {(data.summary.withInvoice || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 stat-card !p-6 flex flex-col" style={{ minHeight: '24rem' }}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('chartDailyVolume')}</h3>
              <div className="relative flex-grow">
                <canvas ref={dailyChartRef} />
              </div>
            </div>
            <div className="lg:col-span-2 stat-card !p-6 flex flex-col" style={{ minHeight: '24rem' }}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('chartTopCountries')}</h3>
              <div className="relative flex-grow">
                <canvas ref={countriesChartRef} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
