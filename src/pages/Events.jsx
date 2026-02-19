import { Calendar as CalendarIcon, MapPin, BadgeCheck, X, Plus, Search, Navigation, Shield, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, Heart, Bookmark, Share2 } from 'lucide-react';
import { getPatchByLevel } from '../constants/patches';
import { useState, useMemo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import clsx from 'clsx';
import PaymentModal from '../components/PaymentModal';
import EventRegistrationModal from '../components/EventRegistrationModal';
import UserProfileModal from '../components/UserProfileModal';
import ShareModal from '../components/ShareModal';
import EventDetailsModal from '../components/EventDetailsModal';
import EventCard from '../components/EventCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { calculateDistance, getCurrentPosition } from '../utils/geo';
import { useNotification } from '../contexts/NotificationContext';

import { useLocation } from 'react-router-dom';

export default function Events() {
    const { followUser, user, checkInEvent, toggleLikeEvent, toggleFavoriteEvent, processingCheckIns, addXp } = useUser();
    const { events, addEvent, registerSale, joinEvent } = useData();
    const { notify } = useNotification();
    const location = useLocation();

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [detailsEvent, setDetailsEvent] = useState(null);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isPremiumMode, setIsPremiumMode] = useState(false);

    // Auto-open event from URL ID or Home redirection
    // Auto-open/join event from state or URL
    useEffect(() => {
        if (location.state?.autoOpenPremium) {
            setIsPremiumMode(true);
            setIsRegistrationOpen(true);
            window.history.replaceState({}, document.title);
        } else if (location.state?.autoJoinId && events.length > 0) {
            const eventId = location.state.autoJoinId;
            const event = events.find(e => String(e.id) === String(eventId));
            if (event && user) {
                const isAttending = event.attendees?.some(a => String(a.id) === String(user.id));
                if (!isAttending) {
                    joinEvent(event.id, user);
                    notify("Presença confirmada!", "success");
                }
                setDetailsEvent(event);
            }
            window.history.replaceState({}, document.title);
        } else if (location.state?.autoOpenId && events.length > 0) {
            const eventId = location.state.autoOpenId;
            const event = events.find(e => String(e.id) === String(eventId));
            if (event) setDetailsEvent(event);
            window.history.replaceState({}, document.title);
        } else if (location.search) {
            const params = new URLSearchParams(location.search);
            const eventId = params.get('id');
            if (eventId && events.length > 0) {
                const event = events.find(e => String(e.id) === String(eventId));
                if (event) setDetailsEvent(event);
            }
        }
    }, [location.search, location.state, events, user]);


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

    const handleToggleLike = async (e, eventId) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para curtir eventos!", "info");
            return;
        }
        const isLiked = await toggleLikeEvent(eventId);
        updateEventLikes(eventId, isLiked);

        // Update detailsEvent if modal is open to refresh UI
        if (detailsEvent && String(detailsEvent.id) === String(eventId)) {
            setDetailsEvent(prev => ({ ...prev, likes: Math.max(0, (prev.likes || 0) + (isLiked ? 1 : -1)) }));
        }
    };

    const handleToggleFavorite = async (e, eventId) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para favoritar eventos!", "info");
            return;
        }
        await toggleFavoriteEvent(eventId);
    };

    const handleBoostClick = (event) => {
        setSelectedEvent(event);
    };

    const handleDetailsClick = (e, event) => {
        e.stopPropagation();
        setDetailsEvent(event);
    };

    const handleQuickCheckIn = async (e, event) => {
        e.stopPropagation();
        if (!user) {
            notify("Faça login para fazer check-in!", "info");
            return;
        }

        const isAttending = event.attendees?.some(a => a.id === user.id);
        const hasCheckedIn = user.pastEvents?.some(pe => pe.id === event.id);

        if (hasCheckedIn) return;

        if (!isAttending) {
            notify("Você precisa confirmar presença antes de fazer check-in!", "info");
            return;
        }

        // Date validation
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (event.startDate) {
            const start = new Date(event.startDate + 'T00:00:00');
            const end = event.endDate ? new Date(event.endDate + 'T23:59:59') : new Date(event.startDate + 'T23:59:59');
            if (now < start || now > end) {
                const startStr = new Date(event.startDate + 'T00:00:00').toLocaleDateString('pt-BR');
                notify(`O check-in só é permitido no dia ${startStr}.`, "warning");
                return;
            }
        }

        setIsLocating(true);
        try {
            const pos = await getCurrentPosition();
            if (!pos) throw new Error("Posição não encontrada");

            // Re-verify after getting position to be extra safe
            if (user.pastEvents?.some(pe => String(pe.id) === String(event.id))) {
                return;
            }

            const distance = calculateDistance(pos.coords.latitude, pos.coords.longitude, event.latitude, event.longitude);
            if (distance <= 1) {
                await checkInEvent(event);
            } else {
                notify(`Você está a ${distance.toFixed(1)}km. Chegue num raio de 1km para o Check-in.`, "warning");
            }
        } catch (err) {
            console.error("Check-in error:", err);
            notify("Ative o GPS para fazer o check-in.", "error");
        } finally {
            setIsLocating(false);
        }
    };

    const handleNewEvent = (newEvent) => {
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
                latitude: newEvent.lat || -15.7975,
                longitude: newEvent.lng || -47.8919,
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
                try {
                    // Ensure we have a valid cost, defaulting to 1.00 if missing but premium
                    const costToRecord = newEvent.totalCost || (eventPayload.premium ? 1.00 : 0);

                    if (costToRecord > 0) {
                        registerSale({
                            ...newEvent,
                            totalCost: costToRecord
                        }, 'event_highlight');
                    }
                } catch (saleError) {
                    // Fail silently for registration but keep event
                }
            }

            notify("Evento Publicado! Já disponível na agenda.", "success");
        } catch (error) {
            notify("Erro ao criar evento. Tente novamente.", "error");
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
                    onClick={() => {
                        setIsPremiumMode(false);
                        setIsRegistrationOpen(true);
                    }}
                    className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-black/20"
                >
                    <Plus size={16} />
                    Sugerir Novo Evento
                </button>
            </div>

            <div className="space-y-6">
                {filteredEvents
                    .sort((a, b) => {
                        if (a.premium && !b.premium) return -1;
                        if (!a.premium && b.premium) return 1;
                        if (a.premium && b.premium) {
                            return (b.highlightExpiresAt || 0) - (a.highlightExpiresAt || 0);
                        }
                        return (b.likes || 0) - (a.likes || 0);
                    })
                    .map((event, index) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            index={index}
                            user={user}
                            isLocating={isLocating}
                            processingCheckIns={processingCheckIns}
                            onJoin={(ev) => joinEvent(ev.id, user)}
                            onCheckIn={handleQuickCheckIn}
                            onToggleLike={handleToggleLike}
                            onToggleFavorite={handleToggleFavorite}
                            onOpenProfile={handleOpenUserProfile}
                            onClick={setDetailsEvent}
                        />
                    ))}
            </div>

            <PaymentModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                eventName={selectedEvent?.title}
            />

            {/* Simple Details Modal */}
            <EventDetailsModal
                event={detailsEvent}
                onClose={() => setDetailsEvent(null)}
                user={user}
                isProcessing={processingCheckIns?.has(String(detailsEvent?.id))}
                isLocating={isLocating}
                onJoin={(ev) => {
                    if (!user) {
                        notify("Faça login para participar!", "info");
                        return;
                    }
                    joinEvent(ev.id, user);
                    notify("Presença confirmada! Faça o Check-in no local para ganhar XP.", "success");
                }}
                onCheckIn={async (ev) => {
                    setIsLocating(true);
                    try {
                        const pos = await getCurrentPosition();
                        const distance = calculateDistance(pos.coords.latitude, pos.coords.longitude, ev.latitude, ev.longitude);
                        if (distance <= 1) {
                            checkInEvent(ev);
                        } else {
                            notify(`Você está a ${distance.toFixed(1)}km. Chegue num raio de 1km para o Check-in.`, "warning");
                        }
                    } catch (err) {
                        notify("Ative o GPS para fazer o check-in.", "error");
                    } finally {
                        setIsLocating(false);
                    }
                }}
                onOpenProfile={(u) => setSelectedUser(u)}
                onShare={(ev) => {
                    setDetailsEvent(ev);
                    setIsShareModalOpen(true);
                }}
            />

            <EventRegistrationModal
                isOpen={isRegistrationOpen}
                onClose={() => setIsRegistrationOpen(false)}
                onRegister={handleNewEvent}
                user={user}
                defaultPremium={isPremiumMode}
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
                    setDetailsEvent(null);
                }}
                content={{ ...detailsEvent, type: 'evento' }}
            />
        </div>
    );
}
