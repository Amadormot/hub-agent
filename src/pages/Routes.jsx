import { MapPin, Trophy, Navigation, Plus, BadgeCheck, Search, Shield, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, Heart, Bookmark, Clock } from 'lucide-react';
import { getPatchByLevel } from '../constants/patches';
import { useUser } from '../contexts/UserContext';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useData } from '../contexts/DataContext';
import RouteRegistrationModal from '../components/RouteRegistrationModal';
import RouteDetailsModal from '../components/RouteDetailsModal';
import RouteCard from '../components/RouteCard';
import UserProfileModal from '../components/UserProfileModal';
import ShareModal from '../components/ShareModal';
import { calculateDistance, getCurrentPosition } from '../utils/geo';
import { useLocation } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

export default function RoutesPage() {
    const { addXp, user, toggleLike, toggleFavorite, startRoute, endRoute, activeRoute, abortRoute } = useUser();
    const { notify } = useNotification();
    const { routes, addRoute, updateRouteLikes } = useData();
    const location = useLocation();
    const [checkedRoutes, setCheckedRoutes] = useState([]);
    const [showXpToast, setShowXpToast] = useState(null);
    const [showStartToast, setShowStartToast] = useState(null);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareContent, setShareContent] = useState(null);
    const [isSimulatedMode, setIsSimulatedMode] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const routeId = params.get('id');
        if (routeId && routes.length > 0) {
            const route = routes.find(r => String(r.id) === String(routeId));
            if (route) {
                setSelectedRoute(route);
            }
        }
    }, [location.search, routes.length]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('Todas');

    const filteredRoutes = useMemo(() => {
        return routes.filter(route => {
            const matchesSearch = route.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDifficulty = selectedDifficulty === 'Todas' || route.difficulty === selectedDifficulty;
            return matchesSearch && matchesDifficulty;
        });
    }, [routes, searchQuery, selectedDifficulty]);

    const handleOpenUserProfile = (e, user) => {
        e.stopPropagation();
        setSelectedUser(user);
    };

    const handleToggleLike = async (e, routeId) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para curtir rotas!", "info");
            return;
        }
        const isLiked = await toggleLike(routeId);
        updateRouteLikes(routeId, isLiked);

        // Update selectedRoute if it's the one being liked to refresh modal UI
        if (selectedRoute && String(selectedRoute.id) === String(routeId)) {
            setSelectedRoute(prev => ({ ...prev, likes: Math.max(0, (prev.likes || 0) + (isLiked ? 1 : -1)) }));
        }

        if (isLiked) {
            notify("Rota curtida!", "success");
        }
    };

    const handleToggleFavorite = async (e, routeId) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para favoritar rotas!", "info");
            return;
        }
        await toggleFavorite(routeId);
    };

    const handleStartRoute = async (e, route) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (activeRoute) {
            alert("Você já tem uma rota em andamento! Conclua a atual antes de iniciar outra.");
            return;
        }
        try {
            const position = await getCurrentPosition();
            const targetLat = route.startLat || route.latitude;
            const targetLng = route.startLng || route.longitude;
            const isDevBypass = (e && e.altKey) || isSimulatedMode;
            if (targetLat && !isDevBypass) {
                const distance = calculateDistance(position.coords.latitude, position.coords.longitude, targetLat, targetLng);
                const isNear = distance <= 20; // Radius updated to 20km
                if (!isNear) {
                    alert(`Você está fora da área de partida (${distance.toFixed(1)}km). Aproxime-se da cidade de origem para iniciar (limite de 20km).`);
                    return;
                }
            }
        } catch (error) {
            console.error("GPS Error", error);
            const useSimulated = window.confirm(`${error.message || "Erro de GPS."}\n\nDeseja ativar o MODO SIMULADO para testar?`);
            if (useSimulated) {
                const stayFar = window.confirm("Deseja simular que está LONGE (Fora do raio) para testar a mensagem de erro?");
                setIsSimulatedMode(stayFar ? 'far' : 'near');
                notify(`Modo Simulado (${stayFar ? 'Longe' : 'Perto'}) ativado! Tente iniciar novamente.`, "info");
            }
            return;
        }
        const success = await startRoute(route.id, route.name);
        if (success) {
            setShowStartToast(route.name);
            setTimeout(() => setShowStartToast(null), 3000);
        }
    };

    const handleEndRoute = async (e, route) => {
        if (e && e.stopPropagation) e.stopPropagation();
        try {
            const position = await getCurrentPosition();
            const targetLat = route.latitude;
            const targetLng = route.longitude;
            const isDevBypass = (e && e.altKey) || isSimulatedMode;
            if (targetLat && !isDevBypass) {
                const distance = calculateDistance(position.coords.latitude, position.coords.longitude, targetLat, targetLng);
                const isNear = distance <= 20; // Radius updated to 20km
                if (!isNear) {
                    alert(`Você ainda está longe do destino (${distance.toFixed(1)}km). Aproxime-se da cidade de destino para concluir (limite de 20km).`);
                    return;
                }
            }
        } catch (error) {
            console.error("GPS Error", error);
            const useSimulated = window.confirm(`${error.message || "Erro de GPS."}\n\nDeseja ativar o MODO SIMULADO para testar?`);
            if (useSimulated) {
                const stayFar = window.confirm("Deseja simular que está LONGE (Fora do raio) para testar a mensagem de erro?");
                setIsSimulatedMode(stayFar ? 'far' : 'near');
                notify(`Modo Simulado (${stayFar ? 'Longe' : 'Perto'}) ativado! Tente concluir novamente.`, "info");
            }
            return;
        }
        endRoute();
        addXp(route.xp);
        const distVal = parseInt(route.distance) || 0;
        if (distVal > 0) addXp(distVal);
        setCheckedRoutes([...checkedRoutes, route.id]);
        setShowXpToast(route.xp + distVal);
        setTimeout(() => setShowXpToast(null), 3000);
    };

    const handleNewRoute = (newRoute) => {
        addRoute({
            ...newRoute,
            type: 'rota',
            creator: user.name,
            creatorAvatar: user.avatar,
            createdBy: {
                id: 'me',
                name: user.name,
                level: user.level,
                avatar: user.avatar,
                patches: user.patches || [],
                clubBadge: user.clubBadge
            }
        });
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    return (
        <div className="p-6 relative">
            <div className="mb-8 space-y-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar rotas ou cidades..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:bg-zinc-800 transition-all shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['Todas', 'Iniciante', 'Médio', 'Expert'].map((diff) => (
                        <button
                            key={diff}
                            onClick={() => setSelectedDifficulty(diff)}
                            className={clsx(
                                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                selectedDifficulty === diff
                                    ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-105"
                                    : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/10"
                            )}
                        >
                            {diff}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setIsRegistrationOpen(true)}
                    className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-black/20"
                >
                    <Plus size={16} />
                    Sugerir Nova Rota
                </button>
            </div>

            <div className="space-y-4">
                {filteredRoutes.map((route, index) => (
                    <RouteCard
                        key={route.id}
                        route={route}
                        index={index}
                        user={user}
                        activeRoute={activeRoute}
                        onStartRoute={handleStartRoute}
                        onToggleLike={handleToggleLike}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenProfile={handleOpenUserProfile}
                        onClick={setSelectedRoute}
                    />
                ))}
            </div>

            <RouteRegistrationModal
                isOpen={isRegistrationOpen}
                onClose={() => setIsRegistrationOpen(false)}
                onRegister={handleNewRoute}
                routes={routes}
            />

            <RouteDetailsModal
                route={selectedRoute}
                onClose={() => setSelectedRoute(null)}
                isCheckedIn={selectedRoute && checkedRoutes.includes(selectedRoute.id)}
                onCheckIn={() => { }}
                onStartRoute={(e, route) => handleStartRoute(e, route)}
                onEndRoute={(e, route) => handleEndRoute(e, route)}
                onAbortRoute={abortRoute}
                onToggleLike={handleToggleLike}
                onToggleFavorite={handleToggleFavorite}
                activeRoute={activeRoute}
                onOpenProfile={(user) => handleOpenUserProfile({ stopPropagation: () => { } }, user)}
                onShare={(route) => {
                    setShareContent({ ...route, type: 'rota' });
                    setIsShareModalOpen(true);
                }}
            />

            <UserProfileModal
                isOpen={!!selectedUser}
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onSuccess={() => {
                    setIsShareModalOpen(false);
                    setSelectedRoute(null);
                }}
                content={shareContent || {}}
            />

            <AnimatePresence>
                {showXpToast && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 border border-primary/50 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 w-max"
                    >
                        <div className="bg-primary rounded-full p-1"><Trophy size={16} fill="white" /></div>
                        <div>
                            <p className="font-bold text-sm">Parabéns!</p>
                            <p className="text-xs text-gray-300">Você ganhou <span className="text-premium font-bold">+{showXpToast} XP</span></p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 border border-green-500/50 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 w-max"
                    >
                        <div className="bg-green-500 rounded-full p-1"><BadgeCheck size={16} fill="white" className="text-green-500" /></div>
                        <div>
                            <p className="font-bold text-sm">Rota Sugerida!</p>
                            <p className="text-xs text-gray-300">Agradecemos a contribuição.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showStartToast && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 border border-blue-500 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 w-max"
                    >
                        <div className="bg-blue-600 rounded-full p-1"><Navigation size={16} fill="white" className="text-white" /></div>
                        <div>
                            <p className="font-bold text-sm">Rota Iniciada!</p>
                            <p className="text-xs text-gray-300">Boa viagem em {showStartToast}.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
