import { Outlet, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useUser } from '../contexts/UserContext';
import Logo from '../components/Logo';
import { useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export default function AppLayout() {
    const { user } = useUser();

    useEffect(() => {
        const checkAndRequestPermissions = async () => {
            try {
                const permResult = await Geolocation.checkPermissions();
                if (permResult.location !== 'granted') {
                    await Geolocation.requestPermissions();
                }
            } catch (err) {
                console.warn("Could not request permissions on startup:", err);
            }
        };

        checkAndRequestPermissions();
    }, []);

    return (
        <div className="h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-background text-white font-sans flex flex-col">
            <header className="fixed top-0 left-0 right-0 h-20 bg-background/95 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-4 z-50">
                <div className="flex items-center gap-3">
                    <Logo size={50} />
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-white leading-none tracking-tight">JORNADA</span>
                        <span className="text-primary text-[10px] font-bold tracking-[0.2em] leading-none mt-1 uppercase">Biker v1.1</span>
                    </div>
                </div>

                <Link to="/perfil" className="relative group active:scale-95 transition-all mr-2">
                    {/* Avatar Container */}
                    <div className="w-16 h-16 rounded-full border-2 border-primary/50 overflow-hidden bg-gray-700 shadow-xl relative group-hover:border-white transition-all duration-300">
                        <img
                            src={user?.avatar || 'https://via.placeholder.com/150'}
                            alt="Perfil"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            style={{
                                transform: `scale(${user?.avatarFraming?.zoom || 1}) translate(${user?.avatarFraming?.x || 0}%, ${user?.avatarFraming?.y || 0}%)`
                            }}
                        />
                    </div>

                    {/* Club Badge - Circular */}
                    {user?.clubBadge && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-black overflow-hidden">
                            <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
                                <img
                                    src={user.clubBadge}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}
                </Link>
            </header>

            <main className="flex-1 pb-24 pt-28 overflow-y-auto">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}
