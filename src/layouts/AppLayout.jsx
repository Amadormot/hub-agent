import { Outlet, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useUser } from '../contexts/UserContext';

export default function AppLayout() {
    const { user } = useUser();

    return (
        <div className="min-h-screen bg-background text-white font-sans flex flex-col">
            {/* Global Header */}
            <header className="fixed top-0 left-0 right-0 h-24 bg-background/95 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-6 z-50">
                <h1 className="text-2xl font-black text-white tracking-tight">
                    MOTO HUB <span className="text-primary">BRASIL</span>
                </h1>

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

                    {/* Club Badge (Shield) - Floating */}
                    {user?.clubBadge && (
                        <div
                            className="absolute -bottom-2 -right-2 w-8 h-10 bg-primary flex items-center justify-center shadow-lg"
                            style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 75%, 50% 100%, 0% 75%, 0% 10%)' }}
                        >
                            <div
                                className="w-[calc(100%-2px)] h-[calc(100%-2px)] bg-black flex items-center justify-center overflow-hidden"
                                style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 75%, 50% 100%, 0% 75%, 0% 10%)' }}
                            >
                                <img
                                    src={user.clubBadge}
                                    className="w-full h-full object-contain p-1"
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
