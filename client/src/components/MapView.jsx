import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import SearchBar from './SearchBar';
import PharmacyDetail from './PharmacyDetail';
import 'leaflet/dist/leaflet.css';
import {
    Navigation, X, Globe, Map as MapIcon
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

// --- Modern High-Fidelity Icons ---
const pharmacyIcon = (theme) => L.divIcon({
    className: 'custom-pharmacy-icon',
    html: `
        <div class="marker-container ${theme}">
            <div class="marker-shadow"></div>
            <div class="marker-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20M2 12h20"/>
                </svg>
            </div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35]
});

const userIcon = L.divIcon({
    className: 'custom-user-icon',
    html: `
        <div class="user-marker">
            <div class="user-pulse"></div>
            <div class="user-dot"></div>
        </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const RecenterMap = ({ coords, zoom = 14 }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, zoom);
    }, [coords, map, zoom]);
    return null;
};


const MapView = () => {
    const [pharmacies, setPharmacies] = useState([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [userLocation, setUserLocation] = useState([33.5731, -7.5898]); // Default Casablanca
    const [mapCenter, setMapCenter] = useState(null);
    const [filters, setFilters] = useState({ category: 'all', minPrice: '', maxPrice: '', radius: 10 });
    const [searchResults, setSearchResults] = useState(null);
    const { theme } = useSettings();

    useEffect(() => {
        fetchPharmacies();
        handleLocateMe();
    }, []);

    const handleLocateMe = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(pos => {
                const coords = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(coords);
                setMapCenter(coords);
            });
        }
    };


    const fetchPharmacies = async (query = '') => {
        try {
            let url = '/api/pharmacies';
            if (query) {
                url = `/api/medications/search?q=${query}&category=${filters.category}&minPrice=${filters.minPrice}&maxPrice=${filters.maxPrice}&lat=${userLocation[0]}&lng=${userLocation[1]}&radius=${filters.radius}`;
            }
            const res = await fetch(url);
            const data = await res.json();

            if (query) {
                setSearchResults(data);
                const uniquePharmacies = [];
                const seenIds = new Set();
                data.forEach(item => {
                    if (!seenIds.has(item.pharmacy_id)) {
                        seenIds.add(item.pharmacy_id);
                        uniquePharmacies.push({
                            id: item.pharmacy_id,
                            name: item.pharmacy_name,
                            lat: item.lat,
                            lng: item.lng,
                            address: item.address,
                            phone: item.pharmacy_phone,
                            open_hours: item.open_hours
                        });
                    }
                });
                setPharmacies(uniquePharmacies);
            } else {
                setPharmacies(data);
                setSearchResults(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const moroccoBounds = [
        [21.0, -17.0],
        [36.0, -1.0]
    ];

    return (
        <div style={{ height: '100vh', width: '100vw', position: 'relative', background: theme === 'dark' ? '#1a1c1e' : '#f8f9fa' }}>
            {/* Top Search Bar */}
            <div style={{
                position: 'fixed',
                top: '25px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                width: '90%',
                maxWidth: '580px',
            }}>
                <SearchBar onSearch={fetchPharmacies} />
            </div>

            <MapContainer
                center={userLocation}
                zoom={13}
                zoomControl={false}
                maxBounds={moroccoBounds}
                maxBoundsViscosity={1.0}
                minZoom={5}
                maxZoom={18}
                style={{
                    height: '100%',
                    width: '100%',
                    background: theme === 'dark' ? '#1a1c1e' : '#f8f9fa'
                }}
            >
                <TileLayer
                    url={theme === 'dark'
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <RecenterMap coords={mapCenter} />

                {/* User Location Marker */}
                <Marker position={userLocation} icon={userIcon} />

                {pharmacies.map(p => (
                    <Marker
                        key={p.id}
                        position={[p.lat, p.lng]}
                        icon={pharmacyIcon(theme)}
                        eventHandlers={{
                            click: () => setSelectedPharmacy(p)
                        }}
                    >
                        <Popup className="modern-popup">
                            <div className="popup-content">
                                <h3>{p.name}</h3>
                                <p>{p.address}</p>
                                <div className="popup-meta">
                                    <span>🕒 {p.open_hours || '08:00 - 22:00'}</span>
                                </div>
                                <button className="btn-detail" onClick={() => setSelectedPharmacy(p)}>
                                    عرض التفاصيل
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Locate Me Button */}
            <button
                onClick={handleLocateMe}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    zIndex: 1000,
                    width: '56px',
                    height: '56px',
                    borderRadius: '20px',
                    background: theme === 'dark' ? '#2d3436' : 'white',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                className="locate-me-btn"
            >
                <Navigation size={24} fill="currentColor" fillOpacity={0.2} />
            </button>


            {selectedPharmacy && (
                <PharmacyDetail
                    pharmacy={selectedPharmacy}
                    onClose={() => setSelectedPharmacy(null)}
                    searchResults={searchResults?.filter(r => r.pharmacy_id === selectedPharmacy.id)}
                />
            )}

            <style jsx="true">{`
                /* Marker Styles */
                .marker-container { position: relative; width: 40px; height: 40px; }
                .marker-shadow { position: absolute; bottom: 0; left: 50%; width: 10px; height: 4px; background: rgba(0,0,0,0.2); border-radius: 50%; transform: translateX(-50%); filter: blur(2px); }
                .marker-pill { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 10px; border-radius: 18px 18px 18px 0; border: 3px solid white; box-shadow: 0 8px 16px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .marker-container.dark .marker-pill { border-color: #2d3436; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
                .marker-container:hover .marker-pill { transform: translateX(-50%) translateY(-5px) scale(1.1); background: #059669; }

                /* User Marker */
                .user-marker { position: relative; width: 30px; height: 30px; }
                .user-dot { position: absolute; top: 50%; left: 50%; width: 14px; height: 14px; background: #2563eb; border: 3px solid white; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
                .user-pulse { position: absolute; top: 50%; left: 50%; width: 30px; height: 30px; background: rgba(37,99,235,0.2); border-radius: 50%; transform: translate(-50%, -50%); animation: pulse 2s infinite; }
                @keyframes pulse { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }

                /* Modern Popup */
                .modern-popup .leaflet-popup-content-wrapper { border-radius: 20px; padding: 0; overflow: hidden; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .dark .modern-popup .leaflet-popup-content-wrapper { background: rgba(28, 30, 32, 0.95); border-color: rgba(255,255,255,0.05); }
                .modern-popup .leaflet-popup-content { margin: 0; width: 220px !important; }
                .modern-popup .leaflet-popup-tip { background: rgba(255, 255, 255, 0.9); }
                .dark .modern-popup .leaflet-popup-tip { background: rgba(28, 30, 32, 0.95); }

                .popup-content { padding: 1.2rem; text-align: right; }
                .popup-content h3 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 800; color: var(--text-main); }
                .popup-content p { margin: 0 0 1rem; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
                .popup-meta { font-size: 0.75rem; color: #10b981; margin-bottom: 1rem; font-weight: 600; }
                .btn-detail { width: 100%; padding: 8px; background: var(--primary); color: white; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                .btn-detail:hover { background: #1d4ed8; transform: translateY(-1px); }
            `}</style>
        </div>
    );
};

export default MapView;

