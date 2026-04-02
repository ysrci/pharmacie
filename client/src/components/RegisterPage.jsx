import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, User, Mail, Lock, Phone, MapPin, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'user', phone: '',
        address: '', lat: 36.7538, lng: 3.0588
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }));
                },
                (err) => console.log('Geolocation error:', err)
            );
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            phone: formData.phone,
            pharmacyData: formData.role === 'pharmacy' ? {
                name: formData.name,
                address: formData.address,
                lat: formData.lat,
                lng: formData.lng,
                open_hours: '08:00-22:00'
            } : null
        };

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                login(data);
                navigate(formData.role === 'pharmacy' ? '/dashboard' : '/');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('خطأ في الاتصال بالخادم');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
            <div className="glass fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary)', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Pill color="white" size={28} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>انضم إلينا</h2>
                    <p style={{ color: 'var(--text-muted)' }}>أنشئ حسابك للبحث عن الأدوية أو إدارة صيدليتك</p>
                </div>

                {error && <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', marginBottom: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'user' })}
                            style={{ flex: 1, padding: '0.6rem', background: formData.role === 'user' ? 'var(--primary)' : 'transparent', color: formData.role === 'user' ? 'white' : 'var(--text-muted)', borderRadius: '10px' }}
                        >مرافق/مريض</button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: 'pharmacy' })}
                            style={{ flex: 1, padding: '0.6rem', background: formData.role === 'pharmacy' ? 'var(--primary)' : 'transparent', color: formData.role === 'pharmacy' ? 'white' : 'var(--text-muted)', borderRadius: '10px' }}
                        >صيدلية</button>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', right: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="الاسم الكامل" style={{ paddingRight: '2.8rem' }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', right: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                        <input type="email" placeholder="البريد الإلكتروني" style={{ paddingRight: '2.8rem' }} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', right: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                        <input type="password" placeholder="كلمة المرور" style={{ paddingRight: '2.8rem' }} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Phone size={18} style={{ position: 'absolute', right: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                        <input type="tel" placeholder="رقم الهاتف" style={{ paddingRight: '2.8rem' }} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    {formData.role === 'pharmacy' && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={{ position: 'absolute', right: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="عنوان الصيدلية بالتفصيل" style={{ paddingRight: '2.8rem' }} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', textAlign: 'center' }}>سيتم استخدام موقعك الحالي كإحداثيات للصيدلية تلقائياً</p>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'جاري التحميل...' : (
                            <>
                                <span>تسجيل الحساب</span>
                                <UserPlus size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>لديك حساب بالفعل؟ </span>
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>سجل دخولك</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
