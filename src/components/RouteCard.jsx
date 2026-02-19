import React from 'react';
import { MapPin, Trophy, Navigation, Heart, Bookmark, Clock, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { getPatchByLevel } from '../constants/patches';

export default function RouteCard({
    route,
    index,
    user,
    activeRoute,
    onStartRoute,
    onToggleLike,
    onToggleFavorite,
    onOpenProfile,
    onClick
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onClick && onClick(route)}
            className="group relative flex flex-col rounded-3xl cursor-pointer shadow-2xl shadow-black/50 border border-white/5 bg-zinc-900 overflow-hidden h-full"
        >
            {/* Image Container */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                    src={route.image}
                    alt={route.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />

                {/* Floating Badges/Actions */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30">
                    <span className={clsx(
                        "px-3 py-1 rounded-full text-white font-black text-[10px] uppercase shadow-lg backdrop-blur-md border border-white/10",
                        route.difficulty === 'Expert' ? 'bg-red-600/80' :
                            route.difficulty === 'Médio' ? 'bg-yellow-600/80' : 'bg-green-600/80'
                    )}>
                        {route.difficulty === 'Expert' ? 'Mestre' : route.difficulty}
                    </span>

                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStartRoute && onStartRoute(e, route);
                            }}
                            className={clsx(
                                "h-9 px-3 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-95 gap-1.5",
                                activeRoute?.id && String(activeRoute.id) === String(route.id)
                                    ? "bg-primary text-black border-primary"
                                    : "bg-black/40 text-white border-white/10 hover:bg-black/60"
                            )}
                        >
                            <Navigation size={16} fill={activeRoute?.id && String(activeRoute.id) === String(route.id) ? "currentColor" : "none"} className={activeRoute?.id && String(activeRoute.id) === String(route.id) ? "" : "rotate-45"} />
                            {activeRoute?.id && String(activeRoute.id) === String(route.id) && <span className="text-[10px] font-black uppercase">Ativa</span>}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleLike && onToggleLike(e, route.id);
                            }}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite && onToggleFavorite(e, route.id);
                            }}
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
            </div>

            {/* Content Area */}
            <div className="p-5 pt-2 flex flex-col gap-4 relative z-10 -mt-10 bg-gradient-to-t from-zinc-900 to-transparent flex-1">
                <div>
                    <h3 className="font-black text-2xl text-white mb-1 group-hover:text-primary transition-colors tracking-tight drop-shadow-md leading-tight uppercase">
                        {route.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">
                        <span className="truncate">{route.origin?.split(' - ')[0] || route.city?.split(' (')[0] || 'Origem'}</span>
                        <Navigation size={10} className="text-primary rotate-90" fill="currentColor" />
                        <span className="truncate">{route.destination?.split(' - ')[0] || route.city?.split(' (')[0] || 'Destino'}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-gray-300">
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                        <MapPin size={14} className="text-primary" />
                        <span>{route.distance} KM</span>
                    </div>
                    {route.duration && (
                        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                            <Clock size={14} className="text-primary" />
                            <span>{route.duration}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-premium bg-premium/10 px-2.5 py-1.5 rounded-xl border border-premium/20">
                        <Trophy size={14} />
                        <span>+{route.xp} XP</span>
                    </div>
                </div>

                {route.createdBy && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                        <div className="flex items-center gap-3 group/avatar" onClick={(e) => {
                            e.stopPropagation();
                            onOpenProfile && onOpenProfile(e, route.createdBy);
                        }}>
                            <div className="relative">
                                <img
                                    src={route.createdBy.avatar}
                                    alt={route.createdBy.name}
                                    className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-lg object-cover"
                                />
                                <div className="absolute -bottom-1 -right-1">
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
                                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center border shadow-sm`} title={patch?.name || 'Iniciante'}>
                                                <PatchIcon size={10} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-0.5">Criado por</span>
                                <span className="text-sm font-bold text-white group-hover/avatar:text-primary transition-colors">{route.createdBy.name}</span>
                            </div>
                        </div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes</span>
                            <Navigation size={12} className="text-primary" fill="currentColor" />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
