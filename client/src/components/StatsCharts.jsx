import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useSettings } from '../context/SettingsContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export const SalesLineChart = ({ data }) => {
    const { language } = useSettings();
    const t = {
        ar: { sales: 'المبيعات (د.م)', profit: 'الأرباح (د.م)' },
        fr: { sales: 'Ventes (MAD)', profit: 'Bénéfices (MAD)' }
    }[language];

    const chartData = {
        labels: data.map(d => d.date),
        datasets: [
            {
                label: t.sales,
                data: data.map(d => d.sales),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: t.profit,
                data: data.map(d => d.profit),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                rtl: language === 'ar',
                labels: { font: { family: language === 'ar' ? 'Noto Kufi Arabic' : 'Inter, system-ui' } }
            },
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true }
        }
    };

    return <Line data={chartData} options={options} />;
};

export const TopProductsChart = ({ data }) => {
    const { language } = useSettings();
    const label = language === 'ar' ? 'الكمية المباعة' : 'Quantité vendue';

    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                label: label,
                data: data.map(d => d.sold),
                backgroundColor: '#3b82f6',
                borderRadius: 8,
            }
        ],
    };

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: { beginAtZero: true },
            y: {
                grid: { display: false },
                ticks: { font: { family: language === 'ar' ? 'Noto Kufi Arabic' : 'Inter, system-ui' } }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};
