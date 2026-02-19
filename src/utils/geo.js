import { Geolocation } from '@capacitor/geolocation';

// Haversine formula to calculate distance between two points in km
export function calculateDistance(lat1, lon1, lat2, lon2) {
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
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Function to get current position wrapped in a promise with native permission handling
export async function getCurrentPosition() {
    try {
        // First check current permissions
        const permResult = await Geolocation.checkPermissions();

        if (permResult.location !== 'granted') {
            const requestResult = await Geolocation.requestPermissions();
            if (requestResult.location !== 'granted') {
                throw new Error('Permissão de localização negada pelo usuário.');
            }
        }

        const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
        });

        return position;
    } catch (error) {
        console.error("Error getting location:", error);
        throw error;
    }
}
