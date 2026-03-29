import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import PharmacyDashboard from './components/PharmacyDashboard';
import './index.css';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading">جاري التحميل...</div>;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <SettingsProvider>
            <AuthProvider>
                <BrowserRouter>
                    <div className="app">
                        <Navbar />
                        <Routes>
                            <Route path="/" element={<MapView />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute role="pharmacy">
                                        <PharmacyDashboard />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </SettingsProvider>
    );
}

export default App;
