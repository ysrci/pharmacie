import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Mail, Lock, LogIn, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                login(data);
                navigate(data.user.role === 'pharmacy' ? '/dashboard' : '/');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary)', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Pill color="white" size={28} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>مرحباً بك مجدداً</h2>
                    <p style={{ color: 'var(--text-muted)' }}>سجل دخولك للوصول إلى مميزات صيدلية</p>
                </div>

                {error && <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.8rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', right: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                        <input
                            type="email"
                            placeholder="البريد الإلكتروني"
                            style={{ paddingRight: '2.8rem' }}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', right: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            placeholder="كلمة المرور"
                            style={{ paddingRight: '2.8rem' }}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem' }} disabled={loading}>
                        {loading ? 'جاري التحويل...' : (
                            <>
                                <span>دخول</span>
                                <LogIn size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ليس لديك حساب؟ </span>
                    <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        إنشاء حساب جديد
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
