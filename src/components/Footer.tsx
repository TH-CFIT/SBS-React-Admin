import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t, getLink } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-12 mt-auto border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="space-y-6">
            <h3 className="font-bold tracking-wider uppercase text-sm border-b border-dhl-red pb-2 w-fit text-gray-800 dark:text-gray-200">
              {t('contactSupport')}
            </h3>
            <ul className="space-y-4">
              <li>
                <a href={getLink('contactUs')} target="_blank" rel="noopener noreferrer" className="hover:text-dhl-red transition-colors text-sm flex items-center gap-2">
                  <span className="w-1 h-1 bg-dhl-red rounded-full" />
                  {t('contactUs')}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold tracking-wider uppercase text-sm border-b border-dhl-red pb-2 w-fit text-gray-800 dark:text-gray-200">
              {t('legal')}
            </h3>
            <ul className="space-y-4">
              {(['termsOfUse', 'privacyNotice', 'fraudAwareness', 'legalNotice'] as const).map((key) => (
                <li key={key}>
                  <a href={getLink(key)} target="_blank" rel="noopener noreferrer" className="hover:text-dhl-red transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-dhl-red rounded-full" />
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold tracking-wider uppercase text-sm border-b border-dhl-red pb-2 w-fit text-gray-800 dark:text-gray-200">
              DHL
            </h3>
            <ul className="space-y-4">
              {(['dhlExpress', 'aboutDhl', 'press'] as const).map((key) => (
                <li key={key}>
                  <a href={getLink(key)} target="_blank" rel="noopener noreferrer" className="hover:text-dhl-red transition-colors text-sm flex items-center gap-2">
                    <span className="w-1 h-1 bg-dhl-red rounded-full" />
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 flex flex-col items-center gap-4 text-xs font-medium uppercase tracking-widest">
          <p className="text-center">
            &copy; {currentYear} DHL Express. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};
