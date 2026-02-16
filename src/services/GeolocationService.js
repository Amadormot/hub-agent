/**
 * Geolocation Service for Moto Hub Brasil
 * Handles location fetching and distance calculations (Haversine formula).
 */

export const GeolocationService = {
    // Get current position with Promise wrapper
    getCurrentPosition: (forceSimulate = false) => {
        return new Promise((resolve, reject) => {
            if (forceSimulate) {
                // Determine if we should mock near or far
                // forceSimulate can be boolean or the type string
                const type = (typeof forceSimulate === 'string') ? forceSimulate : 'near';

                if (type === 'far') {
                    // Manaus, AM (Far away from almost anything)
                    resolve({
                        lat: -3.1190,
                        lng: -60.0217,
                        accuracy: 10,
                        isSimulated: true,
                        simulationType: 'far'
                    });
                } else {
                    // Gramado, RS (Near the example routes)
                    resolve({
                        lat: -29.3587,
                        lng: -50.7766,
                        accuracy: 10,
                        isSimulated: true,
                        simulationType: 'near'
                    });
                }
                return;
            }

            if (!navigator.geolocation) {
                reject({ code: 0, message: "Geolocalização não suportada." });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    let msg = "Erro desconhecido.";
                    if (error.code === 1) msg = "Permissão de GPS negada.";
                    else if (error.code === 2) msg = "Localização indisponível.";
                    else if (error.code === 3) msg = "Tempo esgotado ao buscar GPS.";
                    reject({ code: error.code, message: msg });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 0
                }
            );
        });
    },

    // Calculate distance between two points in km (Haversine Formula)
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    },

    // Check if user is within radius (in km) of target
    isWithinRadius: (userLat, userLng, targetLat, targetLng, radiusKm = 5) => {
        // For development/demo without GPS, we can inject a bypass check here if needed
        // or ensure the mock data matches the user location.
        // But for production logic:
        const distance = GeolocationService.calculateDistance(userLat, userLng, targetLat, targetLng);
        console.log(`[GeoService] Distance to target: ${distance.toFixed(2)}km (Radius: ${radiusKm}km)`);
        return distance <= radiusKm;
    }
};

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
