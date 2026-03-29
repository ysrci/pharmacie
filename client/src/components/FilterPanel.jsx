import React from 'react';
import { Settings, MapPin } from 'lucide-react';

const FilterPanel = ({ filters, setFilters }) => {
    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="glass fade-in" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary)' }}>
                <Settings size={20} className="spin-hover" />
                <span style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.5px' }}>الإعدادات</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} style={{ color: 'var(--primary)' }} />
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)' }}>نطاق البحث</label>
                    </div>
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '8px'
                    }}>{filters.radius} كم</span>
                </div>

                <input
                    name="radius"
                    type="range"
                    min="1"
                    max="50"
                    value={filters.radius}
                    onChange={handleChange}
                    className="custom-range"
                    style={{
                        width: '100%',
                        cursor: 'pointer',
                        accentColor: 'var(--primary)'
                    }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                    <span>1 كم</span>
                    <span>50 كم</span>
                </div>
            </div>

            <style>{`
                .spin-hover {
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glass:hover .spin-hover {
                    transform: rotate(90deg);
                }
                .custom-range {
                    height: 6px;
                    border-radius: 5px;
                    appearance: none;
                    background: rgba(255,255,255,0.1);
                    outline: none;
                    transition: background 0.3s;
                }
                .custom-range:hover {
                    background: rgba(255,255,255,0.15);
                }
                .custom-range::-webkit-slider-thumb {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--primary);
                    cursor: pointer;
                    border: 3px solid #1a1a1a;
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
                    transition: all 0.2s;
                }
                .custom-range::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
                }
            `}</style>
        </div>
    );
};

export default FilterPanel;

