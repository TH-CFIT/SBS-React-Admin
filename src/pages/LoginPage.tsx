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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-dhl-red/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-dhl-yellow/20 rounded-full blur-3xl" />
      </div>

      {/* Top-right controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
          className="utility-button px-3 py-2 flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
        >
          <Globe className="w-4 h-4 text-dhl-red" />
          <span className="text-sm font-bold">{language.toUpperCase()}</span>
        </button>
        <button onClick={toggleTheme} className="utility-button bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          {isDarkMode ? <Sun className="w-5 h-5 text-dhl-yellow" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>
      </div>

      <div className="card max-w-md w-full relative z-[1] animate-[fadeIn_0.5s_ease-out]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-dhl-red tracking-tight">SBS</h1>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-2">{t('loginTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('username')}
            </label>
            <input
              id="login-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('password')}
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Environment */}
          <div>
            <label htmlFor="login-environment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Environment
            </label>
            <select
              id="login-environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="input-field cursor-pointer"
            >
              <option value="Prod">Production</option>
              <option value="Test">Test</option>
            </select>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="p-3 rounded-lg text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-medium border border-red-200 dark:border-red-800">
              {errorMessage}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary btn-red text-lg"
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
