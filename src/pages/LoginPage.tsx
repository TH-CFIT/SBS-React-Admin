import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Eye, EyeOff, Loader2, Globe, Sun, Moon } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [environment, setEnvironment] = useState('Prod');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        sessionStorage.setItem('dbs_admin_logged_in', 'true');
        sessionStorage.setItem('dbs_environment', environment);
        onLoginSuccess();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || t('loginError'));
      }
    } catch (error) {
      console.error('Login Error:', error);
      setErrorMessage(t('loginServerError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-dhl-red/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-dhl-yellow/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-[pulse_8s_ease-in-out_infinite_2s]" />
      </div>

      {/* Top-right controls */}
      <div className="fixed top-4 right-4 flex items-center gap-3 z-10">
        <button
          onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
          className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <Globe className="w-4 h-4 text-dhl-red" />
          <span className="text-sm font-bold tracking-wide">{language.toUpperCase()}</span>
        </button>
        <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all active:scale-95">
          {isDarkMode ? <Sun className="w-5 h-5 text-dhl-yellow" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>
      </div>

      <div className="w-full max-w-md p-10 rounded-[2rem] bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative z-[1] animate-[fadeIn_0.5s_ease-out]">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-dhl-red to-red-700 dark:to-red-400 tracking-tighter drop-shadow-sm mb-2">SBS</h1>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('loginTitle')}</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Environment */}
          <div>
            <label htmlFor="login-environment" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Environment
            </label>
            <div className="relative">
              <select
                id="login-environment"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dhl-red/30 focus:border-dhl-red transition-all cursor-pointer appearance-none font-medium"
              >
                <option value="Prod">Production</option>
                <option value="Test">Test</option>
                <option value="Setting">Setting</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="login-username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              {t('username')}
            </label>
            <input
              id="login-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dhl-red/30 focus:border-dhl-red transition-all font-medium"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              {t('password')}
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dhl-red/30 focus:border-dhl-red transition-all font-medium"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="p-3 mt-4 rounded-xl text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-medium border border-red-200 dark:border-red-800">
              {errorMessage}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-dhl-red to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transform hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('signIn')
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
