import React from 'react'
import ReactDOM from 'react-dom/client'
import 'leaflet/dist/leaflet.css'  // ✅ مهم جداً للخريطة
import './index.css'                // ✅ ملف CSS الرئيسي
import App from './App.jsx'
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
