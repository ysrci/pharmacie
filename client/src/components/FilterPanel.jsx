// client/src/components/FilterPanel.jsx
import React, { useState, useCallback, memo } from 'react';

const FilterPanel = ({ onFilterChange, initialFilters = {}, isLoading = false }) => {
    const [filters, setFilters] = useState({
        radius: initialFilters.radius || 5,
        minPrice: initialFilters.minPrice || '',
        maxPrice: initialFilters.maxPrice || '',
        category: initialFilters.category || 'all'
    });
    
    const [errors, setErrors] = useState({});
    
    const categories = [
        { value: 'all', label: 'جميع الفئات' },
        { value: 'antibiotic', label: 'مضادات حيوية' },
        { value: 'painkiller', label: 'مسكنات' },
        { value: 'vitamin', label: 'فيتامينات' },
        { value: 'chronic', label: 'أمراض مزمنة' },
        { value: 'other', label: 'أخرى' }
    ];
    
    // ✅ التحقق من صحة المدخلات
    const validateFilters = useCallback((newFilters) => {
        const newErrors = {};
        
        if (newFilters.radius && (newFilters.radius < 1 || newFilters.radius > 50)) {
            newErrors.radius = 'يجب أن يكون نصف القطر بين 1 و 50 كم';
        }
        
        if (newFilters.minPrice && (newFilters.minPrice < 0 || newFilters.minPrice > 100000)) {
            newErrors.minPrice = 'السعر غير صحيح';
        }
        
        if (newFilters.maxPrice && (newFilters.maxPrice < 0 || newFilters.maxPrice > 100000)) {
            newErrors.maxPrice = 'السعر غير صحيح';
        }
        
        if (newFilters.minPrice && newFilters.maxPrice && 
            parseFloat(newFilters.minPrice) > parseFloat(newFilters.maxPrice)) {
            newErrors.minPrice = 'السعر الأدنى لا يمكن أن يكون أكبر من السعر الأقصى';
        }
        
        return newErrors;
    }, []);
    
    // ✅ معالجة تغيير الفلتر
    const handleChange = useCallback((name, value) => {
        let newValue = value;
        
        // تحويل القيم الرقمية
        if (name === 'radius') {
            newValue = value === '' ? '' : Number(value);
        }
        if (name === 'minPrice' || name === 'maxPrice') {
            newValue = value === '' ? '' : Number(value);
        }
        
        const newFilters = { ...filters, [name]: newValue };
        const newErrors = validateFilters(newFilters);
        
        setFilters(newFilters);
        setErrors(newErrors);
        
        // إذا لم يكن هناك أخطاء، قم بتطبيق الفلاتر
        if (Object.keys(newErrors).length === 0 && onFilterChange) {
            onFilterChange(newFilters);
        }
    }, [filters, onFilterChange, validateFilters]);
    
    // ✅ إعادة تعيين جميع الفلاتر
    const handleReset = useCallback(() => {
        const defaultFilters = {
            radius: 5,
            minPrice: '',
            maxPrice: '',
            category: 'all'
        };
        setFilters(defaultFilters);
        setErrors({});
        if (onFilterChange) {
            onFilterChange(defaultFilters);
        }
    }, [onFilterChange]);
    
    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">🔍 الفلاتر</h3>
                <button
                    onClick={handleReset}
                    disabled={isLoading}
                    className="text-sm text-blue-500 hover:text-blue-700"
                >
                    إعادة تعيين
                </button>
            </div>
            
            <div className="space-y-4">
                {/* نصف القطر */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        نصف القطر (كم)
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={filters.radius}
                        onChange={(e) => handleChange('radius', e.target.value)}
                        disabled={isLoading}
                        className="w-full"
                    />
                    <div className="text-center text-sm text-gray-600 mt-1">
                        {filters.radius} كم
                    </div>
                    {errors.radius && (
                        <p className="text-red-500 text-xs mt-1">{errors.radius}</p>
                    )}
                </div>
                
                {/* الفئة */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        الفئة
                    </label>
                    <select
                        value={filters.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* نطاق السعر */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            السعر الأدنى (درهم)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={filters.minPrice}
                            onChange={(e) => handleChange('minPrice', e.target.value)}
                            placeholder="0"
                            disabled={isLoading}
                            className={`
                                w-full px-3 py-2 border rounded-lg
                                ${errors.minPrice ? 'border-red-500' : 'border-gray-300'}
                            `}
                        />
                        {errors.minPrice && (
                            <p className="text-red-500 text-xs mt-1">{errors.minPrice}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            السعر الأقصى (درهم)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={filters.maxPrice}
                            onChange={(e) => handleChange('maxPrice', e.target.value)}
                            placeholder="غير محدد"
                            disabled={isLoading}
                            className={`
                                w-full px-3 py-2 border rounded-lg
                                ${errors.maxPrice ? 'border-red-500' : 'border-gray-300'}
                            `}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(FilterPanel);
