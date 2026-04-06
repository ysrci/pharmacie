// client/src/components/StatsCharts.jsx
import React from 'react';

const StatsCharts = ({ stats }) => {
    if (!stats) {
        return (
            <div className="text-center py-8 text-gray-500">
                لا توجد بيانات إحصائية متاحة
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">📊 الإحصائيات والتحليلات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* بطاقة المبيعات */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
                    <div className="text-4xl mb-2">💰</div>
                    <div className="text-3xl font-bold">{stats.total_sales_today || 0} درهم</div>
                    <div className="text-sm opacity-90">إجمالي مبيعات اليوم</div>
                </div>
                
                {/* بطاقة العملاء */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                    <div className="text-4xl mb-2">👥</div>
                    <div className="text-3xl font-bold">{stats.total_customers || 0}</div>
                    <div className="text-sm opacity-90">إجمالي العملاء</div>
                </div>
                
                {/* بطاقة الأدوية */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
                    <div className="text-4xl mb-2">💊</div>
                    <div className="text-3xl font-bold">{stats.total_medications || 0}</div>
                    <div className="text-sm opacity-90">الأدوية المختلفة</div>
                </div>
                
                {/* بطاقة المخزون */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
                    <div className="text-4xl mb-2">📦</div>
                    <div className="text-3xl font-bold">{stats.total_stock || 0}</div>
                    <div className="text-sm opacity-90">إجمالي القطع في المخزون</div>
                </div>
            </div>
            
            {/* معلومات إضافية */}
            <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <h4 className="font-semibold text-gray-700 mb-3">معلومات إضافية</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">متوسط سعر الدواء:</span>
                        <span className="font-medium">{stats.avg_price || 0} درهم</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">أدوية تنتهي قريباً (30 يوماً):</span>
                        <span className="font-medium text-red-500">{stats.expiring_soon || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">أدوية منخفضة المخزون (أقل من 50):</span>
                        <span className="font-medium text-orange-500">{stats.low_stock || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">آخر تحديث:</span>
                        <span className="font-medium">{new Date().toLocaleDateString('ar-MA')}</span>
                    </div>
                </div>
            </div>
            
            {/* نصائح */}
            {stats.expiring_soon > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <span className="text-yellow-600 text-xl ml-3">⚠️</span>
                        <div>
                            <h5 className="font-semibold text-yellow-800">تنبيه: أدوية تنتهي قريباً</h5>
                            <p className="text-sm text-yellow-700">
                                يوجد {stats.expiring_soon} دواء(أدوية) تنتهي صلاحيتها خلال 30 يوماً. يرجى مراجعة المخزون.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsCharts;
