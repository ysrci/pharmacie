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

            {/* Floating Square Glassmorphism Settings Panel */}
            {showSettings && (
                <div
                    ref={sidebarRef}
                    style={{
                        position: 'fixed',
                        top: '70px',
                        right: '20px',
                        width: '310px',
                        background: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(28px)',
                        WebkitBackdropFilter: 'blur(28px)',
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                        borderRadius: '24px',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.15)',
                        zIndex: 5000,
                        padding: '1.6rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.6rem',
                        animation: 'settingsPopIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                    }}
                    className="glass-settings-popup"
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: '800', color: 'var(--primary)', margin: 0, fontSize: '1rem', letterSpacing: '0.02em' }}>
                            {currentT.settings}
                        </h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            style={{
                                background: 'rgba(0,0,0,0.08)',
                                border: 'none',
                                borderRadius: '10px',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '-0.5rem 0' }} />

                    {/* Language */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <Globe size={14} /> {currentT.language}
                        </label>
                        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.08)', padding: '5px', borderRadius: '14px' }}>
                            <button
                                onClick={() => setLanguage('ar')}
                                style={{ flex: 1, background: language === 'ar' ? 'var(--primary)' : 'transparent', color: language === 'ar' ? 'white' : 'var(--text-muted)', borderRadius: '10px', padding: '8px', transition: 'all 0.25s', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                            >
                                العربية
                            </button>
                            <button
                                onClick={() => setLanguage('fr')}
                                style={{ flex: 1, background: language === 'fr' ? 'var(--primary)' : 'transparent', color: language === 'fr' ? 'white' : 'var(--text-muted)', borderRadius: '10px', padding: '8px', transition: 'all 0.25s', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                            >
                                Français
                            </button>
                        </div>
                    </div>

                    {/* Theme */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />} {currentT.theme}
                        </label>
                        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.08)', padding: '5px', borderRadius: '14px' }}>
                            <button
                                onClick={() => setTheme('light')}
                                style={{ flex: 1, background: theme === 'light' ? 'var(--primary)' : 'transparent', color: theme === 'light' ? 'white' : 'var(--text-muted)', borderRadius: '10px', padding: '8px', transition: 'all 0.25s', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                            >
                                {currentT.light}
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                style={{ flex: 1, background: theme === 'dark' ? 'var(--primary)' : 'transparent', color: theme === 'dark' ? 'white' : 'var(--text-muted)', borderRadius: '10px', padding: '8px', transition: 'all 0.25s', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                            >
                                {currentT.dark}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                [data-theme='dark'] .glass-settings-popup {
                    background: rgba(15, 23, 42, 0.55) !important;
                    border-color: rgba(255,255,255,0.1) !important;
                }
                @keyframes settingsPopIn {
                    from { opacity: 0; transform: scale(0.92) translateY(-8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
