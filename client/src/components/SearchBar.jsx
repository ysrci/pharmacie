// client/src/components/SearchBar.jsx
import React, { useState, useCallback, memo } from 'react';

const SearchBar = ({ onSearch, isLoading = false, placeholder = 'ابحث عن دواء...' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    
    // ✅ معالجة تغيير النص
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        // مسح الخطأ عندما يبدأ المستخدم في الكتابة
        if (error) setError(null);
    }, [error]);
    
    // ✅ التحقق من صحة الإدخال
    const validateSearch = useCallback((term) => {
        if (!term || term.trim().length === 0) {
            return { valid: false, error: 'الرجاء إدخال اسم الدواء' };
        }
        
        if (term.trim().length < 2) {
            return { valid: false, error: 'الرجاء إدخال حرفين على الأقل' };
        }
        
        if (term.trim().length > 100) {
            return { valid: false, error: 'اسم الدواء طويل جداً (الحد الأقصى 100 حرف)' };
        }
        
        return { valid: true };
    }, []);
    
    // ✅ معالجة البحث
    const handleSearch = useCallback(async () => {
        const validation = validateSearch(searchTerm);
        
        if (!validation.valid) {
            setError(validation.error);
            return;
        }
        
        setError(null);
        setIsSearching(true);
        
        try {
            await onSearch(searchTerm.trim());
        } catch (err) {
            setError(err.message || 'حدث خطأ أثناء البحث');
        } finally {
            setIsSearching(false);
        }
    }, [searchTerm, onSearch, validateSearch]);
    
    // ✅ معالجة الضغط على Enter
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);
    
    const isDisabled = isLoading || isSearching;
    
    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    className={`
                        flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                        transition-colors duration-200
                        ${error 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }
                        ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                    `}
                    aria-label="بحث عن دواء"
                />
                
                <button
                    onClick={handleSearch}
                    disabled={isDisabled}
                    className={`
                        px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
                        transition-all duration-200
                        ${isDisabled 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-blue-600 active:transform active:scale-95'
                        }
                    `}
                    aria-label="بحث"
                >
                    {isSearching ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>جاري البحث...</span>
                        </div>
                    ) : (
                        '🔍 بحث'
                    )}
                </button>
            </div>
            
            {/* ✅ عرض الخطأ بشكل واضح */}
            {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <span className="font-medium">⚠️ خطأ:</span> {error}
                </div>
            )}
        </div>
    );
};

export default memo(SearchBar);
