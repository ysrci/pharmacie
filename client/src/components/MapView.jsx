import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import SearchBar from './SearchBar';
import PharmacyDetail from './PharmacyDetail';
import 'leaflet/dist/leaflet.css';
import { useSettings } from '../context/SettingsContext';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords, 14);
    }, [coords, map]);
    return null;
};

const MapView = () => {
    const [pharmacies, setPharmacies] = useState([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [userLocation, setUserLocation] = useState([33.5731, -7.5898]); // Default Casablanca
    const [filters, setFilters] = useState({ category: 'all', minPrice: '', maxPrice: '', radius: 10 });
    const [searchResults, setSearchResults] = useState(null);
    const { theme } = useSettings();

    useEffect(() => {
        fetchPharmacies();
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(pos => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    }, []);

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
                // Map unique pharmacies from search results
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
        [21.0, -17.0], // South West (Lagouira area)
        [36.0, -1.0]   // North East (Oujda/Mediterranean area)
    ];

    return (
        <div style={{ height: '100vh', width: '100vw', position: 'relative', background: 'var(--bg-dark)' }}>
            {/* Floating Top Search Bar */}
            <div style={{
                position: 'fixed',
                top: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                width: '90%',
                maxWidth: '600px',
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
                    filter: theme === 'dark' ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none',
                    transition: 'filter 0.5s ease'
                }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <RecenterMap coords={userLocation} />

                {pharmacies.map(p => (
                    <Marker
                        key={p.id}
                        position={[p.lat, p.lng]}
                        eventHandlers={{
                            click: () => setSelectedPharmacy(p)
                        }}
                    >
                        <Popup>
                            <div style={{ textAlign: 'right' }}>
                                <h3 style={{ margin: '0 0 5px' }}>{p.name}</h3>
                                <p style={{ margin: '0', fontSize: '12px' }}>{p.address}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {selectedPharmacy && (
                <PharmacyDetail
                    pharmacy={selectedPharmacy}
                    onClose={() => setSelectedPharmacy(null)}
                    searchResults={searchResults?.filter(r => r.pharmacy_id === selectedPharmacy.id)}
                />
            )}
        </div>
    );
};

export default MapView;
