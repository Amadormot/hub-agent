import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline, Circle } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { X, Flag } from 'lucide-react';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Start and End
const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


// Component to recenter map when coordinates change
function RecenterAutomatically({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
}

// Component to fetch and calculate route through multiple points
function RouteRenderer({ waypoints, onRouteSelected }) {
    const map = useMap();
    const [routePositions, setRoutePositions] = useState([]);

    useEffect(() => {
        // We need at least 2 valid points to draw a route
        const validWaypoints = waypoints ? waypoints.filter(wp => wp !== null) : [];
        if (validWaypoints.length < 2) {
            setRoutePositions([]); // Clear route if less than 2 points
            return;
        }

        const fetchRoute = async () => {
            try {
                // Format: {lon},{lat};{lon},{lat};...
                const coordinatesString = validWaypoints
                    .map(wp => `${wp.lng},${wp.lat}`)
                    .join(';');

                const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const coordinates = route.geometry.coordinates;
                    // GeoJSON is [lon, lat], Leaflet needs [lat, lon]
                    const leafletCoords = coordinates.map(coord => [coord[1], coord[0]]);
                    setRoutePositions(leafletCoords);

                    // Notify parent of totals
                    if (onRouteSelected) {
                        onRouteSelected({
                            distance: route.distance,
                            duration: route.duration
                        });
                    }

                    // Fit bounds using route
                    const bounds = L.latLngBounds(leafletCoords);
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (error) {
                console.error("Error fetching route:", error);
            }
        };

        fetchRoute();
    }, [waypoints, map]);

    if (routePositions.length === 0) return null;

    return (
        <Polyline positions={routePositions} color="#EA580C" weight={5} opacity={0.8} />
    );
}

export function RouteMap({ latitude, longitude, popupText }) {
    if (!latitude || !longitude) return null;

    return (
        <div className="h-full w-full rounded-lg overflow-hidden z-0">
            <MapContainer
                center={[latitude, longitude]}
                zoom={13}
                scrollWheelZoom={false}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latitude, longitude]}>
                    <Popup>
                        {popupText || "Localização da Rota"}
                    </Popup>
                </Marker>
                <RecenterAutomatically lat={latitude} lng={longitude} />
            </MapContainer>
        </div>
    );
}

// Internal component to handle multiple external search queries sequentially
function BatchSearchHandler({ queries, onResultsFound }) {
    // queries is array of strings: ["City, State", "City, State", ...]
    // onResultsFound is callback with array of coords: [{lat, lng}, null, {lat, lng}] based on index

    useEffect(() => {
        const fetchAll = async () => {
            if (!queries || queries.length === 0) return;

            // We need to map undefined/empty queries to null immediately to preserve index
            const params = queries.map(q => {
                if (!q || q.length < 5) return null;
                return q;
            });

            // If all are null, return empty
            if (params.every(p => p === null)) {
                onResultsFound(Array(params.length).fill(null));
                return;
            }

            const results = await Promise.all(params.map(async (q) => {
                if (!q) return null;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                    }
                } catch (e) {
                    console.error("Geocoding error", e);
                }
                return null;
            }));
            onResultsFound(results);
        };

        const timeout = setTimeout(fetchAll, 1000); // Debounce
        return () => clearTimeout(timeout);
    }, [JSON.stringify(queries)]); // Trigger when queries array content changes

    return null;
}

export function MapPicker({ initialLat, initialLng, stops, onRouteDetailsCalculated }) {
    // stops is array of address strings passed from parent
    const [waypoints, setWaypoints] = useState([]);

    // Default center (Brazil center roughly)
    const defaultCenter = initialLat && initialLng
        ? [initialLat, initialLng]
        : [-14.2350, -51.9253]; // Brazil Center
    const defaultZoom = initialLat && initialLng ? 13 : 4;

    return (
        <div className="h-64 w-full rounded-lg overflow-hidden border border-white/20 relative z-0">
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Batch Geocoder */}
                <BatchSearchHandler
                    queries={stops}
                    onResultsFound={setWaypoints}
                />

                {/* Draw Markers for all found waypoints */}
                {waypoints.map((wp, index) => {
                    if (!wp) return null;
                    const isStart = index === 0;
                    const isEnd = index === waypoints.length - 1;

                    let markerIcon = DefaultIcon;
                    let popupText = `Parada ${index + 1}`;

                    if (isStart) {
                        markerIcon = startIcon;
                        popupText = "Origem";
                    } else if (isEnd) {
                        markerIcon = endIcon;
                        popupText = "Destino";
                    }

                    return (
                        <Marker key={`wp-${index}`} position={[wp.lat, wp.lng]} icon={markerIcon}>
                            <Popup>{popupText}</Popup>
                        </Marker>
                    );
                })}

                {/* Draw Route Line (Only if we have at least 2 points) */}
                <RouteRenderer
                    waypoints={waypoints}
                    onRouteSelected={onRouteDetailsCalculated}
                />

                {/* Helper text overlay */}
                {waypoints.filter(w => w !== null).length === 0 && (
                    <div className="absolute bottom-4 left-0 right-0 pointer-events-none flex items-center justify-center z-[500]">
                        <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] border border-white/10 shadow-lg">
                            Adicione cidades para visualizar no mapa
                        </span>
                    </div>
                )}
            </MapContainer>
        </div>
    );
}

// Read-only map for previewing a route
export function RoutePreviewMap({ stops }) {
    const [waypoints, setWaypoints] = useState([]);
    const [userLoc, setUserLoc] = useState(null);

    // Track user position
    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.error(err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <div className="h-full w-full rounded-lg overflow-hidden border border-white/20 relative z-0">
            <MapContainer
                center={[-14.2350, -51.9253]}
                zoom={4}
                dragging={true}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <BatchSearchHandler
                    queries={stops}
                    onResultsFound={setWaypoints}
                />

                {/* User Marker */}
                {userLoc && (
                    <Marker
                        position={[userLoc.lat, userLoc.lng]}
                        icon={new L.DivIcon({
                            className: 'bg-transparent',
                            html: `<div style="width:16px; height:16px; background:#3B82F6; border:2px solid white; border-radius:50%; box-shadow:0 0 8px rgba(0,0,0,0.5);"></div>`,
                            iconSize: [16, 16],
                            iconAnchor: [8, 8]
                        })}
                    />
                )}

                {/* Validation Circles */}
                {waypoints.map((wp, index) => {
                    if (!wp) return null;
                    const isStart = index === 0;
                    const isEnd = index === waypoints.length - 1;

                    if (isStart) {
                        return (
                            <Circle
                                key="start-circle"
                                center={[wp.lat, wp.lng]}
                                radius={30000} // 30km
                                pathOptions={{ color: '#22C55E', fillColor: '#22C55E', fillOpacity: 0.15, weight: 1, dashArray: '5, 5' }}
                            />
                        );
                    }
                    if (isEnd) {
                        return (
                            <Circle
                                key="end-circle"
                                center={[wp.lat, wp.lng]}
                                radius={20000} // 20km
                                pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.15, weight: 1, dashArray: '5, 5' }}
                            />
                        );
                    }
                    return null;
                })}

                {/* Draw Markers */}
                {waypoints.map((wp, index) => {
                    if (!wp) return null;
                    const isStart = index === 0;
                    const isEnd = index === waypoints.length - 1;

                    let markerIcon = DefaultIcon;
                    if (isStart) markerIcon = startIcon;
                    else if (isEnd) markerIcon = endIcon;

                    return (
                        <Marker key={`preview-wp-${index}`} position={[wp.lat, wp.lng]} icon={markerIcon} />
                    );
                })}

                {/* Draw Route Line */}
                <RouteRenderer waypoints={waypoints} />
            </MapContainer>
        </div>
    );
}
// Navigation Mode Component (Prototype)
export function NavigationMap({ stops, onExit, onFinish }) {
    const [userLocation, setUserLocation] = useState(null);
    const [waypoints, setWaypoints] = useState([]);
    const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });

    // Track User Location
    useEffect(() => {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, heading, speed } = position.coords;
                // Update implementation to handle set
                setUserLocation({ lat: latitude, lng: longitude, heading, speed });
            },
            (error) => {
                console.error("Error getting location:", error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 20000
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Component to center map on user
    function UserFollower({ location }) {
        const map = useMap();
        useEffect(() => {
            if (location) {
                map.flyTo([location.lat, location.lng], 16, { animate: true, duration: 1 });
            }
        }, [location, map]);
        return null;
    }

    return (
        <div className="fixed inset-0 z-[1000] bg-black">
            <MapContainer
                center={[-14.2350, -51.9253]}
                zoom={15}
                zoomControl={false}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Get Coords for Route */}
                <BatchSearchHandler
                    queries={stops}
                    onResultsFound={setWaypoints}
                />

                {/* Draw Route */}
                <RouteRenderer
                    waypoints={waypoints}
                    onRouteSelected={setRouteInfo}
                />

                {/* User Marker */}
                {userLocation && (
                    <>
                        <Marker
                            position={[userLocation.lat, userLocation.lng]}
                            icon={new L.DivIcon({
                                className: 'bg-transparent',
                                html: `<div style="
                                    width: 20px; 
                                    height: 20px; 
                                    background: #3B82F6; 
                                    border: 3px solid white; 
                                    border-radius: 50%; 
                                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                                "></div>`,
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                            })}
                        />
                        <UserFollower location={userLocation} />
                    </>
                )}

            </MapContainer>

            {/* Overlay UI */}
            <div className="absolute top-4 left-4 right-4 z-[1001] flex justify-between items-start pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl pointer-events-auto">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-1">Destino</div>
                    <div className="text-white font-black text-xl leading-none">
                        {stops[stops.length - 1]?.split(',')[0]}
                    </div>
                    <div className="mt-2 text-sm text-primary font-bold flex gap-3">
                        <span>{(routeInfo.distance / 1000).toFixed(1)} km</span>
                        <span className="text-white/20">|</span>
                        <span>{Math.round(routeInfo.duration / 60)} min</span>
                    </div>
                </div>

                <div
                    onClick={onExit}
                    className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer pointer-events-auto active:scale-95 transition-transform"
                >
                    <X size={24} />
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-0 right-0 z-[1001] flex flex-col items-center gap-4 pointer-events-none">
                <div className="bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold pointer-events-auto">
                    Simulação de Navegação
                </div>

                {/* Simular Chegada */}
                <button
                    onClick={onFinish}
                    className="pointer-events-auto bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-wide px-8 py-3 rounded-full shadow-lg border-2 border-green-400 animate-bounce active:scale-95 transition-transform flex items-center gap-2"
                >
                    <Flag size={20} fill="currentColor" />
                    Cheguei ao Destino
                </button>
            </div>
        </div>
    );
}
