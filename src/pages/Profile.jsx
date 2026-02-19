import { Share2, Settings, Shield, LayoutDashboard, ArrowLeft, MapPin, Calendar, CheckCircle, Trophy, MessageSquare, ChevronLeft, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, Heart, Bookmark, BadgeCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useChat } from '../contexts/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import LogoutButton from '../components/LogoutButton';
import { useState } from 'react';
import ProfileEditModal from '../components/ProfileEditModal';
import { LEVEL_PATCHES, getPatchByLevel } from '../constants/patches';
import Patch from '../components/Patch';
import UserListModal from '../components/UserListModal';
import UserProfileModal from '../components/UserProfileModal';
import ProfileShareModal from '../components/ProfileShareModal';
import RouteDetailsModal from '../components/RouteDetailsModal';
import ShareModal from '../components/ShareModal';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';
import { GeolocationService } from '../services/GeolocationService';
import { calculateDistance, getCurrentPosition } from '../utils/geo';
import clsx from 'clsx';

import ChatModal from '../components/ChatModal';

export default function Profile() {

    const navigate = useNavigate();
    const { user, profileStats, levelInfo, nextLevelInfo, updateProfileImage, updateClubBadge, activeRoute, startRoute, endRoute, abortRoute, toggleLike, toggleFavorite, toggleLikeEvent, toggleFavoriteEvent, checkInEvent, processingCheckIns } = useUser();
    const { routes = [], events = [], joinEvent } = useData();
    const { notify } = useNotification();
    const { totalUnread } = useChat();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [userListConfig, setUserListConfig] = useState({ isOpen: false, title: '', listType: null });

    const [viewingUser, setViewingUser] = useState(null);
    const [selectedChatUser, setSelectedChatUser] = useState(null); // For opening ChatModal
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'routes', 'events', 'messages', 'favorites'
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [detailsEvent, setDetailsEvent] = useState(null);
    const [isShareModalOpenContent, setIsShareModalOpenContent] = useState(false);
    const [shareContent, setShareContent] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    const { getThreads } = useChat();
    const threads = getThreads();

    const handleOpenUserProfile = (e, targetUser) => {
        if (e) e.stopPropagation();
        setViewingUser(targetUser);
    };

    if (!user) return null;

    // Calculate progress to next level (simplified)
    // Assuming 1000 XP per level
    const currentLevelXp = user.xp % 1000;
    // Calculate total distance travelled
    const totalKm = (user.completedRoutes || []).reduce((acc, route) => {
        const km = parseFloat(route.distance);
        return acc + (isNaN(km) ? 0 : km);
    }, 0);

    const progressPercent = (currentLevelXp / 1000) * 100;

    return (
        <div className="pb-24">
            {/* Header / Cover */}
            <div className="h-40 bg-gradient-to-b from-gray-800 to-background relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>

                <div className="absolute top-4 right-4 flex gap-4 z-10 items-center">
                    <LogoutButton />
                    {user.isAdmin && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-black transition-all flex items-center gap-2 px-4"
                        >
                            <LayoutDashboard size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Painel Admin</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="p-2 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 text-white"
                    >
                        <Share2 size={18} />
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="p-2 bg-black/20 backdrop-blur-md rounded-full hover:bg-black/40 text-primary hover:text-white transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Profile Info - Centered Layout */}
            <div className="px-6 -mt-16 flex flex-col items-center relative z-20">
                <div className="relative mb-6">
                    <div className="relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                        {/* Avatar container - Circular */}
                        <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-gray-700 shadow-2xl relative group-hover:border-primary transition-all duration-300 shadow-primary/10">
                            <img
                                src={user.avatar}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                style={{
                                    transform: `scale(${user.avatarFraming?.zoom || 1}) translate(${user.avatarFraming?.x || 0}%, ${user.avatarFraming?.y || 0}%)`
                                }}
                            />
                        </div>

                        {/* Club Badge - Circular */}
                        {user.clubBadge && (
                            <motion.div
                                initial={{ scale: 0, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-2xl z-20 border-4 border-background overflow-hidden"
                                title="Brasão do Moto Clube"
                            >
                                <div className="w-full h-full bg-background flex items-center justify-center overflow-hidden">
                                    <img
                                        src={user.clubBadge}
                                        className="w-full h-full object-cover"
                                        style={{
                                            transform: `scale(${user.badgeFraming?.zoom || 1}) translate(${user.badgeFraming?.x || 0}%, ${user.badgeFraming?.y || 0}%)`
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-3">
                        {user.name}
                        {(() => {
                            const patch = getPatchByLevel(user.level);
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
                                user.level >= 10 ? 'from-yellow-600 to-yellow-900 border-yellow-400' :
                                    user.level >= 7 ? 'from-blue-600 to-blue-900 border-blue-400' :
                                        user.level >= 4 ? 'from-red-600 to-red-900 border-red-400' :
                                            'from-gray-700 to-gray-900 border-gray-500';

                            return (
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center border-2 shadow-sm`} title={patch?.name || 'Iniciante'}>
                                    <PatchIcon size={14} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                </div>
                            );
                        })()}
                        {user.clubBadge && <Shield size={16} className="text-primary" fill="currentColor" />}
                    </h1>
                    <p className="text-gray-400 text-sm mb-2">
                        Membro desde 2024
                        {user.location && <span className="text-gray-500"> • {user.location}</span>}
                    </p>

                    {user.motorcycle && user.motorcycle.brand && (
                        <div className="mb-4 flex items-center justify-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full w-fit mx-auto">
                            <Bike size={14} className="text-primary" />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                {user.motorcycle.brand} {user.motorcycle.model} • {user.motorcycle.year}
                            </span>
                        </div>
                    )}

                    {/* Follower Stats */}
                    <div className="flex items-center justify-center gap-6 mb-6 border-y border-white/5 py-3">
                        <button
                            onClick={() => setUserListConfig({ isOpen: true, title: 'Seguidores', listType: 'followers' })}
                            className="text-center group active:scale-95 transition-transform"
                        >
                            <span className="block text-xl font-black text-white leading-none group-hover:text-primary transition-colors">{user.followers?.toLocaleString() || 0}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-gray-300">Seguidores</span>
                        </button>
                        <div className="w-[1px] h-8 bg-white/10" />
                        <div className="text-center">
                            <span className="block text-xl font-black text-primary leading-none">{totalKm.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">KM Rodados</span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10" />
                        <button
                            onClick={() => setUserListConfig({ isOpen: true, title: 'Seguindo', listType: 'following' })}
                            className="text-center group active:scale-95 transition-transform"
                        >
                            <span className="block text-xl font-black text-white leading-none group-hover:text-primary transition-colors">{user.following?.toLocaleString() || 0}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-gray-300">Seguindo</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total XP:</span>
                        <span className="text-primary font-black">{user.xp.toLocaleString()}</span>
                    </div>
                </div>

                {/* XP Progress */}
                <div className="bg-background-secondary p-5 rounded-2xl border border-white/5 mb-8 shadow-lg w-full max-w-md">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="text-gray-400 italic">Criando sua história na estrada</span>
                        <span className="text-primary">{Math.floor(progressPercent)}%</span>
                    </div>

                    <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-primary to-orange-600 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px]" />
                        </motion.div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-right">Faltam {1000 - currentLevelXp} XP para o nível {user.level + 1}</p>
                </div>

                {activeTab === 'profile' && (
                    <>
                        {/* Stats Grid - Clickable */}
                        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-md">
                            <button
                                onClick={() => setActiveTab('routes')}
                                className="bg-background-secondary p-3 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all group text-left"
                            >
                                <div className="text-xl font-black text-white mb-1 group-hover:text-primary transition-colors">{user.routesCompleted}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase flex justify-between items-center">
                                    Rotas
                                    <MapPin size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('events')}
                                className="bg-background-secondary p-3 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all group text-left"
                            >
                                <div className="text-xl font-black text-white mb-1 group-hover:text-primary transition-colors">{user.eventsAttended}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase flex justify-between items-center">
                                    Eventos
                                    <Calendar size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                className="bg-background-secondary p-3 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all group text-left"
                            >
                                <div className="text-xl font-black text-white mb-1 group-hover:text-primary transition-colors">
                                    {(user.favoriteRoutes?.length || 0) + (user.favoriteEvents?.length || 0)}
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase flex justify-between items-center">
                                    Favoritos
                                    <Bookmark size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-500" />
                                </div>
                            </button>
                        </div>

                        {/* Messages Button (Full Width) */}
                        <button
                            onClick={() => setActiveTab('messages')}
                            className="bg-background-secondary p-4 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all group text-left w-full max-w-md mb-8 flex items-center justify-between"
                        >
                            <div>
                                <div className="text-xl font-black text-white mb-0.5 group-hover:text-primary transition-colors flex items-center gap-2">
                                    Mensagens
                                    {totalUnread > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                            {totalUnread} NOVA(S)
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 font-bold uppercase">
                                    {threads.length} Conversas ativas
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                <MessageSquare size={20} />
                            </div>
                        </button>

                        {/* Badges Section */}
                        <section className="w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Sua Coleção de Patches
                            </h3>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-12 gap-x-4 py-4">
                                {user.badges && user.badges.map((badgeName, i) => {
                                    const patchData = LEVEL_PATCHES.find(p => p.name === badgeName);

                                    return (
                                        <div key={i} className="flex justify-center">
                                            <Patch
                                                name={badgeName}
                                                iconName={patchData?.icon}
                                                image={patchData?.image}
                                                level={patchData?.level || 1}
                                                size="md"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {(!user.badges || user.badges.length === 0) && (
                                <div className="text-center text-gray-500 py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                    <p className="text-sm">Nenhum patch conquistado ainda.</p>
                                    <p className="text-xs mt-1">Complete rotas para subir de nível!</p>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {activeTab === 'routes' && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setActiveTab('profile')} className="bg-white/5 p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
                                <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-xl font-black text-white">Histórico de Rotas</h3>
                        </div>

                        <div className="space-y-3">
                            {user.completedRoutes && user.completedRoutes.length > 0 ? (
                                user.completedRoutes.map((route, idx) => (
                                    <div key={idx} className="bg-background-secondary p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-primary/20 transition-colors">
                                        <div>
                                            <p className="font-bold text-white text-lg">{route.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-400 bg-black/30 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Calendar size={10} /> {route.date}
                                                </span>
                                                <span className="text-xs text-primary font-bold">{route.distance}</span>
                                            </div>
                                        </div>
                                        <CheckCircle size={20} className="text-green-500" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 text-gray-500">
                                    <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-lg font-bold">Nenhuma rota concluída</p>
                                    <p className="text-sm mt-1">Vá para a aba Rotas e comece sua jornada!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setActiveTab('profile')} className="bg-white/5 p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
                                <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-xl font-black text-white">Eventos Participados</h3>
                        </div>

                        <div className="space-y-3">
                            {user.pastEvents && user.pastEvents.length > 0 ? (
                                user.pastEvents.map((event, idx) => (
                                    <div key={idx} className="bg-background-secondary p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-primary/20 transition-colors">
                                        <div>
                                            <p className="font-bold text-white text-lg">{event.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-400 bg-black/30 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <Calendar size={10} /> {event.date}
                                                </span>
                                                <span className="text-xs text-gray-300">{event.location}</span>
                                            </div>
                                        </div>
                                        <Calendar size={20} className="text-primary" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 text-gray-500">
                                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-lg font-bold">Nenhum evento participado</p>
                                    <p className="text-sm mt-1">Participe dos próximos eventos da comunidade!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setActiveTab('profile')} className="bg-white/5 p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
                                <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-xl font-black text-white">Minhas Mensagens</h3>
                        </div>

                        <div className="space-y-3">
                            {threads.length > 0 ? (
                                threads.map((thread) => (
                                    <div
                                        key={thread.id}
                                        onClick={() => setSelectedChatUser(thread.partner)}
                                        className="bg-background-secondary p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-primary/20 hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        <div className="relative">
                                            <img
                                                src={thread.partner.avatar}
                                                alt={thread.partner.name}
                                                className="w-12 h-12 rounded-full border border-white/10 object-cover"
                                            />
                                            {thread.partner.clubBadge && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background-secondary">
                                                    <Shield size={10} fill="black" className="text-black" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-bold text-white text-sm truncate pr-2 group-hover:text-primary transition-colors">{thread.partner.name}</h4>
                                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                                    {new Date(thread.lastMessage.timestamp).toLocaleDateString() === new Date().toLocaleDateString()
                                                        ? new Date(thread.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : new Date(thread.lastMessage.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {thread.lastMessage.senderId === user.email ? 'Você: ' : ''}{thread.lastMessage.text}
                                            </p>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronLeft className="rotate-180 text-gray-500" size={16} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 text-gray-500">
                                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-lg font-bold">Nenhuma mensagem</p>
                                    <p className="text-sm mt-1">Conecte-se com outros pilotos para conversar!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'favorites' && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setActiveTab('profile')} className="bg-white/5 p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all">
                                <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-xl font-black text-white">Meus Favoritos</h3>
                        </div>

                        <div className="space-y-4 pb-8">
                            {/* Favorite Routes Section */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-2">
                                    <Map size={10} /> Rotas Favoritas
                                </h4>
                                {user.favoriteRoutes?.length > 0 && Array.isArray(routes) ? (
                                    user.favoriteRoutes.map(routeId => {
                                        const route = routes.find(r => String(r.id) === String(routeId));
                                        if (!route) return null;
                                        return (
                                            <div
                                                key={`f-route-${routeId}`}
                                                onClick={() => setSelectedRoute(route)}
                                                className="bg-background-secondary p-3 rounded-xl border border-white/5 flex items-center gap-3 hover:border-primary/20 hover:bg-white/5 transition-all cursor-pointer"
                                            >
                                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                                    <img src={route.image} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white text-sm truncate">{route.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-primary font-black uppercase">{route.distance} KM</span>
                                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold">{route.difficulty}</span>
                                                    </div>
                                                </div>
                                                <Bookmark size={16} fill="currentColor" className="text-yellow-500" />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-center py-4 text-gray-500 italic">Nenhuma rota favoritada.</p>
                                )}
                            </div>

                            {/* Favorite Events Section */}
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2 mb-2">
                                    <Calendar size={10} /> Eventos Favoritos
                                </h4>
                                {user.favoriteEvents?.length > 0 && Array.isArray(events) ? (
                                    user.favoriteEvents.map(eventId => {
                                        const event = events.find(e => String(e.id) === String(eventId));
                                        if (!event) return null;
                                        return (
                                            <div
                                                key={`f-event-${eventId}`}
                                                onClick={() => setDetailsEvent(event)}
                                                className="bg-background-secondary p-3 rounded-xl border border-white/5 flex items-center gap-3 hover:border-primary/20 hover:bg-white/5 transition-all cursor-pointer"
                                            >
                                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                                    <img src={event.image || event.thumbnail} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white text-sm truncate">{event.name || event.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                                        <span className="text-primary font-black uppercase">{event.date}</span>
                                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                        <span className="text-gray-500 truncate max-w-[100px]">{event.location}</span>
                                                    </div>
                                                </div>
                                                <Bookmark size={16} fill="currentColor" className="text-yellow-500" />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-center py-4 text-gray-500 italic">Nenhum evento favoritado.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />

            <ProfileShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                user={user}
                stats={{ totalKm }}
            />

            <UserListModal
                isOpen={userListConfig.isOpen}
                onClose={() => setUserListConfig({ ...userListConfig, isOpen: false })}
                title={userListConfig.title}
                userIds={userListConfig.listType === 'following' ? user.followingList : user.followersList}
                onUserSelect={(user) => setViewingUser(user)}
            />

            {viewingUser && (
                <UserProfileModal
                    isOpen={!!viewingUser}
                    onClose={() => setViewingUser(null)}
                    user={viewingUser}
                />
            )}
            {/* Chat Modal triggered from Inbox */}
            <ChatModal
                isOpen={!!selectedChatUser}
                onClose={() => setSelectedChatUser(null)}
                recipient={selectedChatUser}
            />

            <RouteDetailsModal
                route={selectedRoute}
                onClose={() => setSelectedRoute(null)}
                isCheckedIn={selectedRoute && (user.completedRoutes || []).some(r => r.id === selectedRoute.id)}
                onCheckIn={() => { }}
                onStartRoute={(e, route) => startRoute(route.id, route.name)}
                onEndRoute={(e, route) => endRoute()}
                onAbortRoute={abortRoute}
                onToggleLike={toggleLike}
                onToggleFavorite={toggleFavorite}
                activeRoute={activeRoute}
                onOpenProfile={(user) => setViewingUser(user)}
                onShare={(route) => {
                    setShareContent({ ...route, type: 'rota' });
                    setIsShareModalOpenContent(true);
                }}
            />

            {/* Event Details Modal */}
            <AnimatePresence>
                {detailsEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center sm:p-4"
                        onClick={() => setDetailsEvent(null)}
                    >
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                            className="bg-background-secondary border-t sm:border border-white/10 w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl h-[90vh] supports-[height:100dvh]:h-[90dvh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Immersive Header */}
                            <div className="h-72 relative shrink-0">
                                <img src={detailsEvent.image} className="w-full h-full object-cover" alt={detailsEvent.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-background-secondary via-background-secondary/20 to-transparent"></div>

                                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                                    <button
                                        onClick={() => setDetailsEvent(null)}
                                        className="bg-black/60 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/20 transition-all active:scale-95 shadow-lg border border-white/10"
                                    >
                                        <X size={24} />
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => toggleFavoriteEvent(detailsEvent.id)}
                                            className={clsx(
                                                "p-2.5 rounded-full backdrop-blur-md transition-all active:scale-95 border shadow-lg",
                                                user?.favoriteEvents?.includes(String(detailsEvent.id))
                                                    ? "bg-primary/20 text-primary border-primary/30"
                                                    : "bg-black/60 text-white border-white/10"
                                            )}
                                        >
                                            <Bookmark size={20} fill={user?.favoriteEvents?.includes(String(detailsEvent.id)) ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            onClick={() => setIsShareModalOpenContent(true)}
                                            className="bg-black/60 backdrop-blur-md p-2.5 rounded-full text-white border border-white/10 shadow-lg"
                                        >
                                            <Share2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-6 right-6 z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                            {detailsEvent.premium ? 'Destaque' : 'Comunidade'}
                                        </span>
                                        <span className="text-white/80 text-xs font-bold flex items-center gap-1">
                                            <Calendar size={12} className="text-primary" />
                                            {detailsEvent.date}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white leading-tight drop-shadow-md">{detailsEvent.title || detailsEvent.name}</h2>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
                                {/* Location & Info */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                            <MapPin size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Localização</p>
                                            <p className="text-sm text-gray-200 font-medium">{detailsEvent.location}</p>
                                        </div>
                                    </div>

                                    {detailsEvent.startTime && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                                <Calendar size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Horário</p>
                                                <p className="text-sm text-gray-200 font-medium">
                                                    {detailsEvent.startTime}
                                                    {detailsEvent.endTime ? ` às ${detailsEvent.endTime}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Sobre o Evento</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {detailsEvent.description || "Sem descrição disponível."}
                                    </p>
                                </div>

                                {/* Organizer */}
                                {detailsEvent.createdBy && (
                                    <div>
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Organizador</h3>
                                        <div
                                            className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group"
                                            onClick={(e) => handleOpenUserProfile(e, detailsEvent.createdBy)}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={detailsEvent.createdBy.avatar}
                                                    alt={detailsEvent.createdBy.name}
                                                    className="w-12 h-12 rounded-full border-2 border-primary/30 group-hover:border-primary transition-colors"
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-background-secondary rounded-full p-0.5">
                                                    <BadgeCheck size={14} className="text-blue-400 fill-blue-400/20" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-black text-white">{detailsEvent.createdBy.name}</span>
                                                    {(() => {
                                                        const patch = getPatchByLevel(detailsEvent.createdBy.level);
                                                        const PatchIcon = patch ? {
                                                            "Baby": Baby, "Bike": Bike, "Map": Map, "TrendingUp": TrendingUp,
                                                            "Sunrise": Sunrise, "BatteryCharging": BatteryCharging, "CloudRain": CloudRain,
                                                            "Users": Users, "Tent": Tent, "Crown": Crown
                                                        }[patch.icon] || Shield : Shield;

                                                        const tierColors = detailsEvent.createdBy.level >= 10 ? 'from-yellow-600 to-yellow-900 border-yellow-400' :
                                                            detailsEvent.createdBy.level >= 7 ? 'from-blue-600 to-blue-900 border-blue-400' :
                                                                detailsEvent.createdBy.level >= 4 ? 'from-red-600 to-red-900 border-red-400' :
                                                                    'from-gray-700 to-gray-900 border-gray-500';

                                                        return (
                                                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center border shadow-sm`}>
                                                                <PatchIcon size={12} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium">Nível {detailsEvent.createdBy.level} • {detailsEvent.createdBy.motorcycle?.brand || 'Motociclista'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fixed Footer Actions */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-secondary via-background-secondary to-transparent pt-10 border-t border-white/5">
                                <div className="flex gap-3">
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!user) {
                                                notify("Faça login para participar!", "info");
                                                return;
                                            }

                                            const isAttending = detailsEvent.attendees?.some(a => String(a.id) === String(user.id));
                                            const hasCheckedIn = user.pastEvents?.some(e => String(e.id) === String(detailsEvent.id));

                                            if (hasCheckedIn) return;

                                            if (!isAttending) {
                                                joinEvent(detailsEvent.id, user);
                                                setDetailsEvent(prev => ({
                                                    ...prev,
                                                    attendees: [...(prev.attendees || []), { id: user.id, name: user.name, avatar: user.avatar }]
                                                }));
                                                notify("Presença confirmada! Faça o Check-in no local para ganhar XP.", "success");
                                            } else {
                                                // Check-in logic
                                                const now = new Date();
                                                now.setHours(0, 0, 0, 0);
                                                let isValidDate = true;
                                                if (detailsEvent.startDate) {
                                                    const start = new Date(detailsEvent.startDate + 'T00:00:00');
                                                    const end = detailsEvent.endDate ? new Date(detailsEvent.endDate + 'T23:59:59') : new Date(detailsEvent.startDate + 'T23:59:59');
                                                    if (now < start || now > end) isValidDate = false;
                                                }

                                                if (!isValidDate) {
                                                    const startStr = new Date(detailsEvent.startDate + 'T00:00:00').toLocaleDateString('pt-BR');
                                                    notify(`O check-in só é permitido no dia ${startStr}.`, "warning");
                                                    return;
                                                }

                                                setIsLocating(true);
                                                try {
                                                    const pos = await getCurrentPosition();
                                                    if (!pos) throw new Error("Posição não encontrada");

                                                    // Re-verify after getting position
                                                    if (user.pastEvents?.some(pe => String(pe.id) === String(detailsEvent.id))) {
                                                        return;
                                                    }

                                                    const distance = calculateDistance(pos.coords.latitude, pos.coords.longitude, detailsEvent.latitude, detailsEvent.longitude);
                                                    if (distance <= 1) {
                                                        await checkInEvent(detailsEvent);
                                                    } else {
                                                        notify(`Você está a ${distance.toFixed(1)}km. Chegue num raio de 1km para o Check-in.`, "warning");
                                                    }
                                                } catch (err) {
                                                    console.error("Check-in error:", err);
                                                    notify("Ative o GPS para fazer o check-in.", "error");
                                                } finally {
                                                    setIsLocating(false);
                                                }
                                            }
                                        }}
                                        disabled={user?.pastEvents?.some(e => String(e.id) === String(detailsEvent.id)) || isLocating || processingCheckIns?.has(String(detailsEvent.id))}
                                        className={clsx(
                                            "flex-1 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest active:scale-95 shadow-xl shadow-primary/20",
                                            user?.pastEvents?.some(e => String(e.id) === String(detailsEvent.id))
                                                ? "bg-zinc-800 text-gray-400 cursor-not-allowed border border-white/5 shadow-none"
                                                : processingCheckIns?.has(String(detailsEvent.id))
                                                    ? "bg-primary/50 text-black border-none cursor-wait"
                                                    : detailsEvent.attendees?.some(a => String(a.id) === String(user?.id))
                                                        ? "bg-primary hover:bg-orange-600 text-black shadow-primary/30"
                                                        : "bg-white text-black hover:bg-gray-200"
                                        )}
                                    >
                                        {isLocating || processingCheckIns?.has(String(detailsEvent.id)) ? (
                                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        ) : user?.pastEvents?.some(e => String(e.id) === String(detailsEvent.id)) ? (
                                            <>
                                                <BadgeCheck size={20} />
                                                Check-in Realizado
                                            </>
                                        ) : detailsEvent.attendees?.some(a => String(a.id) === String(user?.id)) ? (
                                            <>
                                                <MapPin size={20} fill="currentColor" />
                                                Fazer Check-in (Local)
                                            </>
                                        ) : (
                                            <>
                                                <BadgeCheck size={20} />
                                                Confirmar Presença
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ShareModal
                isOpen={isShareModalOpenContent}
                onClose={() => setIsShareModalOpenContent(false)}
                onSuccess={() => {
                    setIsShareModalOpenContent(false);
                    setDetailsEvent(null);
                }}
                content={{ ...detailsEvent, type: 'evento' }}
            />
        </div >
    );
}
