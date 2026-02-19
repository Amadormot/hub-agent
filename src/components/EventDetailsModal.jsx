import { X, MapPin, Calendar as CalendarIcon, BadgeCheck, Trophy, Share2, Users, Tent, Crown, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Shield } from 'lucide-react';
import { getPatchByLevel } from '../constants/patches';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function EventDetailsModal({ event, onClose, onJoin, onCheckIn, user, isProcessing, isLocating, onOpenProfile, onShare }) {
    if (!event) return null;

    const isAttending = event.attendees?.some(a => String(a.id) === String(user?.id));
    const hasCheckedIn = user?.pastEvents?.some(e => String(e.id) === String(event.id));

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background-secondary w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
                >
                    {/* Header Image */}
                    <div className="relative h-56 shrink-0">
                        <img
                            src={event.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop'}
                            className="w-full h-full object-cover"
                            alt={event.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background-secondary via-transparent to-black/60" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="absolute top-4 left-4">
                            {event.premium && (
                                <span className="bg-premium text-black text-[10px] font-black px-3 py-1 rounded-full border border-premium/50 shadow-lg shadow-premium/20 uppercase tracking-widest">
                                    Premium
                                </span>
                            )}
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-2xl font-black text-white leading-tight uppercase italic">{event.title}</h2>
                            <div className="flex items-center gap-2 mt-1 text-primary">
                                <MapPin size={14} />
                                <span className="text-[10px] font-black uppercase tracking-wider">{event.location}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
                        {/* Highlights */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Data</div>
                                <div className="text-white font-black flex items-center gap-2">
                                    <CalendarIcon size={16} className="text-primary" />
                                    {event.date?.split(' ')[0]}
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Participantes</div>
                                <div className="text-white font-black flex items-center gap-2">
                                    <Users size={16} className="text-primary" />
                                    {event.attendees?.length || 0}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sobre o Evento</h3>
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                                {event.description || "Sem descrição disponível."}
                            </p>
                        </div>

                        {/* Organizer */}
                        {event.createdBy && (
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Organizador</h3>
                                <div
                                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
                                    onClick={() => onOpenProfile?.(event.createdBy)}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-2 border-primary/30 group-hover:border-primary transition-colors overflow-hidden bg-zinc-800">
                                            <img
                                                src={event.createdBy.avatar}
                                                className="w-full h-full object-cover"
                                                style={{ transform: `scale(${event.createdBy.avatarFraming?.zoom || 1}) translate(${event.createdBy.avatarFraming?.x || 0}%, ${event.createdBy.avatarFraming?.y || 0}%)` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-black text-white">{event.createdBy.name}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium">Nível {event.createdBy.level} • {event.createdBy.motorcycle?.brand || 'Motociclista'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-secondary via-background-secondary to-transparent pt-10 border-t border-white/5">
                        <div className="flex gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasCheckedIn) return;
                                    if (isAttending) onCheckIn?.(event);
                                    else onJoin?.(event);
                                }}
                                disabled={hasCheckedIn || isProcessing || isLocating}
                                className={clsx(
                                    "flex-1 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest active:scale-95 shadow-xl",
                                    hasCheckedIn
                                        ? "bg-zinc-800 text-gray-400 cursor-default"
                                        : isProcessing || isLocating
                                            ? "bg-primary/50 text-black cursor-wait"
                                            : isAttending
                                                ? "bg-primary text-black shadow-primary/20"
                                                : "bg-white text-black hover:bg-gray-100 shadow-white/10"
                                )}
                            >
                                {isProcessing || isLocating ? (
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : hasCheckedIn ? (
                                    <><BadgeCheck size={20} /> Check-in Realizado</>
                                ) : isAttending ? (
                                    <><MapPin size={20} /> Fazer Check-in (Local)</>
                                ) : (
                                    <><Trophy size={20} /> Confirmar Presença</>
                                )}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare?.(event);
                                }}
                                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
