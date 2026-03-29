import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className="glass fade-in" style={{
            padding: '0.6rem',
            display: 'flex',
            gap: '0.8rem',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={20} style={{ position: 'absolute', right: '15px', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="ابحث عن دواء (مثل: باراسيتامول)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        border: 'none',
                        background: 'rgba(37, 99, 235, 0.03)',
                        padding: '0.8rem 3.2rem 0.8rem 1rem',
                        borderRadius: '16px',
                        fontSize: '1rem',
                        color: 'var(--text-main)',
                        width: '100%',
                        transition: 'all 0.3s'
                    }}
                />
            </div>
            <button type="submit" className="btn-primary" style={{
                padding: '0.8rem 2rem',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
                بحث
            </button>
        </form>
    );
};

export default SearchBar;
