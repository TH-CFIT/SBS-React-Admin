import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Menu, X, Sun, Moon, Globe, LogOut, LayoutDashboard, Search } from 'lucide-react';

type AdminPage = 'search' | 'dashboard';

interface AdminHeaderProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activePage, onNavigate, onLogout }) => {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

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

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 md:px-10 flex justify-between items-center sticky top-0 z-30 w-full transition-all duration-300 border-b border-gray-100 dark:border-gray-700">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-3xl md:text-4xl font-black text-dhl-red tracking-tight">SBS</span>
        <span className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">Admin Panel</span>
      </div>

      {/* Desktop Nav */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Page Navigation */}
        <nav className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
          <button
            onClick={() => onNavigate('search')}
            className={`nav-link flex items-center gap-2 ${activePage === 'search' ? 'active' : ''}`}
          >
            <Search className="w-4 h-4" />
            {t('navSearch')}
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`nav-link flex items-center gap-2 ${activePage === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {t('navDashboard')}
          </button>
        </nav>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-600" />

        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLangDropdownOpen(!isLangDropdownOpen); }}
            className="utility-button px-3 py-2 flex items-center gap-2"
          >
            <Globe className="w-4 h-4 text-dhl-red" />
            <span className="font-bold text-sm">{language.toUpperCase()}</span>
            <svg className={`w-3 h-3 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isLangDropdownOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsLangDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-30 border border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => { setLanguage('th'); setIsLangDropdownOpen(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === 'th' ? 'font-bold text-dhl-red' : ''}`}
                >
                  ภาษาไทย
                </button>
                <button
                  onClick={() => { setLanguage('en'); setIsLangDropdownOpen(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === 'en' ? 'font-bold text-dhl-red' : ''}`}
                >
                  English
                </button>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="utility-button">
          {isDarkMode ? <Sun className="w-5 h-5 text-dhl-yellow" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>

        {/* Logout */}
        <button onClick={onLogout} className="btn-primary btn-gray text-sm !py-2 !px-4 flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>

      {/* Mobile Nav Button */}
      <div className="sm:hidden">
        <button onClick={() => setIsMenuOpen(true)} className="utility-button">
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute top-0 right-0 w-3/4 max-w-sm h-full bg-white dark:bg-gray-900 shadow-2xl p-8 flex flex-col space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-dhl-red uppercase">{t('menu')}</h2>
              <button onClick={() => setIsMenuOpen(false)} className="utility-button">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={() => { onNavigate('search'); setIsMenuOpen(false); }}
              className={`w-full p-4 rounded-xl text-left border flex items-center gap-3 ${activePage === 'search' ? 'bg-dhl-red/10 border-dhl-red font-bold text-dhl-red' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <Search className="w-5 h-5" />
              {t('navSearch')}
            </button>
            <button
              onClick={() => { onNavigate('dashboard'); setIsMenuOpen(false); }}
              className={`w-full p-4 rounded-xl text-left border flex items-center gap-3 ${activePage === 'dashboard' ? 'bg-dhl-red/10 border-dhl-red font-bold text-dhl-red' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              {t('navDashboard')}
            </button>

            {/* Language */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Language / ภาษา</p>
              <button
                onClick={() => { setLanguage('th'); setIsMenuOpen(false); }}
                className={`w-full p-4 rounded-xl text-left border ${language === 'th' ? 'bg-dhl-yellow/20 border-dhl-yellow font-bold' : 'border-gray-100 dark:border-gray-800'}`}
              >
                ภาษาไทย
              </button>
              <button
                onClick={() => { setLanguage('en'); setIsMenuOpen(false); }}
                className={`w-full p-4 rounded-xl text-left border ${language === 'en' ? 'bg-dhl-yellow/20 border-dhl-yellow font-bold' : 'border-gray-100 dark:border-gray-800'}`}
              >
                English
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => { toggleTheme(); setIsMenuOpen(false); }}
              className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl font-semibold"
            >
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Logout */}
            <button
              onClick={() => { onLogout(); setIsMenuOpen(false); }}
              className="w-full p-4 rounded-xl text-center bg-dhl-red text-white font-bold flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              {t('logout')}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
