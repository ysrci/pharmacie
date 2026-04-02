import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const SalesPanel = ({ medications, onSaleComplete }) => {
    const { t, i18n } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { language } = useSettings();

    const filteredMeds = medications.filter(m =>
        (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.barcode && m.barcode === searchTerm)) && m.quantity > 0
    );

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Priority 1: Exact barcode match
            const barcodeMatch = filteredMeds.find(m => m.barcode === searchTerm);
            if (barcodeMatch) {
                addToCart(barcodeMatch);
                setSearchTerm('');
                return;
            }

            // Priority 2: Only one item in filtered list
            if (filteredMeds.length === 1) {
                addToCart(filteredMeds[0]);
                setSearchTerm('');
            }
        }
    };

    const addToCart = (med) => {
        const existing = cart.find(item => item.id === med.id);
        if (existing) {
            updateQuantity(med.id, 1);
        } else {
            setCart([...cart, { ...med, cartQuantity: 1 }]);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, Math.min(item.quantity, item.cartQuantity + delta));
                return { ...item, cartQuantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            for (const item of cart) {
                await fetch('/api/pharmacy/sales', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        medication_id: item.id,
                        quantity: item.cartQuantity
                    })
                });
            }
            setSuccess(true);
            setCart([]);
            setTimeout(() => {
                setSuccess(false);
                onSaleComplete();
            }, 2000);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', height: 'calc(100vh - 250px)', direction: i18n.dir() }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', [i18n.dir() === 'rtl' ? 'right' : 'left']: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder={t('dashboard.searchSale')}
                        style={{ [i18n.dir() === 'rtl' ? 'paddingRight' : 'paddingLeft']: '2.8rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {filteredMeds.map(med => (
                        <div key={med.id} className="glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)', textAlign: 'inherit' }}>
                            <div>
                                <h4 style={{ margin: '0 0 0.2rem' }}>{med.name}</h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('common.quantity')}: {med.quantity}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--primary)' }}>{med.price} {t('common.currency')}</div>
                            </div>
                            <button
                                onClick={() => addToCart(med)}
                                className="btn-primary"
                                style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                            >
                                {t('dashboard.addToCart')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--primary)', textAlign: 'inherit' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <ShoppingCart size={20} />
                    {t('dashboard.cartTitle')}
                </h3>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {cart.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>{t('dashboard.emptyCart')}</p>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.price} × {item.cartQuantity}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '4px', background: 'var(--bg-dark)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Minus size={14} /></button>
                                    <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.cartQuantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '4px', background: 'var(--bg-dark)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Plus size={14} /></button>
                                    <button onClick={() => removeFromCart(item.id)} style={{ padding: '4px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px dashed var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
                        <span>{t('common.total')}:</span>
                        <span>{total} {t('common.currency')}</span>
                    </div>
                    {success ? (
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={20} />
                            <span>{t('dashboard.saleSuccess')}</span>
                        </div>
                    ) : (
                        <button
                            disabled={cart.length === 0 || loading}
                            onClick={handleCheckout}
                            className="btn-primary"
                            style={{ width: '100%', padding: '1rem' }}
                        >
                            {loading ? t('common.processing') : t('dashboard.confirmSale')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesPanel;
