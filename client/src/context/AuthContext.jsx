// client/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ✅ تحميل المستخدم من التوكن المخزن
    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setLoading(false);
            return;
        }
        
        try {
            setError(null);
            const response = await authAPI.getMe();
            
            if (response.success && response.data) {
                setUser(response.data);
            } else {
                // التوكن غير صالح
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (err) {
            console.error('Failed to load user:', err);
            setError(err.message);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);
    
    // ✅ تسجيل الدخول
    const login = useCallback(async (email, password) => {
        setError(null);
        setLoading(true);
        
        try {
            const response = await authAPI.login(email, password);
            
            if (response.success && response.token) {
                localStorage.setItem('token', response.token);
                setUser(response.user);
                return { success: true, user: response.user };
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);
    
    // ✅ التسجيل
    const register = useCallback(async (userData) => {
        setError(null);
        setLoading(true);
        
        try {
            const response = await authAPI.register(userData);
            
            if (response.success && response.token) {
                localStorage.setItem('token', response.token);
                setUser(response.user);
                return { success: true, user: response.user };
            } else {
                throw new Error(response.error || 'Registration failed');
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);
    
    // ✅ تسجيل الخروج
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        setError(null);
    }, []);
    
    // ✅ تغيير كلمة المرور
    const changePassword = useCallback(async (oldPassword, newPassword) => {
        setError(null);
        
        try {
            const response = await authAPI.changePassword(oldPassword, newPassword);
            return { success: response.success };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);
    
    // ✅ تحميل المستخدم عند بدء التطبيق
    useEffect(() => {
        loadUser();
    }, [loadUser]);
    
    // ✅ القيم التي سيتم توفيرها (محسنة بـ useMemo)
    const value = useMemo(() => ({
        user,
        loading,
        error,
        login,
        register,
        logout,
        changePassword,
        isAuthenticated: !!user,
        isPharmacyOwner: user?.role === 'pharmacy_owner',
        isAdmin: user?.role === 'admin'
    }), [user, loading, error, login, register, logout, changePassword]);
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
