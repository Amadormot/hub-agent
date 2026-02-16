import { Calendar as CalendarIcon, MapPin, BadgeCheck, X, Plus, Search, Navigation, Shield, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, Heart, Bookmark } from 'lucide-react';
import { getPatchByLevel } from '../constants/patches';
import { useState, useMemo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import clsx from 'clsx';
import PaymentModal from '../components/PaymentModal';
import EventRegistrationModal from '../components/EventRegistrationModal';
import UserProfileModal from '../components/UserProfileModal';
import ShareModal from '../components/ShareModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { calculateDistance, getCurrentPosition } from '../utils/geo';
import { useNotification } from '../contexts/NotificationContext';

import { useLocation } from 'react-router-dom';

export default function Events() {
    const { followUser, user, checkInEvent, toggleLikeEvent, toggleFavoriteEvent } = useUser();
    const { events, addEvent, registerSale, joinEvent } = useData();
    const { notify } = useNotification();
    const location = useLocation();

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [detailsEvent, setDetailsEvent] = useState(null);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Auto-open event from URL ID
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const eventId = params.get('id');
        if (eventId && events.length > 0) {
            const event = events.find(e => String(e.id) === String(eventId));
            if (event) {
                setDetailsEvent(event);
            }
        }
    }, [location.search, events.length]);


    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('Todos');
    const [maxRadius, setMaxRadius] = useState(0); // 0 = Any distance
    const [userCoords, setUserCoords] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // Filtered Events Logic
    const filteredEvents = useMemo(() => {
        return events.map(event => {
            let distance = null;
            if (userCoords && event.latitude && event.longitude) {
                distance = calculateDistance(
                    userCoords.latitude,
                    userCoords.longitude,
                    event.latitude,
                    event.longitude
                );
            }
            return { ...event, currentDistance: distance };
        }).filter(event => {
            const matchesSearch =
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = selectedType === 'Todos' ||
                (selectedType === 'Destaques' && event.premium);

            const matchesRadius = maxRadius === 0 ||
                (event.currentDistance !== null && event.currentDistance <= maxRadius);

            return matchesSearch && matchesType && matchesRadius;
        });
    }, [events, searchQuery, selectedType, maxRadius, userCoords]);

    const handleRadiusChange = async (radius) => {
        if (radius === 0) {
            setMaxRadius(0);
            return;
        }

        if (!userCoords) {
            setIsLocating(true);
            try {
                const pos = await getCurrentPosition();
                setUserCoords(pos.coords);
            } catch (err) {
                notify("Para usar o filtro de distância, precisamos da sua localização.", "warning");
                return;
            } finally {
                setIsLocating(false);
            }
        }
        setMaxRadius(radius);
    };



    const handleOpenUserProfile = (e, user) => {
        e.stopPropagation();
        setSelectedUser(user);
    };

    const handleToggleLike = (e, eventId) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para curtir eventos!", "info");
            return;
        }
        toggleLikeEvent(eventId);
    };

    const handleToggleFavorite = (e, eventId) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para favoritar eventos!", "info");
            return;
        }
        toggleFavoriteEvent(eventId);
    };

    const handleBoostClick = (event) => {
        setSelectedEvent(event);
    };

    const handleDetailsClick = (e, event) => {
        e.stopPropagation();
        setDetailsEvent(event);
    };

    const handleNewEvent = (newEvent) => {
        console.log("Creating new event:", newEvent);
        try {
            // 1. Create Event First (Prioritize User Content)
            const eventPayload = {
                type: 'evento',
                name: newEvent.title,
                title: newEvent.title,
                creator: user?.name || 'Motociclista',
                creatorAvatar: user?.avatar,
                description: newEvent.description || 'Novo evento da comunidade.',
                image: newEvent.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=400&auto=format&fit=crop',
                date: newEvent.date,
                startDate: newEvent.startDate,
                endDate: newEvent.endDate,
                startTime: newEvent.startTime,
                endTime: newEvent.endTime,
                location: `${newEvent.city}, ${newEvent.state}`,
                latitude: -15.7975,
                longitude: -47.8919,
                premium: newEvent.isPremium,
                createdBy: {
                    id: user?.id || 'me',
                    name: user?.name || 'Motociclista',
                    level: user?.level || 'Iniciante',
                    avatar: user?.avatar,
                    patches: user?.patches || [],
                    clubBadge: user?.clubBadge
                }
            };

            addEvent(eventPayload);

            // 2. Then Register Sale (if premium) - Independent Block
            if (newEvent.premium || newEvent.isPremium) {
                console.log("Attempting to register premium sale...");
                try {
                    // Ensure we have a valid cost, defaulting to 1.00 if missing but premium
                    const costToRecord = newEvent.totalCost || (eventPayload.premium ? 1.00 : 0);

                    if (costToRecord > 0) {
                        registerSale({
                            ...newEvent,
                            totalCost: costToRecord
                        }, 'event_highlight');
                        console.log("Sale registered successfully.");
                    }
                } catch (saleError) {
                    console.error("Failed to register sale (Event created anyway):", saleError);
                }
            }

            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Erro ao criar evento. Tente novamente."); // Fallback feedback
        }
    };

    return (
        <div className="p-6 pb-24 relative">

            {/* NEW: Search and Filters Container */}
            <div className="mb-8 space-y-4">
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar eventos ou cidades..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:bg-zinc-800 transition-all shadow-inner"
                    />
                </div>

                {/* Filter Chips */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['Todos', 'Destaques'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={clsx(
                                    "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                    selectedType === type
                                        ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-105"
                                        : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/10"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center pr-2">
                            <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-2">
                                <Navigation size={10} className={isLocating ? "animate-pulse text-primary" : ""} />
                                Raio de Busca {isLocating && "(Localizando...)"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {[0, 50, 100, 200, 500].map((radius) => (
                                <button
                                    key={radius}
                                    onClick={() => handleRadiusChange(radius)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border uppercase tracking-wider",
                                        maxRadius === radius
                                            ? "bg-zinc-100 text-black border-white shadow-lg"
                                            : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    {radius === 0 ? 'Qualquer' : `${radius} KM`}
                                </button>
                            ))}

                            {/* Manual Input */}
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 ml-1 group focus-within:border-primary transition-all">
                                <input
                                    type="number"
                                    placeholder="Personalizar"
                                    className="bg-transparent text-[10px] font-bold text-white outline-none w-20 placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) handleRadiusChange(val);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val)) handleRadiusChange(val);
                                        }
                                    }}
                                />
                                <span className="text-[8px] font-black text-gray-500 uppercase">KM</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsRegistrationOpen(true)}
                    className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-black/20"
                >
                    <Plus size={16} />
                    Sugerir Novo Evento
                </button>
            </div>

            <div className="space-y-6">
                {filteredEvents
                    .sort((a, b) => {
                        // 1. Premium first
                        if (a.premium && !b.premium) return -1;
                        if (!a.premium && b.premium) return 1;

                        // 2. If both premium, sort by expiry (further in future first)
                        if (a.premium && b.premium) {
                            return (b.highlightExpiresAt || 0) - (a.highlightExpiresAt || 0);
                        }

                        // 3. Fallback to likes
                        return (b.likes || 0) - (a.likes || 0);
                    })
                    .map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl h-48 group cursor-pointer ${event.premium ? 'shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)] border border-premium/50' : 'border border-white/10'} bg-zinc-900`}
                        >
                            {/* 1. Inner Clipper - Content that should respect card edges */}
                            <div className="absolute inset-0 rounded-2xl overflow-hidden isolation-auto" onClick={(e) => handleDetailsClick(e, event)}>
                                {/* Background Image */}
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                                    {/* Top Badges */}
                                    <div className="absolute top-0 left-0 flex flex-col gap-0 items-start z-20">
                                        {event.premium && (
                                            <div className="bg-premium text-black text-[10px] font-black px-3 py-1 rounded-br-xl uppercase tracking-wider backdrop-blur-sm bg-opacity-90">
                                                Destaque
                                            </div>
                                        )}
                                        {event.currentDistance !== null && (
                                            <div className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-br-xl flex items-center gap-1 border-r border-b border-white/10 uppercase italic">
                                                <Navigation size={8} fill="currentColor" /> {event.currentDistance.toFixed(0)} KM de você
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="font-black text-xl text-white mb-2 group-hover:text-primary transition-colors drop-shadow-lg uppercase tracking-tight">{event.title}</h3>

                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-300 mb-3">
                                        <span className="px-2.5 py-0.5 rounded-lg bg-primary/20 text-primary border border-primary/30 font-black text-[10px] uppercase flex items-center gap-1.5 shadow-lg shadow-black/20">
                                            <CalendarIcon size={12} /> {event.date}
                                        </span>
                                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {event.location}</span>
                                    </div>

                                    {/* Creator Info Container */}
                                    {event.createdBy && (
                                        <div className="flex items-center gap-3 mb-2 pt-3 border-t border-white/10 mt-auto overflow-visible">


                                            <img src={event.createdBy.avatar} alt={event.createdBy.name} className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg" />

                                            <div className="flex flex-col cursor-pointer" onClick={(e) => handleOpenUserProfile(e, event.createdBy)}>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5 group-hover/avatar:text-primary transition-colors">Sugerido por</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white group-hover/avatar:underline">{event.createdBy.name}</span>
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
                                                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center border shadow-sm`} title={patch?.name || 'Iniciante'}>
                                                                <PatchIcon size={12} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {event.createdBy.patches && event.createdBy.patches.length > 0 && (
                                                <div className="flex -space-x-1 ml-auto self-end mb-1">
                                                    {event.createdBy.patches.slice(0, 3).map((patch, i) => (
                                                        <div key={i} className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>



                                <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
                                    <button
                                        onClick={(e) => handleToggleLike(e, event.id)}
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
                                        onClick={(e) => handleToggleFavorite(e, event.id)}
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


                        </motion.div>
                    ))}
            </div>

            <PaymentModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                eventName={selectedEvent?.title}
            />

            {/* Simple Details Modal */}
            <AnimatePresence>
                {detailsEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4"
                        onClick={() => setDetailsEvent(null)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-background-secondary border-t sm:border border-white/10 w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="h-48 relative shrink-0">
                                <img src={detailsEvent.image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background-secondary to-transparent"></div>
                                <button onClick={() => setDetailsEvent(null)} className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <span className="text-primary text-xs font-bold uppercase tracking-wider mb-2 block">{detailsEvent.date} • {detailsEvent.location}</span>
                                <h2 className="text-2xl font-black mb-4">{detailsEvent.title}</h2>

                                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                                    {detailsEvent.description || "Descrição completa do evento indisponível no momento. Entre em contato com os organizadores para mais informações."}
                                </p>

                                {/* Creator Info in Details */}
                                {detailsEvent.createdBy && (
                                    <div
                                        className="mb-6 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors"
                                        onClick={(e) => handleOpenUserProfile(e, detailsEvent.createdBy)}
                                    >
                                        <img
                                            src={detailsEvent.createdBy.avatar}
                                            alt={detailsEvent.createdBy.name}
                                            className="w-10 h-10 rounded-full border border-primary/30"
                                        />
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Organizado por</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-white">{detailsEvent.createdBy.name}</span>
                                                {(() => {
                                                    const patch = getPatchByLevel(detailsEvent.createdBy.level);
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
                                                        detailsEvent.createdBy.level >= 10 ? 'from-yellow-600 to-yellow-900 border-yellow-400' :
                                                            detailsEvent.createdBy.level >= 7 ? 'from-blue-600 to-blue-900 border-blue-400' :
                                                                detailsEvent.createdBy.level >= 4 ? 'from-red-600 to-red-900 border-red-400' :
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

                                <div className="flex gap-3">
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const isAttending = detailsEvent.attendees?.some(a => a.id === user.id);
                                            const hasCheckedIn = user.pastEvents?.some(e => e.id === detailsEvent.id);

                                            if (hasCheckedIn) return; // Already checked in

                                            if (!isAttending) {
                                                // Step 1: Confirm Presence (RSVP)
                                                joinEvent(detailsEvent.id, user);
                                                setDetailsEvent(prev => ({
                                                    ...prev,
                                                    attendees: [...(prev.attendees || []), { id: user.id, name: user.name, avatar: user.avatar }]
                                                }));
                                                notify("Presença confirmada! Quando chegar no local, faça o Check-in para ganhar XP.", "success");
                                            } else {
                                                // Step 2: Check-in (Geofencing & Date)

                                                // 2.1 Validate Date Logic
                                                const now = new Date();
                                                now.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

                                                let isValidDate = true;
                                                // Use explicit dates if available, otherwise permissive or try to parse
                                                // Assuming startDate/endDate are YYYY-MM-DD
                                                if (detailsEvent.startDate) {
                                                    const start = new Date(detailsEvent.startDate + 'T00:00:00');
                                                    const end = detailsEvent.endDate ? new Date(detailsEvent.endDate + 'T23:59:59') : new Date(detailsEvent.startDate + 'T23:59:59');

                                                    // Allow check-in on the day or within range
                                                    // Since 'now' is 00:00, comparisons need to be careful.
                                                    // Actually better to compare timestamps or just ISO strings for days.
                                                    // Let's rely on simple Date comparison.
                                                    if (now < start || now > end) {
                                                        isValidDate = false;
                                                    }
                                                }

                                                if (!isValidDate) {
                                                    const startStr = new Date(detailsEvent.startDate + 'T00:00:00').toLocaleDateString('pt-BR');
                                                    const endStr = detailsEvent.endDate ? new Date(detailsEvent.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : startStr;
                                                    const msg = startStr === endStr
                                                        ? `O check-in só está liberado no dia ${startStr}.`
                                                        : `O check-in só é permitido entre ${startStr} e ${endStr}.`;
                                                    notify(msg, "warning");
                                                    return;
                                                }

                                                if (!detailsEvent.latitude || !detailsEvent.longitude) {
                                                    notify("Este evento não tem localização definida para check-in.", "error");
                                                    return;
                                                }

                                                setIsLocating(true);
                                                try {
                                                    const pos = await getCurrentPosition();
                                                    const distance = calculateDistance(
                                                        pos.coords.latitude,
                                                        pos.coords.longitude,
                                                        detailsEvent.latitude,
                                                        detailsEvent.longitude
                                                    );

                                                    if (distance <= 2) { // 2km radius
                                                        checkInEvent(detailsEvent);
                                                    } else {
                                                        notify(`Você está muito longe! Aproximadamente ${distance.toFixed(2)}km do evento. Chegue num raio de 2km para fazer Check-in.`, "warning");
                                                    }
                                                } catch (error) {
                                                    console.error(error);
                                                    notify("Erro ao obter localização. Verifique se o GPS está ativado.", "error");
                                                } finally {
                                                    setIsLocating(false);
                                                }
                                            }
                                        }}
                                        disabled={user.pastEvents?.some(e => e.id === detailsEvent.id)}
                                        className={clsx(
                                            "flex-1 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2",
                                            user.pastEvents?.some(e => e.id === detailsEvent.id)
                                                ? "bg-zinc-800 text-gray-400 cursor-not-allowed border border-white/5"
                                                : detailsEvent.attendees?.some(a => a.id === user.id)
                                                    ? "bg-green-500 text-black hover:bg-green-400"
                                                    : "bg-white text-black hover:bg-gray-100"
                                        )}
                                    >
                                        {user.pastEvents?.some(e => e.id === detailsEvent.id) ? (
                                            <>
                                                <BadgeCheck size={18} /> Check-in Realizado
                                            </>
                                        ) : detailsEvent.attendees?.some(a => a.id === user.id) ? (
                                            <>
                                                <MapPin size={18} /> {isLocating ? "Verificando Local..." : "Fazer Check-in"}
                                            </>
                                        ) : (
                                            "Confirmar Presença"
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setIsShareModalOpen(true)}
                                        className="flex-1 border border-white/10 hover:bg-white/5 font-bold py-3 rounded-xl transition-colors"
                                    >
                                        Compartilhar
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleToggleLike(e, detailsEvent.id)}
                                            className={clsx(
                                                "w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-90",
                                                user?.likedEvents?.includes(String(detailsEvent.id))
                                                    ? "bg-red-600/20 text-red-500 border-red-500/30"
                                                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <Heart size={20} fill={user?.likedEvents?.includes(String(detailsEvent.id)) ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            onClick={(e) => handleToggleFavorite(e, detailsEvent.id)}
                                            className={clsx(
                                                "w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md border shadow-lg transition-all active:scale-90",
                                                user?.favoriteEvents?.includes(String(detailsEvent.id))
                                                    ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <Bookmark size={20} fill={user?.favoriteEvents?.includes(String(detailsEvent.id)) ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Registration Modal */}
            <EventRegistrationModal
                isOpen={isRegistrationOpen}
                onClose={() => setIsRegistrationOpen(false)}
                onRegister={handleNewEvent}
                user={user}
            />


            <UserProfileModal
                isOpen={!!selectedUser}
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                content={{ ...detailsEvent, type: 'evento' }}
            />


        </div>
    );
}
