// client/src/utils/api.js
// طبقة مركزية لجميع طلبات API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ✅ دالة مساعدة للتعامل مع الردود
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
            // إذا كان الرد ليس JSON
        }
        throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
    }
    
    return data;
};

// ✅ دالة مساعدة لإضافة التوكن
const getHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
};

// ========== API Functions ==========

// 🔐 المصادقة (Auth)
export const authAPI = {
    // تسجيل الدخول
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ email, password })
        });
        return handleResponse(response);
    },
    
    // التسجيل
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },
    
    // الحصول على بيانات المستخدم الحالي
    getMe: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: getHeaders(true)
        });
        return handleResponse(response);
    },
    
    // تغيير كلمة المرور
    changePassword: async (oldPassword, newPassword) => {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ oldPassword, newPassword })
        });
        return handleResponse(response);
    }
};

// 🗺️ الصيدليات (Pharmacies)
export const pharmacyAPI = {
    // البحث عن صيدليات قريبة
    getNearby: async (lat, lng, radius = 5000) => {
        const response = await fetch(
            `${API_BASE_URL}/pharmacies/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
            {
                method: 'GET',
                headers: getHeaders(false)
            }
        );
        return handleResponse(response);
    },
    
    // البحث عن دواء في الصيدليات القريبة
    searchMedication: async (lat, lng, medicationName, radius = 5000) => {
        const encodedName = encodeURIComponent(medicationName);
        const response = await fetch(
            `${API_BASE_URL}/pharmacies/search-medication?lat=${lat}&lng=${lng}&name=${encodedName}&radius=${radius}`,
            {
                method: 'GET',
                headers: getHeaders(false)
            }
        );
        return handleResponse(response);
    },
    
    // الحصول على تفاصيل صيدلية
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/pharmacies/${id}`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        return handleResponse(response);
    },
    
    // الحصول على مخزون صيدليتي (لصاحب الصيدلية)
    getMyInventory: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await fetch(
            `${API_BASE_URL}/pharmacies/my/inventory?${params}`,
            {
                method: 'GET',
                headers: getHeaders(true)
            }
        );
        return handleResponse(response);
    },
    
    // تحديث المخزون
    updateInventory: async (medicationId, data) => {
        const response = await fetch(`${API_BASE_URL}/pharmacies/my/inventory/${medicationId}`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    
    // إحصائيات صيدليتي
    getMyStats: async () => {
        const response = await fetch(`${API_BASE_URL}/pharmacies/my/stats`, {
            method: 'GET',
            headers: getHeaders(true)
        });
        return handleResponse(response);
    }
};

// 💊 الأدوية (Medications)
export const medicationAPI = {
    // البحث عن الأدوية (عام)
    search: async (searchTerm, filters = {}) => {
        const params = new URLSearchParams({ search: searchTerm, ...filters });
        const response = await fetch(`${API_BASE_URL}/medications/search?${params}`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        return handleResponse(response);
    },
    
    // الحصول على تفاصيل دواء
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        return handleResponse(response);
    }
};

// 🏪 المبيعات (Sales) – لصاحب الصيدلية فقط
export const saleAPI = {
    // إنشاء بيع جديد
    create: async (saleData) => {
        const response = await fetch(`${API_BASE_URL}/sales`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(saleData)
        });
        return handleResponse(response);
    },
    
    // الحصول على مبيعاتي
    getMySales: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/sales/my?${params}`, {
            method: 'GET',
            headers: getHeaders(true)
        });
        return handleResponse(response);
    }
};

// 📊 التقارير (Reports)
export const reportAPI = {
    // تقرير الأرباح
    getProfit: async (startDate, endDate) => {
        const response = await fetch(
            `${API_BASE_URL}/reports/profit?start=${startDate}&end=${endDate}`,
            {
                method: 'GET',
                headers: getHeaders(true)
            }
        );
        return handleResponse(response);
    },
    
    // تقرير الأدوية منتهية الصلاحية
    getExpiringSoon: async (days = 30) => {
        const response = await fetch(`${API_BASE_URL}/reports/expiring?days=${days}`, {
            method: 'GET',
            headers: getHeaders(true)
        });
        return handleResponse(response);
    }
};

// 📦 تنبيهات (Alerts)
export const alertAPI = {
    // الحصول على التنبيهات
    getAlerts: async () => {
        const response = await fetch(`${API_BASE_URL}/alerts`, {
            method: 'GET',
            headers: getHeaders(true)
        });
        return handleResponse(response);
    },
    
    // تأكيد قراءة التنبيه
    markAsRead: async (alertId) => {
        const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, {
            method: 'PATCH',
            headers: getHeaders(true)
        });
        return handleResponse(response);
    }
};

// دالة عامة لاختبار الاتصال
export const checkHealth = async () => {
    try {
        const response = await fetch('http://localhost:5000/health');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API health check failed:', error);
        return { success: false, error: error.message };
    }
};

export default {
    auth: authAPI,
    pharmacy: pharmacyAPI,
    medication: medicationAPI,
    sale: saleAPI,
    report: reportAPI,
    alert: alertAPI,
    checkHealth
};
