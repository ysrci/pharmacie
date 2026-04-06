// client/src/components/SalesPanel.jsx
import React, { useState, useEffect } from 'react';
import { authAPI, pharmacyAPI } from '../utils/api';

const SalesPanel = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newSale, setNewSale] = useState({
        medication_id: '',
        quantity: 1,
        customer_name: '',
        payment_method: 'cash'
    });

    // جلب المبيعات
    const fetchSales = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('الرجاء تسجيل الدخول أولاً');
                return;
            }
            
            // مؤقتاً: عرض بيانات تجريبية
            setSales([
                { id: 1, medication_name: 'باراسيتامول', quantity: 2, total_price: 40, created_at: new Date().toISOString() },
                { id: 2, medication_name: 'أموكسيسيلين', quantity: 1, total_price: 25, created_at: new Date().toISOString() }
            ]);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // إنشاء بيع جديد
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // مؤقتاً: إضافة إلى القائمة المحلية
            const tempSale = {
                id: Date.now(),
                medication_name: newSale.medication_id || 'دواء تجريبي',
                quantity: newSale.quantity,
                total_price: newSale.quantity * 20,
                created_at: new Date().toISOString()
            };
            setSales([tempSale, ...sales]);
            setNewSale({ medication_id: '', quantity: 1, customer_name: '', payment_method: 'cash' });
            alert('تم إضافة البيع بنجاح (تجريبي)');
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    if (loading) {
        return <div className="text-center py-8">جاري التحميل...</div>;
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">💵 نظام المبيعات</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    ⚠️ {error}
                </div>
            )}
            
            {/* نموذج إضافة بيع */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">بيع جديد</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الدواء</label>
                            <input
                                type="text"
                                value={newSale.medication_id}
                                onChange={(e) => setNewSale({...newSale, medication_id: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="أدخل اسم الدواء"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                            <input
                                type="number"
                                value={newSale.quantity}
                                onChange={(e) => setNewSale({...newSale, quantity: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل</label>
                            <input
                                type="text"
                                value={newSale.customer_name}
                                onChange={(e) => setNewSale({...newSale, customer_name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="اختياري"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                            <select
                                value={newSale.payment_method}
                                onChange={(e) => setNewSale({...newSale, payment_method: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="cash">نقدي</option>
                                <option value="card">بطاقة بنكية</option>
                                <option value="insurance">تأمين صحي</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                    >
                        إتمام البيع
                    </button>
                </form>
            </div>
            
            {/* قائمة المبيعات */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <h3 className="text-xl font-semibold">آخر المبيعات</h3>
                </div>
                {sales.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">لا توجد مبيعات بعد</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدواء</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر الإجمالي</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td className="px-6 py-4">{sale.medication_name}</td>
                                        <td className="px-6 py-4">{sale.quantity}</td>
                                        <td className="px-6 py-4">{sale.total_price} درهم</td>
                                        <td className="px-6 py-4">{new Date(sale.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesPanel;
