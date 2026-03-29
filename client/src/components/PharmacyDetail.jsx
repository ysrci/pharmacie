import React, { useState, useEffect } from 'react';
import { X, Phone, Clock, MapPin, Pill, Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const PharmacyDetail = ({ pharmacy, onClose, searchResults }) => {
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertStatus, setAlertStatus] = useState({});
    const { user } = useAuth();
    const { language } = useSettings();

    const t = {
        ar: {
            call: 'اتصال',
            open: 'مفتوح',
            availableMeds: 'الأدوية المتوفرة',
            loadingMeds: 'جاري تحميل الأدوية...',
            noMeds: 'لا توجد أدوية مسجلة حالياً',
            withPrescription: 'بوصفة',
            supplement: 'مكمل',
            withoutPrescription: 'بدون وصفة',
            available: 'متوفر',
            outOfStock: 'غير متوفر',
            alertSuccess: 'تم تفعيل التنبيه',
            notifyMe: 'نبهني عند التوفر',
            loginAlert: 'يرجى تسجيل الدخول لتفعيل التنبيهات',
            currency: 'د.م'
        },
        fr: {
            call: 'Appeler',
            open: 'Ouvert',
            availableMeds: 'Médicaments disponibles',
            loadingMeds: 'Chargement des médicaments...',
            noMeds: 'Aucun médicament disponible',
            withPrescription: 'Sur ordonnance',
            supplement: 'Complément',
            withoutPrescription: 'Sans ordonnance',
            available: 'Disponible',
            outOfStock: 'Indisponible',
            alertSuccess: 'Alerte activée',
            notifyMe: 'M\'alerter si disponible',
            loginAlert: 'Veuillez vous connecter pour les alertes',
            currency: 'MAD'
        }
    }[language];

    useEffect(() => {
        fetchMedications();
    }, [pharmacy.id]);

    const fetchMedications = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pharmacies/${pharmacy.id}`);
            const data = await res.json();
            setMedications(data.medications || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleCreateAlert = async (medName) => {
        if (!user) {
            alert(t.loginAlert);
            return;
        }
        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ medication_name: medName })
            });
            const data = await res.json();
            if (res.ok) {
                setAlertStatus({ ...alertStatus, [medName]: true });
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="glass fade-in" style={{
            position: 'fixed',
            [language === 'ar' ? 'left' : 'right']: '20px',
            top: '80px',
            bottom: '20px',
            width: '450px',
            zIndex: 1500,
            padding: '2rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            direction: language === 'ar' ? 'rtl' : 'ltr',
            textAlign: language === 'ar' ? 'right' : 'left'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>{pharmacy.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <MapPin size={16} />
                        <span>{pharmacy.address}</span>
                    </div>
                </div>
                <button onClick={onClose} style={{ padding: '5px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', borderRadius: '50%' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="card" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={20} color="var(--primary)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.call}</span>
                    <span style={{ fontWeight: '600' }}>{pharmacy.phone}</span>
                </div>
                <div className="card" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={20} color="var(--primary)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.open}</span>
                    <span style={{ fontWeight: '600' }}>{pharmacy.open_hours}</span>
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pill size={20} color="var(--primary)" />
                    {t.availableMeds}
                </h3>

                {loading ? (
                    <p>{t.loadingMeds}</p>
                ) : medications.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {medications.map(med => (
                            <div key={med.id} className="card" style={{
                                border: searchResults?.some(r => r.id === med.id) ? '1px solid var(--primary)' : '1px solid var(--border)',
                                background: searchResults?.some(r => r.id === med.id) ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-card)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{med.name}</span>
                                    <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{med.price} {t.currency}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span>{med.dosage} | {med.category === 'prescription' ? t.withPrescription : med.category === 'supplement' ? t.supplement : t.withoutPrescription}</span>
                                    <span style={{
                                        color: med.quantity > 5 ? '#10b981' : med.quantity > 0 ? '#f59e0b' : '#ef4444',
                                        fontWeight: '600'
                                    }}>
                                        {med.quantity > 0 ? `${t.available}: ${med.quantity}` : t.outOfStock}
                                    </span>
                                </div>

                                {med.quantity === 0 && (
                                    <button
                                        onClick={() => handleCreateAlert(med.name)}
                                        className={alertStatus[med.name] ? 'btn-outline' : 'btn-primary'}
                                        style={{ width: '100%', marginTop: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                                        disabled={alertStatus[med.name]}
                                    >
                                        {alertStatus[med.name] ? (
                                            <><CheckCircle size={16} /> {t.alertSuccess}</>
                                        ) : (
                                            <><Bell size={16} /> {t.notifyMe}</>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{t.noMeds}</p>
                )}
            </div>
        </div>
    );
};

export default PharmacyDetail;
