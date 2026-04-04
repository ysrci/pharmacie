import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [pharmacy, setPharmacy] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const data = await apiFetch('/api/auth/me');
                setUser(data.user);
                setPharmacy(data.pharmacy);
            } catch (err) {
                console.error('Auth Check Failed:', err.message);
                localStorage.removeItem('token');
                setUser(null);
                setPharmacy(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (data) => {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setPharmacy(data.pharmacy);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setPharmacy(null);
    };

    return (
        <AuthContext.Provider value={{ user, pharmacy, login, logout, loading, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
