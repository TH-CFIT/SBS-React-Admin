import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Loader2, Settings as SettingsIcon, AlertCircle, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const [isProductionOn, setIsProductionOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setIsProductionOn(data.production_mode || false);
      if (data.error) {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setStatusMessage({ type: 'error', text: 'Failed to load current settings.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    const newValue = !isProductionOn;
    
    // Optimistic UI update
    setIsProductionOn(newValue);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ production_mode: newValue })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatusMessage({ type: 'success', text: 'Settings updated successfully in Edge Config!' });
      } else {
        // Revert on failure
        setIsProductionOn(!newValue);
        setStatusMessage({ 
          type: 'error', 
          text: data.message || 'Failed to save settings. Please ensure VERCEL_ACCESS_TOKEN is configured.' 
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setIsProductionOn(!newValue);
      setStatusMessage({ type: 'error', text: 'Network error while saving settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-dhl-red/10 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-dhl-red" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Global Settings
        </h1>
      </div>

      <div className="card max-w-2xl">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Environment Controls</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Manage global application states. These settings are instantly propagated to all connected apps via Vercel Edge Config.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-dhl-red" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Live Production
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${isProductionOn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isProductionOn ? 'Live' : 'Suspend'}
                  </span>
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  Enable this to route the primary application traffic to the live production database. Turn off to enter maintenance or test mode.
                </p>
              </div>
              
              <button
                onClick={handleToggle}
                disabled={isSaving}
                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-dhl-red focus:ring-offset-2 ${
                  isProductionOn ? 'bg-green-500' : 'bg-red-500'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="sr-only">Toggle Live Production</span>
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isProductionOn ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                statusMessage.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm font-medium">{statusMessage.text}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
