import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'ar');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('language', language);
        i18n.changeLanguage(language);
        document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', language);
    }, [language]);

    return (
        <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
