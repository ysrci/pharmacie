// client/src/utils/api.js
const API_BASE_URL = 'http://localhost:5000/api';

// دالة مساعدة للتعامل مع الردود
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
    }
    
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
    }
    return data;
};

// دالة مساعدة لإضافة التوكن
const getHeaders = (includeAuth = true) => {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
};

// ========== API Functions ==========

// المصادقة (Auth)
export const authAPI = {
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify({ email, password })
        });
        return handleResponse(response);
    },
    
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(false),
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },
    
    getMe: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: getHeaders(true)
        });
        return handleResponse(response);
    }
};

// الصيدليات (Pharmacies)
export const pharmacyAPI = {
    getNearby: async (lat, lng, radius = 5000) => {
        const response = await fetch(`${API_BASE_URL}/pharmacies/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        return handleResponse(response);
    },
    
    searchMedication: async (lat, lng, medicationName, radius = 5000) => {
        const encodedName = encodeURIComponent(medicationName);
        const response = await fetch(`${API_BASE_URL}/pharmacies/search-medication?lat=${lat}&lng=${lng}&name=${encodedName}&radius=${radius}`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        return handleResponse(response);
    },
    
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/pharmacies/${id}`, {
            method: 'GET',
            headers: getHeaders(false)
        });
        return handleResponse(response);
    }
};

// تصدير افتراضي
const api = { authAPI, pharmacyAPI };
export default api;
