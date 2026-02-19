import { X, MapPin, Trophy, Navigation, User, Calendar, CheckCircle, Shield, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, Heart, Bookmark } from 'lucide-react';
import { getPatchByLevel } from '../constants/patches';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { RoutePreviewMap, NavigationMap } from './MapComponents';
import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';

export default function RouteDetailsModal({ route, onClose, onCheckIn, isCheckedIn, onStartRoute, onEndRoute, onAbortRoute, activeRoute, onOpenProfile, onShare, onToggleLike, onToggleFavorite }) {
    const { user } = useUser();
    const [isNavigating, setIsNavigating] = useState(false);

    // Safety: If route ends (activeRoute becomes null or different), force exit navigation
    useEffect(() => {
        if (isNavigating && (!activeRoute || activeRoute.id !== route.id)) {
            setIsNavigating(false);
        }
    }, [activeRoute, isNavigating, route]);

    if (!route) return null;
    // ... (rest of file) ...


    // Prepare stops for the map
    // Use 'waypoints' if available, otherwise try to construct from origin/destination or legacy data
    let stops = [];
    if (route.waypoints && route.waypoints.length > 0) {
        stops = route.waypoints;
    } else if (route.origin && route.destination) {
        stops = [route.origin, route.destination];
    } else if (route.city && route.state) {
        // Legacy fallback: display at least the destination city
        // RoutePreviewMap handles single points by just showing a marker
        stops = [`${route.city}, ${route.state}, Brasil`];
    }

    if (isNavigating) {
        return <NavigationMap stops={stops} onExit={() => setIsNavigating(false)} onFinish={() => {
            if (activeRoute?.id === route.id) {
                // Mock event for end route if needed, or update NavigationMap to pass e
                onEndRoute({ stopPropagation: () => { } }, route);
                setIsNavigating(false);
            } else {
                // If checking in without starting (legacy/backup), try start then end? Or just close map.
                // For now, let's keep it simple: finish map -> close map
                setIsNavigating(false);
            }
        }} />;
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background-secondary w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] supports-[height:100dvh]:max-h-[85dvh]"
                >
                    <div className="relative h-56 shrink-0">
                        <img
                            src={route.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop'}
                            alt={route.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background-secondary via-transparent to-black/60"></div>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={clsx(
                                    "px-2 py-0.5 rounded-full text-white font-bold text-[10px] uppercase border border-white/10 backdrop-blur-md",
                                    route.difficulty === 'Expert' ? 'bg-red-600/80 shadow-[0_0_10px_rgba(220,38,38,0.5)]' :
                                        route.difficulty === 'Médio' ? 'bg-yellow-600/80 shadow-[0_0_10px_rgba(202,138,4,0.5)]' : 'bg-green-600/80 shadow-[0_0_10px_rgba(22,163,74,0.5)]'
                                )}>
                                    {route.difficulty}
                                </span>
                                {route.likes > 0 && (
                                    <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
                                        ❤️ {route.likes}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight">{route.name}</h2>
                        </div>
                    </div>

                    <div className="p-6 pb-12 overflow-y-auto">
                        {/* Stats Row */}
                        <div className="flex items-center justify-between mb-6 bg-white/5 rounded-xl p-4 border border-white/5">
                            <div className="flex flex-col items-center gap-1">
                                <div className="text-gray-400 text-[10px] uppercase font-bold">Distância</div>
                                <div className="text-white font-black text-lg flex items-center gap-1">
                                    <MapPin size={16} className="text-primary" />
                                    {route.distance} <span className="text-xs font-normal text-gray-500">KM</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="text-gray-400 text-[10px] uppercase font-bold">Recompensa</div>
                                <div className="text-premium font-black text-lg flex items-center gap-1">
                                    <Trophy size={16} />
                                    +{route.xp} <span className="text-xs font-normal text-gray-500">XP</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="text-gray-400 text-[10px] uppercase font-bold text-center">Trajeto</div>
                                <div className="text-white font-bold text-xs flex flex-col items-center leading-tight">
                                    <span>{route.origin || route.city?.split(' (')[0] || "Origem"}</span>
                                    <div className="flex items-center gap-1 my-0.5 opacity-40">
                                        <div className="w-1 h-1 rounded-full bg-primary"></div>
                                        <div className="w-1 h-1 rounded-full bg-primary/50"></div>
                                        <div className="w-1 h-1 rounded-full bg-primary/20"></div>
                                    </div>
                                    <span>{route.destination || route.city?.split(' (')[0] || "Destino"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Map Preview */}
                        {stops.length > 0 && (
                            <div className="mb-6 h-48 rounded-xl overflow-hidden border border-white/10 relative z-0">
                                <div className="absolute top-2 left-2 z-[400] bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-bold uppercase pointer-events-none">
                                    Trajeto
                                </div>
                                <RoutePreviewMap stops={stops} />
                            </div>
                        )}

                        {/* Description */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wide opacity-80">Sobre a Rota</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {route.description || "Explore esta rota incrível e descubra novas paisagens. Lembre-se de pilotar com segurança e respeitar as leis de trânsito."}
                            </p>
                        </div>

                        {/* Creator */}
                        {route.createdBy && (
                            <div
                                onClick={() => onOpenProfile && onOpenProfile(route.createdBy)}
                                className="mb-8 p-4 rounded-xl bg-gradient-to-r from-black/40 to-black/20 border border-white/10 flex items-center gap-4 shadow-lg backdrop-blur-sm cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-2 border-primary shadow-sm overflow-hidden bg-zinc-800">
                                        <img
                                            src={route.createdBy.avatar}
                                            alt={route.createdBy.name}
                                            className="w-full h-full object-cover"
                                            style={{
                                                transform: `scale(${route.createdBy.avatarFraming?.zoom || 1}) translate(${route.createdBy.avatarFraming?.x || 0}%, ${route.createdBy.avatarFraming?.y || 0}%)`
                                            }}
                                        />
                                    </div>
                                    {route.createdBy.clubBadge && (
                                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background-secondary overflow-hidden shadow-md">
                                            <img
                                                src={route.createdBy.clubBadge}
                                                className="w-full h-full object-cover"
                                                style={{
                                                    transform: `scale(${route.createdBy.badgeFraming?.zoom || 1}) translate(${route.createdBy.badgeFraming?.x || 0}%, ${route.createdBy.badgeFraming?.y || 0}%)`
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-300 uppercase font-bold tracking-wider mb-1">Rota Recomendada por</p>
                                    <p className="text-lg font-black text-white flex items-center gap-2">
                                        {route.createdBy.name}
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
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="p-6 border-t border-white/5 bg-black/20 shrink-0 flex flex-col gap-3">
                        <div className="flex gap-3">
                            <button
                                onClick={(e) => {
                                    if (activeRoute && String(activeRoute.id) === String(route.id)) {
                                        onEndRoute(e, route);
                                    } else if (!activeRoute && !isCheckedIn) {
                                        onStartRoute(e, route);
                                    } else if (isCheckedIn) {
                                        // Done
                                    } else {
                                        // If another route is active, clicking this one might 
                                        // just show the map of the active one?
                                        setIsNavigating(true);
                                    }
                                }}
                                disabled={!!activeRoute && String(activeRoute.id) !== String(route.id)}
                                className={clsx(
                                    "flex-[2] py-4 rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg text-center",
                                    isCheckedIn
                                        ? "bg-green-600 cursor-default text-white"
                                        : activeRoute && String(activeRoute.id) === String(route.id)
                                            ? "bg-green-600 hover:bg-green-500 text-white animate-pulse"
                                            : !!activeRoute
                                                ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                                                : "bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]"
                                )}
                            >
                                {isCheckedIn ? (
                                    <><CheckCircle size={20} /> Rota Concluída</>
                                ) : activeRoute && String(activeRoute.id) === String(route.id) ? (
                                    <><Trophy size={20} /> Concluir Rota (+XP)</>
                                ) : !!activeRoute ? (
                                    <><Navigation size={20} /> Rota em Andamento...</>
                                ) : (
                                    <><Navigation size={20} fill="currentColor" /> Iniciar Trajeto</>
                                )}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleLike && onToggleLike(e, route.id);
                                }}
                                className={clsx(
                                    "w-14 shrink-0 h-14 rounded-xl border flex items-center justify-center transition-all active:scale-[0.95]",
                                    user?.likedRoutes?.includes(String(route.id))
                                        ? "bg-red-600/20 border-red-500/50 text-red-500"
                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                )}
                                title="Curtir"
                            >
                                <Heart size={20} fill={user?.likedRoutes?.includes(String(route.id)) ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite && onToggleFavorite(e, route.id);
                                }}
                                className={clsx(
                                    "w-14 shrink-0 h-14 rounded-xl border flex items-center justify-center transition-all active:scale-[0.95]",
                                    user?.favoriteRoutes?.includes(String(route.id))
                                        ? "bg-yellow-600/20 border-yellow-500/50 text-yellow-500"
                                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                )}
                                title="Salvar nos Favoritos"
                            >
                                <Bookmark size={20} fill={user?.favoriteRoutes?.includes(String(route.id)) ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare && onShare(route);
                                }}
                                className="flex-1 border border-white/10 hover:bg-white/5 text-white font-bold h-14 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                Compartilhar
                            </button>
                        </div>

                        {activeRoute && (
                            <button
                                onClick={() => {
                                    if (window.confirm("Deseja realmente cancelar a rota atual? Todo o progresso será perdido.")) {
                                        onAbortRoute && onAbortRoute();
                                    }
                                }}
                                className="text-[10px] text-red-500/50 hover:text-red-500 font-bold uppercase tracking-widest transition-colors py-2 text-center"
                            >
                                Cancelar Rota Atual
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
