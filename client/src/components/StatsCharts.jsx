import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { useSettings } from '../context/SettingsContext';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color, fontSize: '0.9rem' }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const SalesLineChart = ({ data }) => {
    const { language } = useSettings();
    const isAr = language === 'ar';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                    dataKey="date"
                    reversed={isAr}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <YAxis
                    orientation={isAr ? 'right' : 'left'}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align={isAr ? 'left' : 'right'} iconType="circle" />
                <Area
                    type="monotone"
                    name={isAr ? 'المبيعات' : 'Sales'}
                    dataKey="sales"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                />
                <Area
                    type="monotone"
                    name={isAr ? 'الأرباح' : 'Profit'}
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export const TopProductsChart = ({ data }) => {
    const { language } = useSettings();
    const isAr = language === 'ar';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    orientation={isAr ? 'right' : 'left'}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-main)', fontSize: 13, fontWeight: 500 }}
                    width={100}
                />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<CustomTooltip />} />
                <Bar
                    dataKey="sold"
                    name={isAr ? 'الكمية المباعة' : 'Sold Qty'}
                    fill="#3b82f6"
                    radius={[0, 10, 10, 0]}
                    barSize={20}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'][index % 5]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
