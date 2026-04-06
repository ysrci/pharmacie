// client/src/components/MapView.jsx
import React, { useEffect, useRef, useCallback, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ✅ إصلاح أيقونات Leaflet (مشكلة شائعة)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ✅ مكون لتغيير عرض الخريطة (يتغير فقط عند تغيير الإحداثيات)
const ChangeMapView = memo(({ center, zoom }) => {
    const map = useMap();
    
    useEffect(() => {
        if (center && center[0] !== 0 && center[1] !== 0) {
            map.setView(center, zoom);
        }
    }, [map, center, zoom]);
    
    return null;
});

ChangeMapView.displayName = 'ChangeMapView';

// ✅ مكون علامة الموقع (Marker)
const LocationMarker = memo(({ position, onClick }) => {
    if (!position || position[0] === 0) return null;
    
    return (
        <Marker 
            position={position} 
            eventHandlers={{ click: onClick }}
        >
            <Popup>
                <div className="text-center">
                    <strong>📍 موقعك الحالي</strong>
                </div>
            </Popup>
        </Marker>
    );
});

LocationMarker.displayName = 'LocationMarker';

// ✅ مكون علامات الصيدليات (يستخدم React.memo لتجنب إعادة الرسم غير الضرورية)
const PharmacyMarkers = memo(({ pharmacies, onPharmacyClick }) => {
    if (!pharmacies || pharmacies.length === 0) return null;
    
    return (
        <>
            {pharmacies.map((pharmacy) => (
                <Marker
                    key={pharmacy.id}
                    position={[pharmacy.latitude, pharmacy.longitude]}
                    eventHandlers={{ click: () => onPharmacyClick(pharmacy) }}
                >
                    <Popup>
                        <div className="p-2">
                            <h3 className="font-bold text-lg">{pharmacy.name}</h3>
                            <p className="text-sm text-gray-600">{pharmacy.address}</p>
                            {pharmacy.distance && (
                                <p className="text-xs text-blue-600 mt-1">
                                    📍 {(pharmacy.distance / 1000).toFixed(1)} km
                                </p>
                            )}
                            <button 
                                onClick={() => onPharmacyClick(pharmacy)}
                                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                            >
                                عرض التفاصيل
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
});

PharmacyMarkers.displayName = 'PharmacyMarkers';

// ✅ المكون الرئيسي للخريطة
const MapView = ({ 
    userLocation, 
    pharmacies = [], 
    onPharmacyClick,
    isLoading = false,
    zoom = 13 
}) => {
    const mapRef = useRef(null);
    const [mapError, setMapError] = useState(null);
    
    // ✅ إحداثيات المركز الافتراضية (الدار البيضاء مثلاً)
    const defaultCenter = [33.5731, -7.5898];
    const center = userLocation && userLocation[0] !== 0 
        ? userLocation 
        : defaultCenter;
    
    // ✅ معالجة أخطاء الخريطة
    const handleMapError = useCallback((error) => {
        console.error('Map error:', error);
        setMapError('Failed to load map. Please check your internet connection.');
    }, []);
    
    // ✅ معالج النقر على الصيدلية (محسن بـ useCallback)
    const handlePharmacyClick = useCallback((pharmacy) => {
        if (onPharmacyClick) {
            onPharmacyClick(pharmacy);
        }
    }, [onPharmacyClick]);
    
    if (mapError) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <div className="text-center p-4">
                    <p className="text-red-500 mb-2">⚠️ {mapError}</p>
                    <button 
                        onClick={() => setMapError(null)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-600">جاري تحميل الخريطة...</p>
                    </div>
                </div>
            )}
            
            <MapContainer
                ref={mapRef}
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                whenReady={() => console.log('Map ready')}
                // ✅ منع إعادة إنشاء الخريطة عند تغيير الـ props
                key="pharmacy-map"
            >
                {/* ✅ طبقة الخريطة – استخدام tiles عادية (بدون CSS filter للوضع الليلي) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* ✅ مكون تغيير العرض */}
                <ChangeMapView center={center} zoom={zoom} />
                
                {/* ✅ علامة موقع المستخدم */}
                <LocationMarker position={userLocation} onClick={() => {}} />
                
                {/* ✅ علامات الصيدليات */}
                <PharmacyMarkers 
                    pharmacies={pharmacies} 
                    onPharmacyClick={handlePharmacyClick} 
                />
            </MapContainer>
        </div>
    );
};

// ✅ تصدير المكون مع memo لمنع إعادة الرسم غير الضرورية
export default memo(MapView);
