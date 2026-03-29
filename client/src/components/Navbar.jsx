import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Pill, LogOut, LayoutDashboard, Map as MapIcon, User, Settings as SettingsIcon, X, Globe, Moon, Sun } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { language, setLanguage, theme, setTheme } = useSettings();
    const [showSettings, setShowSettings] = useState(false);
    const navigate = useNavigate();
    const sidebarRef = useRef();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Click outside logic
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setShowSettings(false);
            }
        };
        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSettings]);

    const currentT = {
        ar: {
            settings: 'الإعدادات',
            language: 'اللغة',
            theme: 'المظهر',
            light: 'نهاري',
            dark: 'ليلي',
            map: 'الخريطة',
            dashboard: 'لوحة التحكم',
            logout: 'خروج',
            login: 'دخول / تسجيل'
        },
        fr: {
            settings: 'Paramètres',
            language: 'Langue',
            theme: 'Thème',
            light: 'Clair',
            dark: 'Sombre',
            map: 'Carte',
            dashboard: 'Tableau de bord',
            logout: 'Déconnexion',
            login: 'Connexion / Inscription'
        }
    }[language];

    return (
        <nav style={{
            position: 'fixed',
            top: '20px',
            right: '25px',
            padding: '5px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            zIndex: 3000,
            background: 'transparent'
        }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <Link to="/" className="btn-nav" title={currentT.map}>
                    <MapIcon size={22} />
                </Link>

                <button onClick={() => setShowSettings(!showSettings)} className="btn-nav" title={currentT.settings}>
                    <SettingsIcon size={22} />
                </button>

                {user ? (
                    <>
                        {user.role === 'pharmacy' && (
                            <Link to="/dashboard" className="btn-nav" title={currentT.dashboard}>
                                <LayoutDashboard size={22} />
                            </Link>
                        )}
                        <button onClick={handleLogout} className="btn-nav" title={currentT.logout} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                            <LogOut size={22} />
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="btn-nav-premium" title={currentT.login}>
                        <User size={22} />
                    </Link>
                )}
            </div>

            {/* Global Settings Sidebar */}
            <div ref={sidebarRef} style={{
                position: 'fixed',
                top: 0,
                right: showSettings ? 0 : '-400px',
                width: '350px',
                height: '100%',
                background: 'rgba(var(--bg-card-rgb), 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                zIndex: 5000,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
                borderLeft: '1px solid var(--border)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column'
            }} className="glass-sidebar">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontWeight: '900', color: 'var(--primary)' }}>{currentT.settings}</h2>
                    <button onClick={() => setShowSettings(false)} className="btn-nav" style={{ padding: '8px' }}><X /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            <Globe size={18} /> {currentT.language}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '6px', borderRadius: '16px' }}>
                            <button onClick={() => setLanguage('ar')} style={{ flex: 1, background: language === 'ar' ? 'var(--primary)' : 'transparent', color: language === 'ar' ? 'white' : 'inherit', borderRadius: '10px', padding: '10px', transition: 'all 0.3s' }}>العربية</button>
                            <button onClick={() => setLanguage('fr')} style={{ flex: 1, background: language === 'fr' ? 'var(--primary)' : 'transparent', color: language === 'fr' ? 'white' : 'inherit', borderRadius: '10px', padding: '10px', transition: 'all 0.3s' }}>Français</button>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />} {currentT.theme}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '6px', borderRadius: '16px' }}>
                            <button onClick={() => setTheme('light')} style={{ flex: 1, background: theme === 'light' ? 'var(--primary)' : 'transparent', color: theme === 'light' ? 'white' : 'inherit', borderRadius: '10px', padding: '10px', transition: 'all 0.3s' }}>{currentT.light}</button>
                            <button onClick={() => setTheme('dark')} style={{ flex: 1, background: theme === 'dark' ? 'var(--primary)' : 'transparent', color: theme === 'dark' ? 'white' : 'inherit', borderRadius: '10px', padding: '10px', transition: 'all 0.3s' }}>{currentT.dark}</button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .btn-nav {
                  color: var(--text-muted);
                  padding: 10px;
                  border-radius: 12px;
                  transition: all 0.2s;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: none;
                  border: none;
                  cursor: pointer;
                }
                .btn-nav:hover {
                  background: rgba(255, 255, 255, 0.1);
                  color: var(--primary);
                }
                .btn-nav-premium {
                  color: var(--text-main);
                  padding: 10px;
                  border-radius: 12px;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  background: rgba(16, 185, 129, 0.1);
                  border: 1px solid rgba(16, 185, 129, 0.2);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  text-decoration: none;
                }
                .btn-nav-premium:hover {
                  background: var(--primary);
                  color: white;
                  transform: translateY(-2px);
                  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
                }
                [data-theme='dark'] .glass-sidebar {
                    background: rgba(15, 23, 42, 0.7) !important;
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
