// client/src/components/PharmacyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { authAPI, pharmacyAPI } from '../utils/api';
import SalesPanel from './SalesPanel';
import StatsCharts from './StatsCharts';

const PharmacyDashboard = () => {
    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('inventory');

    // جلب المخزون والإحصائيات
    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('الرجاء تسجيل الدخول أولاً');
                setLoading(false);
                return;
            }
            
            // بيانات تجريبية للمخزون
            setInventory([
                { id: 1, name: 'باراسيتامول 500mg', quantity: 150, price: 20, expiry_date: '2025-12-31' },
                { id: 2, name: 'أموكسيسيلين 500mg', quantity: 80, price: 25, expiry_date: '2025-10-15' },
                { id: 3, name: 'إيبوبروفين 400mg', quantity: 200, price: 15, expiry_date: '2026-01-20' },
                { id: 4, name: 'فيتامين C', quantity: 300, price: 10, expiry_date: '2026-03-01' }
            ]);
            
            setStats({
                total_medications: 45,
                total_stock: 1250,
                avg_price: 18.5,
                expiring_soon: 3,
                total_sales_today: 1250,
                total_customers: 89
            });
            
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-6">
                ⚠️ {error}
                <button 
                    onClick={() => window.location.reload()} 
                    className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">🏥 لوحة تحكم الصيدلية</h1>
            
            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-blue-500 text-3xl mb-2">💊</div>
                    <div className="text-2xl font-bold">{stats?.total_medications || 0}</div>
                    <div className="text-gray-600">إجمالي الأدوية</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-green-500 text-3xl mb-2">📦</div>
                    <div className="text-2xl font-bold">{stats?.total_stock || 0}</div>
                    <div className="text-gray-600">إجمالي المخزون</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-yellow-500 text-3xl mb-2">💰</div>
                    <div className="text-2xl font-bold">{stats?.total_sales_today || 0} درهم</div>
                    <div className="text-gray-600">مبيعات اليوم</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-red-500 text-3xl mb-2">⚠️</div>
                    <div className="text-2xl font-bold">{stats?.expiring_soon || 0}</div>
                    <div className="text-gray-600">أدوية تنتهي قريباً</div>
                </div>
            </div>
            
            {/* التبويبات */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b">
                    <div className="flex">
                        <button
                            className={`px-6 py-3 text-right font-medium transition ${
                                activeTab === 'inventory' 
                                    ? 'text-blue-600 border-b-2 border-blue-600' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => setActiveTab('inventory')}
                        >
                            📋 المخزون
                        </button>
                        <button
                            className={`px-6 py-3 text-right font-medium transition ${
                                activeTab === 'sales' 
                                    ? 'text-blue-600 border-b-2 border-blue-600' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => setActiveTab('sales')}
                        >
                            💵 المبيعات
                        </button>
                        <button
                            className={`px-6 py-3 text-right font-medium transition ${
                                activeTab === 'stats' 
                                    ? 'text-blue-600 border-b-2 border-blue-600' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => setActiveTab('stats')}
                        >
                            📊 الإحصائيات
                        </button>
                    </div>
                </div>
                
                <div className="p-6">
                    {activeTab === 'inventory' && (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدواء</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانتهاء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {inventory.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4">{item.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-medium ${item.quantity < 50 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{item.price} درهم</td>
                                                <td className="px-6 py-4">{item.expiry_date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'sales' && <SalesPanel />}
                    
                    {activeTab === 'stats' && <StatsCharts stats={stats} />}
                </div>
            </div>
        </div>
    );
};

export default PharmacyDashboard;
