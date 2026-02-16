import { MapPin, Trophy, Navigation, Plus, BadgeCheck, Search, Shield, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, Heart, Bookmark } from 'lucide-react';
import { getPatchByLevel } from '../constants/patches';
import { useUser } from '../contexts/UserContext';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useData } from '../contexts/DataContext';
import RouteRegistrationModal from '../components/RouteRegistrationModal';
import RouteDetailsModal from '../components/RouteDetailsModal';
import UserProfileModal from '../components/UserProfileModal';
import ShareModal from '../components/ShareModal';
import { GeolocationService } from '../services/GeolocationService';
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

    const handleToggleLike = (e, routeId) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para curtir rotas!", "info");
            return;
        }
        const isLiked = toggleLike(routeId);
        updateRouteLikes(routeId, isLiked);
        if (isLiked) {
            notify("Rota curtida!", "success");
        }
    };

    const handleToggleFavorite = (e, routeId) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para favoritar rotas!", "info");
            return;
        }
        toggleFavorite(routeId);
    };

    const handleStartRoute = async (e, route) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (activeRoute) {
            alert("Você já tem uma rota em andamento! Conclua a atual antes de iniciar outra.");
            return;
        }
        try {
            const position = await GeolocationService.getCurrentPosition(isSimulatedMode);
            const targetLat = route.startLat || route.latitude;
            const targetLng = route.startLng || route.longitude;
            const isDevBypass = (e && e.altKey) || isSimulatedMode;
            if (targetLat && !isDevBypass) {
                const isNear = GeolocationService.isWithinRadius(position.lat, position.lng, targetLat, targetLng, 30);
                if (!isNear) {
                    alert(`Você está fora da área de partida (${GeolocationService.calculateDistance(position.lat, position.lng, targetLat, targetLng).toFixed(1)}km). Aproxime-se da cidade de origem para iniciar.`);
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
        const success = startRoute(route.id);
        if (success) {
            setShowStartToast(route.name);
            setTimeout(() => setShowStartToast(null), 3000);
        }
    };

    const handleEndRoute = async (e, route) => {
        if (e && e.stopPropagation) e.stopPropagation();
        try {
            const position = await GeolocationService.getCurrentPosition(isSimulatedMode);
            const targetLat = route.latitude;
            const targetLng = route.longitude;
            const isDevBypass = (e && e.altKey) || isSimulatedMode;
            if (targetLat && !isDevBypass) {
                const isNear = GeolocationService.isWithinRadius(position.lat, position.lng, targetLat, targetLng, 20);
                if (!isNear) {
                    alert(`Você ainda está longe do destino (${GeolocationService.calculateDistance(position.lat, position.lng, targetLat, targetLng).toFixed(1)}km). Aproxime-se da cidade de destino para concluir.`);
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
        <div className="p-6 pb-24 relative">
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
                    <motion.div
                        key={route.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedRoute(route)}
                        className="group relative h-48 rounded-2xl cursor-pointer shadow-lg shadow-black/50 border border-white/5 bg-zinc-900"
                    >
                        <div className="absolute inset-0 rounded-2xl overflow-hidden isolation-auto">
                            <img
                                src={route.image}
                                alt={route.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                                <h3 className="font-black text-xl text-white mb-1 group-hover:text-primary transition-colors uppercase tracking-tight drop-shadow-lg leading-none">{route.name}</h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-80">
                                    <span className="truncate max-w-[120px]">{route.origin?.split(' - ')[0] || route.city?.split(' (')[0] || 'Origem'}</span>
                                    <Navigation size={10} className="text-primary rotate-90" fill="currentColor" />
                                    <span className="truncate max-w-[120px]">{route.destination?.split(' - ')[0] || route.city?.split(' (')[0] || 'Destino'}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-gray-300 mb-3">
                                    <span className={clsx(
                                        "px-2.5 py-0.5 rounded-lg text-white font-black text-[10px] uppercase shadow-lg",
                                        route.difficulty === 'Expert' ? 'bg-red-600' :
                                            route.difficulty === 'Médio' ? 'bg-yellow-600' : 'bg-green-600'
                                    )}>
                                        {route.difficulty === 'Expert' ? 'Mestre' : route.difficulty}
                                    </span>
                                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {route.distance} KM</span>
                                    <span className="flex items-center gap-1.5 text-premium bg-premium/10 px-2 py-0.5 rounded-lg"><Trophy size={14} /> +{route.xp} XP</span>
                                </div>

                                {route.createdBy && (
                                    <div className="flex items-center gap-3 mb-2 pt-3 border-t border-white/10 mt-auto overflow-visible">
                                        <img
                                            src={route.createdBy.avatar}
                                            alt={route.createdBy.name}
                                            className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg"
                                        />
                                        <div className="flex flex-col cursor-pointer" onClick={(e) => handleOpenUserProfile(e, route.createdBy)}>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5 group-hover/avatar:text-primary transition-colors">Criado por</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white group-hover/avatar:underline">{route.createdBy.name}</span>
                                                {(() => {
                                                    const patch = getPatchByLevel(route.createdBy.level);
                                                    const PatchIcon = patch ? (
                                                        {
                                                            "Baby": Baby,
                                                            "Bike": Bike,
                                                            "Map": Map,
                                                            "TrendingUp": TrendingUp,
                                                            "Sunrise": Sunrise,
                                                            "BatteryCharging": BatteryCharging,
                                                            "CloudRain": CloudRain,
                                                            "Users": Users,
                                                            "Tent": Tent,
                                                            "Crown": Crown
                                                        }[patch.icon] || Shield
                                                    ) : Shield;

                                                    const tierColors =
                                                        route.createdBy.level >= 10 ? 'from-yellow-600 to-yellow-900 border-yellow-400' :
                                                            route.createdBy.level >= 7 ? 'from-blue-600 to-blue-900 border-blue-400' :
                                                                route.createdBy.level >= 4 ? 'from-red-600 to-red-900 border-red-400' :
                                                                    'from-gray-700 to-gray-900 border-gray-500';

                                                    return (
                                                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center border shadow-sm`} title={patch?.name || 'Iniciante'}>
                                                            <PatchIcon size={12} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
                                <button
                                    onClick={(e) => handleToggleLike(e, route.id)}
                                    className={clsx(
                                        "h-9 px-3 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-90 gap-1.5",
                                        user?.likedRoutes?.includes(String(route.id))
                                            ? "bg-red-600/20 text-red-500 border-red-500/50"
                                            : "bg-black/40 text-white border-white/10 hover:bg-black/60"
                                    )}
                                >
                                    <Heart size={16} fill={user?.likedRoutes?.includes(String(route.id)) ? "currentColor" : "none"} />
                                    <span className="text-xs font-bold">{route.likes || 0}</span>
                                </button>
                                <button
                                    onClick={(e) => handleToggleFavorite(e, route.id)}
                                    className={clsx(
                                        "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-90",
                                        user?.favoriteRoutes?.includes(String(route.id))
                                            ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                                            : "bg-black/40 text-white border-white/10 hover:bg-black/60"
                                    )}
                                >
                                    <Bookmark size={16} fill={user?.favoriteRoutes?.includes(String(route.id)) ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
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
