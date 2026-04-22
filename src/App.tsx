import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AdminHeader } from './components/AdminHeader';

import { LoginPage } from './pages/LoginPage';
import { SearchPage } from './pages/SearchPage';
import { DashboardPage } from './pages/DashboardPage';

type AdminPage = 'search' | 'dashboard';

const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('dbs_admin_logged_in') === 'true';
  });
  const [activePage, setActivePage] = useState<AdminPage>('search');

  // Apply saved theme on mount
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dbs_admin_logged_in');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-[-1] bg-cover bg-center blur-1xl opacity-70 scale-100" style={{ backgroundImage: "url('/SBS_Background.jpg')" }} />
        <div className="fixed inset-0 z-[-1] bg-white/60 dark:bg-gray-200/95 pointer-events-none" />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans relative">
      <div className="fixed inset-0 z-[-1] bg-cover bg-center blur-1xl opacity-70 scale-100" style={{ backgroundImage: "url('/SBS_Background.jpg')" }} />
      <div className="fixed inset-0 z-[-1] bg-white/60 dark:bg-gray-200/95 pointer-events-none" />
      <AdminHeader
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
      />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-7xl">
        {activePage === 'dashboard' ? <DashboardPage /> : <SearchPage />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
