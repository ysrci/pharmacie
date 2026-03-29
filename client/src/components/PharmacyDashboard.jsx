import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Package, Search, AlertTriangle,
    BarChart3, ShoppingCart, History, Settings as SettingsIcon,
    Download, TrendingUp, DollarSign, Calendar, X, Globe, Moon, Sun, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { SalesLineChart, TopProductsChart } from './StatsCharts';
import SalesPanel from './SalesPanel';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PharmacyDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [medications, setMedications] = useState([]);
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const { language, theme } = useSettings();
    const [editingMed, setEditingMed] = useState(null);
    const [margin, setMargin] = useState(25);
    const [formData, setFormData] = useState({
        name: '', dosage: '', cost_price: '', price: '', quantity: '',
        min_stock_level: 5, category: 'otc', description: '', expiry_date: ''
    });
    const { pharmacy } = useAuth();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

            const [medsRes, statsRes, salesRes, settingsRes] = await Promise.all([
                fetch('/api/pharmacy/medications', { headers }),
                fetch('/api/pharmacy/stats', { headers }),
                fetch('/api/pharmacy/sales', { headers }),
                fetch('/api/pharmacy/profit-settings', { headers })
            ]);

            const [medsData, statsData, salesData, settingsData] = await Promise.all([
                medsRes.json(), statsRes.json(), salesRes.json(), settingsRes.json()
            ]);

            setMedications(medsData);
            setStats(statsData);
            setSales(salesData);
            setMargin(settingsData.default_margin_percentage);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const exportToCSV = () => {
        const rows = [
            ["التاريخ", "المنتج", "الكمية", "السعر", "الربح"],
            ...sales.map(s => [s.created_at, s.medication_name, s.quantity, s.total_price, s.profit])
        ];
        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `sales_report_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Sales Report - Saydaliya", 14, 15);

        const tableColumn = ["Date", "Product", "Qty", "Price (MAD)", "Profit (MAD)"];
        const tableRows = sales.map(s => [
            new Date(s.created_at).toLocaleString(),
            s.medication_name,
            s.quantity,
            s.total_price,
            s.profit
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save(`report_${new Date().getTime()}.pdf`);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        // If there was a body background variable, update it here
    };

    const t = {
        ar: {
            overview: 'نظرة عامة',
            newSale: 'أمر بيع جديد',
            inventory: 'المخزون',
            reports: 'التقارير',
            totalSales: 'إجمالي المبيعات (30 يوم)',
            netProfit: 'صافي الأرباح',
            stockAlerts: 'تنبيهات المخزون',
            salesAnalysis: 'تحليل المبيعات والأرباح',
            topProducts: 'أكثر المنتجات مبيعاً',
            searchInventory: 'البحث في المخزون...',
            addProduct: 'إضافة منتج',
            product: 'المنتج',
            quantity: 'الكمية',
            costPrice: 'سعر التكلفة',
            sellingPrice: 'سعر البيع',
            expectedProfit: 'الربح المتوقع',
            expiry: 'الصلاحية',
            actions: 'إجراءات',
            recentTransactions: 'سجل العمليات الأخير',
            exportCSV: 'تصدير CSV',
            exportPDF: 'تصدير PDF',
            settings: 'الإعدادات',
            language: 'اللغة',
            theme: 'المظهر',
            light: 'نهاري',
            dark: 'ليلي',
            date: 'التاريخ',
            total: 'الإجمالي',
            profit: 'الربح',
            currency: 'د.م',
            transactions: 'عملية',
            loading: 'جاري تحميل البيانات...',
            noData: 'لا توجد بيانات متاحة حالياً',
            noSales: 'لا توجد مبيعات بعد',
            editProduct: 'تعديل منتج',
            newProduct: 'إضافة منتج جديد',
            productName: 'اسم المنتج',
            dosage: 'التركيز / الحجم',
            minStock: 'الحد الأدنى للمخزون',
            expiryDate: 'تاريخ الانتهاء',
            category: 'الفئة',
            description: 'الوصف',
            save: 'حفظ البيانات',
            cancel: 'إلغاء',
            margin: 'هامش',
            categories: {
                otc: 'بدون وصفة (OTC)',
                prescription: 'بوصفة طبية',
                supplement: 'مكمل غذائي',
                beauty: 'منتجات تجميل',
                equipment: 'معدات طبية'
            }
        },
        fr: {
            overview: 'Aperçu',
            newSale: 'Vente',
            inventory: 'Stock',
            reports: 'Rapports',
            totalSales: 'Ventes Totales (30j)',
            netProfit: 'Bénéfice Net',
            stockAlerts: 'Alertes Stock',
            salesAnalysis: 'Analyse des ventes',
            topProducts: 'Top Produits',
            searchInventory: 'Chercher dans le stock...',
            addProduct: 'Ajouter Produit',
            product: 'Produit',
            quantity: 'Quantité',
            costPrice: 'Prix d\'achat',
            sellingPrice: 'Prix de vente',
            expectedProfit: 'Marge',
            expiry: 'Expiration',
            actions: 'Actions',
            recentTransactions: 'Transactions Récentes',
            exportCSV: 'Exporter CSV',
            exportPDF: 'Exporter PDF',
            settings: 'Paramètres',
            language: 'Langue',
            theme: 'Thème',
            light: 'Clair',
            dark: 'Sombre',
            date: 'Date',
            total: 'Total',
            profit: 'Profit',
            currency: 'MAD',
            transactions: 'transactions',
            loading: 'Chargement des données...',
            noData: 'Aucune donnée disponible',
            noSales: 'Aucune vente pour le moment',
            editProduct: 'Modifier le produit',
            newProduct: 'Nouveau produit',
            productName: 'Nom du produit',
            dosage: 'Dosage / Taille',
            minStock: 'Stock minimum',
            expiryDate: 'Date d\'expiration',
            category: 'Catégorie',
            description: 'Description',
            save: 'Enregistrer',
            cancel: 'Annuler',
            margin: 'Marge',
            categories: {
                otc: 'Sans ordonnance (OTC)',
                prescription: 'Sur ordonnance',
                supplement: 'Complément alimentaire',
                beauty: 'Produits de beauté',
                equipment: 'Matériel médical'
            }
        }
    };

    const currentT = t[language];

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ borderRight: language === 'ar' ? '4px solid #2563eb' : 'none', borderLeft: language === 'fr' ? '4px solid #2563eb' : 'none' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{currentT.totalSales}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.5rem 0' }}>{stats?.overall?.total_sales || 0} {currentT.currency}</div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <TrendingUp size={14} /> <span>+{stats?.overall?.transactions_count || 0} {currentT.transactions}</span>
                    </div>
                </div>
                <div className="card" style={{ borderRight: language === 'ar' ? '4px solid #10b981' : 'none', borderLeft: language === 'fr' ? '4px solid #10b981' : 'none' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{currentT.netProfit}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.5rem 0', color: '#10b981' }}>{stats?.overall?.total_profit || 0} {currentT.currency}</div>
                </div>
                <div className="card" style={{ borderRight: language === 'ar' ? '4px solid #ef4444' : 'none', borderLeft: language === 'fr' ? '4px solid #ef4444' : 'none' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{currentT.stockAlerts}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.5rem 0', color: '#ef4444' }}>{stats?.lowStock?.length || 0}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{currentT.salesAnalysis}</h3>
                    {stats?.daily?.length > 0 ? <SalesLineChart data={stats.daily} /> : <p>{currentT.noData}</p>}
                </div>
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{currentT.topProducts}</h3>
                    {stats?.topProducts?.length > 0 ? <TopProductsChart data={stats.topProducts} /> : <p>{currentT.noSales}</p>}
                </div>
            </div>
        </div>
    );

    const renderInventory = () => (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexDirection: language === 'fr' ? 'row-reverse' : 'row' }}>
                <div style={{ position: 'relative', width: '400px' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        right: language === 'ar' ? '1rem' : 'auto',
                        left: language === 'fr' ? '1rem' : 'auto',
                        top: '12px',
                        color: 'var(--text-muted)'
                    }} />
                    <input type="text" placeholder={currentT.searchInventory} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
                        paddingRight: language === 'ar' ? '2.8rem' : '1rem',
                        paddingLeft: language === 'fr' ? '2.8rem' : '1rem'
                    }} />
                </div>
                <button onClick={() => { setEditingMed(null); setFormData({ name: '', dosage: '', cost_price: '', price: '', quantity: '', min_stock_level: 5, category: 'otc', description: '', expiry_date: '' }); setShowModal(true); }} className="btn-primary">{currentT.addProduct}</button>
            </div>
            <table>
                <thead style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <tr>
                        <th style={{ textAlign: 'inherit' }}>{currentT.product}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.quantity}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.costPrice}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.sellingPrice}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.expectedProfit}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.expiry}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.actions}</th>
                    </tr>
                </thead>
                <tbody>
                    {medications.filter(m => m.name.includes(searchTerm)).map(med => (
                        <tr key={med.id}>
                            <td>{med.name} <br /><small style={{ color: 'gray' }}>{med.dosage}</small></td>
                            <td style={{ color: med.quantity <= med.min_stock_level ? 'red' : 'inherit', fontWeight: 'bold' }}>{med.quantity}</td>
                            <td>{med.cost_price} {currentT.currency}</td>
                            <td>{med.price} {currentT.currency}</td>
                            <td style={{ color: 'green' }}>+{med.price - med.cost_price} {currentT.currency}</td>
                            <td>{med.expiry_date || 'N/A'}</td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => { setEditingMed(med); setFormData({ ...med }); setShowModal(true); }}><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(med.id)} style={{ color: 'red' }}><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderReports = () => (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexDirection: language === 'fr' ? 'row-reverse' : 'row' }}>
                <h3>{currentT.recentTransactions}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={exportToCSV} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={18} /> {currentT.exportCSV}
                    </button>
                    <button onClick={exportToPDF} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} /> {currentT.exportPDF}
                    </button>
                </div>
            </div>
            <table>
                <thead style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <tr>
                        <th style={{ textAlign: 'inherit' }}>{currentT.date}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.product}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.quantity}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.total}</th>
                        <th style={{ textAlign: 'inherit' }}>{currentT.profit}</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => (
                        <tr key={sale.id}>
                            <td>
                                {new Date(sale.created_at).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR')} -
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', [language === 'ar' ? 'marginRight' : 'marginLeft']: '5px' }}>
                                    {new Date(sale.created_at).toLocaleTimeString(language === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </td>
                            <td>{sale.medication_name}</td>
                            <td>{sale.quantity}</td>
                            <td>{sale.total_price} {currentT.currency}</td>
                            <td style={{ color: 'green' }}>+{sale.profit} {currentT.currency}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="dashboard-container fade-in" style={{
            maxWidth: '1400px',
            direction: language === 'ar' ? 'rtl' : 'ltr',
            textAlign: language === 'ar' ? 'right' : 'left'
        }}>

            <div style={{
                display: 'flex',
                background: 'var(--bg-card)',
                padding: '8px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                marginBottom: '2.5rem',
                width: '100%',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', flex: 1 }}>
                    {[
                        { id: 'overview', icon: <BarChart3 size={18} />, label: currentT.overview },
                        { id: 'sales', icon: <ShoppingCart size={18} />, label: currentT.newSale },
                        { id: 'inventory', icon: <Package size={18} />, label: currentT.inventory },
                        { id: 'reports', icon: <History size={18} />, label: currentT.reports }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                                padding: '12px 30px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                transition: 'all 0.3s',
                                fontSize: '1rem',
                                fontWeight: '600',
                                flex: 1
                            }}
                        >
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>{currentT.loading}</div>
            ) : (
                <>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'inventory' && renderInventory()}
                    {activeTab === 'sales' && <SalesPanel medications={medications} onSaleComplete={fetchData} />}
                    {activeTab === 'reports' && renderReports()}
                </>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.3)', textAlign: language === 'ar' ? 'right' : 'left' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: '900' }}>{editingMed ? currentT.editProduct : currentT.newProduct}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>{currentT.productName}</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>{currentT.dosage}</label>
                                    <input type="text" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>{currentT.costPrice}</label>
                                    <input type="number" step="0.01" value={formData.cost_price} onChange={(e) => {
                                        const cost = e.target.value;
                                        const sell = cost ? Math.round(parseFloat(cost) * (1 + margin / 100)) : '';
                                        setFormData({ ...formData, cost_price: cost, price: sell });
                                    }} required />
                                </div>
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label>{currentT.sellingPrice}</label>
                                    <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required style={{ borderColor: 'var(--primary)', background: 'rgba(37, 99, 235, 0.05)' }} />
                                    <small style={{ position: 'absolute', top: '-18px', [language === 'ar' ? 'left' : 'right']: '0', color: 'var(--primary)', fontWeight: 'bold' }}>{currentT.margin} {margin}%</small>
                                </div>
                                <div className="form-group">
                                    <label>{currentT.quantity}</label>
                                    <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>{currentT.minStock}</label>
                                    <input type="number" value={formData.min_stock_level} onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>{currentT.expiryDate}</label>
                                    <input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{currentT.category}</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="otc">{currentT.categories.otc}</option>
                                    <option value="prescription">{currentT.categories.prescription}</option>
                                    <option value="supplement">{currentT.categories.supplement}</option>
                                    <option value="beauty">{currentT.categories.beauty}</option>
                                    <option value="equipment">{currentT.categories.equipment}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{currentT.description}</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ minHeight: '80px', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)', fontFamily: 'inherit' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '16px' }}>{currentT.save}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, borderRadius: '16px' }}>{currentT.cancel}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                .form-group { display: flex; flex-direction: column; gap: 0.4rem; text-align: inherit; }
                .form-group label { font-size: 0.85rem; color: var(--text-muted); font-weight: 700; }
                .form-group input, .form-group select { padding: 0.8rem 1rem; border-radius: 12px; border: 1px solid var(--border); font-family: inherit; width: 100%; box-sizing: border-box; background: var(--bg-card); color: var(--text-main); }
                table { width: 100%; border-collapse: collapse; }
                th { padding: 1rem; border-bottom: 2px solid var(--border); color: var(--text-muted); font-size: 0.85rem; }
                td { padding: 1rem; border-bottom: 1px solid var(--border); font-size: 0.95rem; }
                [data-theme='dark'] {
                    --bg-dark: #0f172a;
                    --bg-card: #1e293b;
                    --text-main: #f8fafc;
                    --text-muted: #94a3b8;
                    --border: rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    );
};

export default PharmacyDashboard;
