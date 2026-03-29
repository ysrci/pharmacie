import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [pharmacy, setPharmacy] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                        setPharmacy(data.pharmacy);
                    } else {
                        localStorage.removeItem('token');
                    }
                } catch (err) {
                    console.error(err);
                }
            }
            setLoading(false);
        };
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
        <AuthContext.Provider value={{ user, pharmacy, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
