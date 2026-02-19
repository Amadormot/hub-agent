import React from 'react';
import { Calendar as CalendarIcon, MapPin, BadgeCheck, Navigation, Heart, Bookmark, Clock, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { getPatchByLevel } from '../constants/patches';

export default function EventCard({
    event,
    index,
    user,
    isLocating,
    processingCheckIns,
    onJoin,
    onCheckIn,
    onToggleLike,
    onToggleFavorite,
    onOpenProfile,
    onClick
}) {
    const isAttending = event.attendees?.some(a => String(a.id) === String(user?.id));
    const hasCheckedIn = user?.pastEvents?.some(pe => String(pe.id) === String(event.id));
    const isProcessing = processingCheckIns?.has(String(event.id));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group relative flex flex-col rounded-3xl cursor-pointer shadow-2xl shadow-black/50 border overflow-hidden ${event.premium ? 'border-premium/50 shadow-premium/20' : 'border-white/5'} bg-zinc-900 h-full`}
            onClick={() => onClick && onClick(event)}
        >
            {/* Image Container */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                    src={event.image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />

                {/* Floating Badges/Actions */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30">
                    <div className="flex flex-col gap-2">
                        {event.premium && (
                            <span className="bg-premium text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                Destaque
                            </span>
                        )}
                        {(event.currentDistance !== null && event.currentDistance !== undefined) && (
                            <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 border border-white/10 uppercase italic shadow-lg">
                                <Navigation size={8} fill="currentColor" /> {Number(event.currentDistance).toFixed(0)} KM
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {user && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (hasCheckedIn || isProcessing) return;
                                    if (!isAttending) {
                                        onJoin && onJoin(event);
                                    } else {
                                        onCheckIn && onCheckIn(e, event);
                                    }
                                }}
                                disabled={isLocating || hasCheckedIn || isProcessing}
                                className={clsx(
                                    "h-9 px-3 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-95 gap-1.5",
                                    hasCheckedIn
                                        ? "bg-green-500/20 text-green-500 border-green-500/50"
                                        : isProcessing
                                            ? "bg-primary/50 text-black border-primary/50 cursor-wait"
                                            : isAttending
                                                ? "bg-primary text-black border-primary"
                                                : "bg-white text-black border-white hover:bg-gray-200",
                                    isLocating && "opacity-50 cursor-wait"
                                )}
                            >
                                <BadgeCheck size={18} fill={hasCheckedIn ? "currentColor" : "none"} className={(isLocating || isProcessing) ? "animate-pulse" : ""} />
                                <span className="text-[10px] font-black uppercase">
                                    {hasCheckedIn ? "Check-in" : isProcessing ? "Carregando" : isAttending ? "Check-in" : "Presença"}
                                </span>
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleLike && onToggleLike(e, event.id);
                            }}
                            className={clsx(
                                "h-9 px-3 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-90 gap-1.5",
                                user?.likedEvents?.includes(String(event.id))
                                    ? "bg-red-600/20 text-red-500 border-red-500/50"
                                    : "bg-black/40 text-white border-white/10 hover:bg-black/60"
                            )}
                        >
                            <Heart size={16} fill={user?.likedEvents?.includes(String(event.id)) ? "currentColor" : "none"} />
                            <span className="text-xs font-bold">{event.likes || 0}</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite && onToggleFavorite(e, event.id);
                            }}
                            className={clsx(
                                "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-90",
                                user?.favoriteEvents?.includes(String(event.id))
                                    ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                                    : "bg-black/40 text-white border-white/10 hover:bg-black/60"
                            )}
                        >
                            <Bookmark size={16} fill={user?.favoriteEvents?.includes(String(event.id)) ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 pt-2 flex flex-col gap-4 relative z-10 -mt-10 bg-gradient-to-t from-zinc-900 to-transparent flex-1">
                <div>
                    <h3 className="font-black text-2xl text-white mb-2 group-hover:text-primary transition-colors tracking-tight drop-shadow-lg uppercase leading-tight">
                        {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-black text-[10px] uppercase flex items-center gap-1.5 shadow-sm">
                            <CalendarIcon size={12} /> {event.date}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                            <MapPin size={14} className="text-primary" /> {event.location}
                        </span>
                    </div>
                </div>

                {event.createdBy && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                        <div className="flex items-center gap-3 group/avatar" onClick={(e) => {
                            e.stopPropagation();
                            onOpenProfile && onOpenProfile(e, event.createdBy);
                        }}>
                            <div className="relative">
                                <img
                                    src={event.createdBy.avatar}
                                    alt={event.createdBy.name}
                                    className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-lg object-cover"
                                />
                                <div className="absolute -bottom-1 -right-1">
                                    {(() => {
                                        const patch = getPatchByLevel(event.createdBy.level);
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
                                            event.createdBy.level >= 10 ? 'from-yellow-600 to-yellow-900 border-yellow-400' :
                                                event.createdBy.level >= 7 ? 'from-blue-600 to-blue-900 border-blue-400' :
                                                    event.createdBy.level >= 4 ? 'from-red-600 to-red-900 border-red-400' :
                                                        'from-gray-700 to-gray-900 border-gray-500';

                                        return (
                                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center border shadow-sm`}>
                                                <PatchIcon size={10} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-0.5">Sugerido por</span>
                                <span className="text-sm font-bold text-white group-hover/avatar:text-primary transition-colors">{event.createdBy.name}</span>
                            </div>
                        </div>

                        <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ver Agenda</span>
                            <CalendarIcon size={12} className="text-primary" />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
