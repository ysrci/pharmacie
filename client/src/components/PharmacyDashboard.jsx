import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Plus, Edit2, Trash2, Package, Search, AlertTriangle,
    BarChart3, ShoppingCart, History, Settings as SettingsIcon,
    Download, TrendingUp, DollarSign, Calendar, X, Globe, Moon, Sun, FileText, ChevronLeft, ChevronRight, Activity,
    Lock, Unlock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { SalesLineChart, TopProductsChart } from './StatsCharts';
import SalesPanel from './SalesPanel';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PharmacyDashboard = () => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('sales');
    const [medications, setMedications] = useState({ rows: [], total: 0 });
    const [sales, setSales] = useState({ rows: [], total: 0 });
    const [auditLogs, setAuditLogs] = useState({ rows: [], total: 0 });
    const [suppliers, setSuppliers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState(false);
    const [pendingTab, setPendingTab] = useState(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Pagination State
    const [medPage, setMedPage] = useState(0);
    const [salePage, setSalePage] = useState(0);
    const [auditPage, setAuditPage] = useState(0);
    const pageSize = 10;

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('medication'); // medication, supplier, order, customer
    const { theme } = useSettings();
    const [editingMed, setEditingMed] = useState(null);
    const [formData, setFormData] = useState({
        name: '', dosage: '', barcode: '', cost_price: '', price: '', quantity: '',
        min_stock_level: 5, category: 'otc', description: '', expiry_date: ''
    });
    const { pharmacy } = useAuth();

    useEffect(() => {
        fetchData();
    }, [activeTab, medPage, salePage, auditPage, debouncedSearch]);

    // --- 10-minute inactivity auto-lock ---
    const inactivityTimerRef = useRef(null);
    const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
            setIsAuthorized(false);
        }, INACTIVITY_MS);
    };

    useEffect(() => {
        if (!isAuthorized) {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            return;
        }
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(e => window.addEventListener(e, resetInactivityTimer));
        resetInactivityTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [isAuthorized]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            if (activeTab === 'overview') {
                const statsRes = await fetch('/api/pharmacy/stats', { headers });
                if (statsRes.ok) setStats(await statsRes.json());
            } else if (activeTab === 'inventory') {
                const medsRes = await fetch(`/api/pharmacy/medications?limit=${pageSize}&offset=${medPage * pageSize}&search=${debouncedSearch}`, { headers });
                if (medsRes.ok) {
                    const data = await medsRes.json();
                    setMedications({ rows: data.rows || [], total: data.total || 0 });
                }
            } else if (activeTab === 'sales') {
                // Fetch full stock for sales (no hard limit, server handles search)
                const medsRes = await fetch(`/api/pharmacy/medications?search=${debouncedSearch}`, { headers });
                if (medsRes.ok) {
                    const data = await medsRes.json();
                    setMedications({ rows: data.rows || [], total: data.total || 0 });
                }
            } else if (activeTab === 'reports') {
                const salesRes = await fetch(`/api/pharmacy/sales?limit=${pageSize}&offset=${salePage * pageSize}`, { headers });
                if (salesRes.ok) setSales(await salesRes.json());
            } else if (activeTab === 'suppliers') {
                const res = await fetch('/api/pharmacy/suppliers', { headers });
                if (res.ok) setSuppliers(await res.json());
                else setSuppliers([]);
            } else if (activeTab === 'orders') {
                const res = await fetch('/api/pharmacy/orders', { headers });
                if (res.ok) setOrders(await res.json());
                else setOrders([]);
            } else if (activeTab === 'customers') {
                const res = await fetch('/api/pharmacy/customers', { headers });
                if (res.ok) setCustomers(await res.json());
                else setCustomers([]);
            } else if (activeTab === 'audit') {
                const res = await fetch(`/api/pharmacy/audit-logs?limit=${pageSize}&offset=${auditPage * pageSize}`, { headers });
                if (res.ok) setAuditLogs(await res.json());
                else setAuditLogs({ rows: [], total: 0 });
            }

            // Always fetch alerts if needed or on specific intervals
            fetch('/api/alerts', { headers }).then(r => r.ok ? r.json() : []).then(setAlerts).catch(e => { });

        } catch (err) {
            console.error('Fetch Error:', err);
        }
        setLoading(false);
    };

    const handlePinSubmit = async (val = pinInput) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/auth/verify-pin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pin: val })
            });

            if (res.ok) {
                setIsAuthorized(true);
                setShowPinModal(false);
                setPinInput('');
                setPinError(false);
                if (pendingTab) {
                    setActiveTab(pendingTab);
                    setPendingTab(null);
                }
            } else {
                setPinError(true);
                setPinInput('');
            }
        } catch (err) {
            console.error('PIN Verification Error:', err);
            setPinError(true);
        }
    };

    const handlePinChange = (e) => {
        const val = e.target.value;
        setPinInput(val);
        if (val.length === 4) {
            handlePinSubmit(val);
        }
    };

    const requestManagerAccess = (tab) => {
        setPendingTab(tab);
        setShowPinModal(true);
    };

    const renderPinModal = () => (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(30px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 6000
        }}>
            <div className="card" style={{ width: '380px', height: '380px', textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <SettingsIcon className="text-primary" size={32} />
                </div>
                <h2 style={{ marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.5rem' }}>{t('common.managerAccess')}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>{t('common.enterPin')}</p>

                <input
                    type="password"
                    autoFocus
                    value={pinInput}
                    onChange={handlePinChange}
                    placeholder="****"
                    maxLength={4}
                    style={{
                        width: '100%', fontSize: '2.5rem', textAlign: 'center', letterSpacing: '0.8rem',
                        padding: '1.2rem', borderRadius: '20px', border: pinError ? '2px solid #ef4444' : '2px solid var(--border)',
                        background: 'rgba(0,0,0,0.05)', marginBottom: '1.5rem'
                    }}
                />
                {pinError && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>{t('common.invalidPin')}</p>}

                <button type="button" onClick={() => { setShowPinModal(false); setPendingTab(null); setPinInput(''); setPinError(false); }} className="btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>{t('common.cancel')}</button>
            </div>
        </div>
    );

    const Pagination = ({ current, total, onPageChange }) => {
        const totalPages = Math.ceil(total / pageSize);
        if (totalPages <= 1) return null;
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                    onClick={() => onPageChange(current - 1)}
                    disabled={current === 0}
                    className="btn-pagination"
                >
                    <ChevronLeft size={18} />
                </button>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{current + 1} / {totalPages}</span>
                <button
                    onClick={() => onPageChange(current + 1)}
                    disabled={current >= totalPages - 1}
                    className="btn-pagination"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        );
    };

    const openModal = (type, data = null) => {
        setModalType(type);
        setEditingMed(type === 'medication' ? data : null);
        setFormData(data || {
            name: '', dosage: '', barcode: '', cost_price: '', price: '', quantity: '',
            min_stock_level: 5, category: 'otc', description: '', expiry_date: '',
            phone: '', email: '', contact_name: '', supplier_id: '', total_amount: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (medId) => {
        if (!window.confirm(t('common.confirmDelete'))) return;
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            await fetch(`/api/pharmacy/medications/${medId}`, { method: 'DELETE', headers });
            fetchData();
        } catch (err) { console.error(err); }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            let url = '';
            let method = editingMed ? 'PUT' : 'POST';

            if (modalType === 'medication') {
                url = editingMed ? `/api/pharmacy/medications/${editingMed.id}` : '/api/pharmacy/medications';
            } else if (modalType === 'supplier') {
                url = '/api/pharmacy/suppliers';
            } else if (modalType === 'customer') {
                url = '/api/pharmacy/customers';
            }

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify({
                    ...formData,
                    // Cast numeric fields
                    cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
                    price: formData.price ? parseFloat(formData.price) : undefined,
                    quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
                    min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : undefined,
                })
            });

            if (res.ok) {
                setShowModal(false);
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Operation failed');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const renderModal = () => (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000
        }}>
            <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontWeight: 800 }}>{editingMed ? t('common.edit') : t('common.add')} {t(`dashboard.${modalType}`)}</h2>
                    <button onClick={() => setShowModal(false)} className="btn-icon"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                    {modalType === 'medication' && (
                        <>
                            <div style={{ gridColumn: '1 / span 2' }}>
                                <label className="stat-label">{t('dashboard.product')}</label>
                                <input className="search-wrapper" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="stat-label">Dosage</label>
                                <input className="search-wrapper" style={{ width: '100%' }} value={formData.dosage} onChange={e => setFormData({ ...formData, dosage: e.target.value })} />
                            </div>
                            <div>
                                <label className="stat-label">Barcode</label>
                                <input className="search-wrapper" style={{ width: '100%' }} value={formData.barcode || ''} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan or type barcode" />
                            </div>
                            <div>
                                <label className="stat-label">{t('dashboard.category')}</label>
                                <select className="search-wrapper" style={{ width: '100%' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="otc">OTC</option>
                                    <option value="prescription">Prescription</option>
                                    <option value="supplement">Supplement</option>
                                </select>
                            </div>
                            <div>
                                <label className="stat-label">{t('dashboard.costPrice')}</label>
                                <input type="number" step="0.01" className="search-wrapper" style={{ width: '100%' }} value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} required />
                            </div>
                            <div>
                                <label className="stat-label">{t('dashboard.sellingPrice')}</label>
                                <input type="number" step="0.01" className="search-wrapper" style={{ width: '100%' }} value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                            </div>
                            <div>
                                <label className="stat-label">{t('common.quantity')}</label>
                                <input type="number" className="search-wrapper" style={{ width: '100%' }} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} required />
                            </div>
                            <div>
                                <label className="stat-label">Stock Alert Level</label>
                                <input type="number" className="search-wrapper" style={{ width: '100%' }} value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: '1 / span 2' }}>
                                <label className="stat-label">{t('dashboard.expiry')}</label>
                                <input type="date" className="search-wrapper" style={{ width: '100%' }} value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
                            </div>
                        </>
                    )}

                    {(modalType === 'supplier' || modalType === 'customer') && (
                        <>
                            <div style={{ gridColumn: '1 / span 2' }}>
                                <label className="stat-label">Name</label>
                                <input className="search-wrapper" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="stat-label">Phone</label>
                                <input className="search-wrapper" style={{ width: '100%' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="stat-label">Email</label>
                                <input type="email" className="search-wrapper" style={{ width: '100%' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </>
                    )}

                    <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>{t('common.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div className="card stat-card blue">
                    <div className="stat-label">{t('dashboard.stats.total_sales')}</div>
                    <div className="stat-value">{stats?.overall?.total_sales || 0} {t('common.currency')}</div>
                    <div className="stat-delta positive">
                        <TrendingUp size={14} /> <span>+{stats?.overall?.transactions_count || 0} {t('dashboard.transactions')}</span>
                    </div>
                </div>
                <div className="card stat-card green">
                    <div className="stat-label">{t('dashboard.stats.net_profit')}</div>
                    <div className="stat-value">{stats?.overall?.total_profit || 0} {t('common.currency')}</div>
                </div>
                <div className="card stat-card red">
                    <div className="stat-label">{t('dashboard.stats.stock_alerts')}</div>
                    <div className="stat-value">{stats?.lowStock?.length || 0}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card chart-container">
                    <h3>{t('dashboard.charts.sales_trend')}</h3>
                    <div style={{ height: '320px', marginTop: '1.5rem' }}>
                        {stats?.daily?.length > 0 ? <SalesLineChart data={stats.daily} /> : <p className="no-data">{t('common.noData')}</p>}
                    </div>
                </div>
                <div className="card chart-container">
                    <h3>{t('dashboard.charts.top_products')}</h3>
                    <div style={{ height: '320px', marginTop: '1.5rem' }}>
                        {stats?.topProducts?.length > 0 ? <TopProductsChart data={stats.topProducts} /> : <p className="no-data">{t('common.noSales')}</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInventory = () => (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={t('dashboard.searchInventory')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyUp={(e) => e.key === 'Enter' && fetchData()}
                    />
                </div>
                {isAuthorized && (
                    <button onClick={() => openModal('medication')} className="btn-primary">
                        <Plus size={18} /> {t('common.add')}
                    </button>
                )}
            </div>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>{t('dashboard.product')}</th>
                            <th>{t('common.quantity')}</th>
                            <th>{t('dashboard.costPrice')}</th>
                            <th>{t('dashboard.sellingPrice')}</th>
                            {isAuthorized && <th>{t('dashboard.profit')}</th>}
                            <th>{t('dashboard.expiry')}</th>
                            {isAuthorized && <th>{t('common.actions')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {medications?.rows?.map(med => (
                            <tr key={med.id}>
                                <td>
                                    <div className="cell-title">{med.name}</div>
                                    <div className="cell-subtitle">{med.category}</div>
                                </td>
                                <td className={med.quantity <= med.min_stock_level ? 'text-danger fw-bold' : ''}>{med.quantity}</td>
                                <td>{med.cost_price} {t('common.currency')}</td>
                                <td>{med.price} {t('common.currency')}</td>
                                {isAuthorized && <td className="text-success fw-bold">+{Math.round((med.price - med.cost_price) * 100) / 100}</td>}
                                <td>{med.expiry_date || 'N/A'}</td>
                                {isAuthorized && (
                                    <td>
                                        <div className="action-btns">
                                            <button onClick={() => openModal('medication', med)} className="btn-icon"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(med.id)} className="btn-icon danger"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination current={medPage} total={medications.total} onPageChange={setMedPage} />
        </div>
    );

    const renderAudit = () => (
        <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>{t('dashboard.audit')}</h3>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>{t('common.date')}</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Target</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.rows?.map(log => (
                            <tr key={log.id}>
                                <td className="text-muted">{new Date(log.created_at).toLocaleString()}</td>
                                <td className="fw-bold">{log.user_name || 'System'}</td>
                                <td><span className="badge">{log.action}</span></td>
                                <td className="text-muted">{log.entity_type} #{log.entity_id}</td>
                                <td className="text-small">{typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination current={auditPage} total={auditLogs.total} onPageChange={setAuditPage} />
        </div>
    );

    const renderReports = () => (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <h3>{t('dashboard.reports')}</h3>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button className="btn-outline"><Download size={18} /> CSV</button>
                    <button className="btn-outline"><FileText size={18} /> PDF</button>
                </div>
            </div>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>{t('common.date')}</th>
                            <th>{t('dashboard.product')}</th>
                            <th>{t('common.quantity')}</th>
                            <th>{t('common.total')}</th>
                            <th>{t('common.profit')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.rows.map(sale => (
                            <tr key={sale.id}>
                                <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                                <td className="fw-bold">{sale.medication_name}</td>
                                <td>{sale.quantity}</td>
                                <td>{sale.total_price} {t('common.currency')}</td>
                                <td className="text-success fw-bold">+{sale.profit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination current={salePage} total={sales.total} onPageChange={setSalePage} />
        </div>
    );

    const renderSuppliers = () => (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3>{t('dashboard.suppliers')}</h3>
                <button className="btn-primary" onClick={() => openModal('supplier')}>{t('common.add')}</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map(s => (
                        <tr key={s.id}>
                            <td className="fw-bold">{s.name}</td>
                            <td>{s.contact_name}</td>
                            <td>{s.email}</td>
                            <td>{s.phone}</td>
                            <td>
                                <button className="btn-icon" onClick={() => openModal('supplier', s)}><Edit2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCustomers = () => (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3>{t('dashboard.customers')}</h3>
                <button className="btn-primary" onClick={() => openModal('customer')}>{t('common.add')}</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Added On</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map(c => (
                        <tr key={c.id}>
                            <td className="fw-bold">{c.name}</td>
                            <td>{c.phone}</td>
                            <td>{c.email}</td>
                            <td>{new Date(c.created_at).toLocaleDateString()}</td>
                            <td>
                                <button className="btn-icon" onClick={() => openModal('customer', c)}><Edit2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const publicTabs = [
        { id: 'sales', icon: <ShoppingCart size={18} />, label: t('dashboard.sales') },
        { id: 'inventory', icon: <Package size={18} />, label: t('dashboard.inventory') },
        { id: 'suppliers', icon: <Globe size={18} />, label: t('dashboard.suppliers') },
        { id: 'customers', icon: <History size={18} />, label: t('dashboard.customers') },
    ];

    const managerTabs = [
        { id: 'overview', icon: <BarChart3 size={18} />, label: t('dashboard.overview') },
        { id: 'reports', icon: <FileText size={18} />, label: t('dashboard.reports') },
        { id: 'audit', icon: <Activity size={18} />, label: t('dashboard.audit') },
    ];

    return (
        <div className="dashboard-container fade-in" dir={i18n.dir()} style={{ direction: i18n.dir() }}>
            <div className="nav-container card">
                <div className="nav-scroll">
                    {/* --- Public Tabs --- */}
                    {publicTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setMedPage(0); setSalePage(0); setAuditPage(0); }}
                            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}

                    {/* --- Separator --- */}
                    <div className="nav-separator" />

                    {/* --- Manager Group Header --- */}
                    <div
                        className={`nav-manager-header ${isAuthorized ? 'unlocked' : ''}`}
                        onClick={() => { if (!isAuthorized) requestManagerAccess(managerTabs[0].id); else setIsAuthorized(false); }}
                        title={isAuthorized ? t('common.lockManager') : t('common.managerAccess')}
                    >
                        {isAuthorized ? <Unlock size={14} /> : <Lock size={14} />}
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {isAuthorized ? t('common.manager') : t('common.manager')}
                        </span>
                    </div>

                    {/* --- Manager Tabs (shown only when authorized) --- */}
                    {managerTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (!isAuthorized) { requestManagerAccess(tab.id); }
                                else { setActiveTab(tab.id); setMedPage(0); setSalePage(0); setAuditPage(0); }
                            }}
                            className={`nav-btn manager-tab ${!isAuthorized ? 'locked' : ''} ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {!isAuthorized && <Lock size={12} style={{ opacity: 0.5 }} />}
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="main-content">
                {loading ? (
                    <div className="loading-state"><div className="spinner"></div></div>
                ) : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'inventory' && renderInventory()}
                        {activeTab === 'reports' && renderReports()}
                        {activeTab === 'audit' && renderAudit()}
                        {activeTab === 'suppliers' && renderSuppliers()}
                        {activeTab === 'customers' && renderCustomers()}
                        {activeTab === 'sales' && <SalesPanel medications={medications.rows} onSaleComplete={() => { setActiveTab('reports'); fetchData(); }} />}
                    </>
                )}
            </div>

            {showModal && renderModal()}
            {showPinModal && renderPinModal()}

            <style jsx="true">{`
                .dashboard-container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
                .nav-container { padding: 8px; margin-bottom: 2rem; }
                .nav-scroll { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; align-items: center; }
                .nav-scroll::-webkit-scrollbar { display: none; }
                .nav-btn { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 12px; border: none; background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
                .nav-btn.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
                .nav-btn:hover:not(.active) { background: rgba(0,0,0,0.05); }
                .nav-btn.manager-tab.locked { opacity: 0.55; }
                .nav-btn.manager-tab.locked:hover { opacity: 0.8; }
                .nav-separator { width: 1px; height: 32px; background: var(--border); flex-shrink: 0; margin: 0 4px; }
                .nav-manager-header { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--border); cursor: pointer; color: var(--text-muted); transition: all 0.2s; flex-shrink: 0; user-select: none; }
                .nav-manager-header.unlocked { border-color: var(--primary); color: var(--primary); background: rgba(37,99,235,0.07); }
                .nav-manager-header:hover { border-color: var(--primary); color: var(--primary); }
                
                .stat-card { padding: 1.5rem; border-left: 5px solid transparent; }
                .stat-card.blue { border-left-color: #2563eb; }
                .stat-card.green { border-left-color: #10b981; }
                .stat-card.red { border-left-color: #ef4444; }
                .stat-label { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem; }
                .stat-value { font-size: 2rem; font-weight: 800; color: var(--text-main); }
                .stat-delta { font-size: 0.85rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 4px; }
                .stat-delta.positive { color: var(--primary); }

                .search-wrapper { position: relative; width: 320px; }
                .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
                .search-wrapper input { width: 100%; padding: 10px 12px 10px 40px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main); }

                .table-responsive { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; min-width: 800px; }
                th { text-align: left; padding: 12px 16px; border-bottom: 2px solid var(--border); color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
                td { text-align: left; padding: 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
                [dir='rtl'] th, [dir='rtl'] td { text-align: right; }
                .cell-title { font-weight: 700; color: var(--text-main); }
                .cell-subtitle { font-size: 0.8rem; color: var(--text-muted); }
                
                .action-btns { display: flex; gap: 8px; }
                .btn-icon { background: transparent; border: 1px solid var(--border); padding: 8px; border-radius: 8px; cursor: pointer; color: var(--text-muted); transition: all 0.2s; }
                .btn-icon:hover { border-color: var(--primary); color: var(--primary); background: rgba(37, 99, 235, 0.05); }
                .btn-icon.danger:hover { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05); }

                .badge { background: rgba(37, 99, 235, 0.1); color: var(--primary); padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
                .loading-state { display: flex; align-items: center; justify-content: center; height: 300px; }
                .spinner { width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .btn-pagination { padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; transition: all 0.2s; }
                .btn-pagination:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-pagination:not(:disabled):hover { border-color: var(--primary); color: var(--primary); }

                .text-danger { color: #ef4444; }
                .text-success { color: #10b981; }
                .fw-bold { font-weight: 700; }
                .text-muted { color: var(--text-muted); }
                .text-small { font-size: 0.8rem; }
            `}</style>
        </div>
    );
};

export default PharmacyDashboard;
