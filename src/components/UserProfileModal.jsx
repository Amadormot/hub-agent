import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Trophy, Calendar, Shield, UserPlus, BadgeCheck, MessageSquare, Baby, Bike, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, CheckCircle } from 'lucide-react';
import { getPatchByLevel } from '../constants/patches';
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import UserListModal from './UserListModal';
import ChatModal from './ChatModal';

export default function UserProfileModal({ user: initialUser, isOpen, onClose }) {
    const { user: me, followUser } = useUser();
    // ... (rest of file) ...

    const [currentUser, setCurrentUser] = useState(initialUser);
    const [userListConfig, setUserListConfig] = useState({ isOpen: false, title: '', userIds: [] });
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'routes_history', 'events_history'

    // Update currentUser if the initialUser prop changes (shouldn't happen often but for safety)
    useEffect(() => {
        if (initialUser) setCurrentUser(initialUser);
    }, [initialUser]);

    if (!isOpen || !currentUser) return null;

    const totalKm = (currentUser.completedRoutes || []).reduce((acc, route) => {
        const km = parseFloat(route.distance);
        return acc + (isNaN(km) ? 0 : km);
    }, 0);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background-secondary w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Header with Cover & Avatar */}
                    <div className="relative h-40 bg-gradient-to-br from-zinc-800 via-zinc-900 to-primary/20">
                        {/* Cover image simulation or pattern */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 to-transparent"></div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-all hover:scale-110 z-20 shadow-lg border border-white/5"
                        >
                            <X size={20} />
                        </button>

                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <div className="relative">
                                {/* Large Avatar - Circular */}
                                <div className="w-28 h-28 rounded-full border-4 border-background-secondary overflow-hidden bg-zinc-800 shadow-2xl relative group shadow-primary/20">
                                    <img
                                        src={currentUser.avatar}
                                        alt={currentUser.name}
                                        className="w-full h-full object-cover transition-transform"
                                        style={{
                                            transform: `scale(${currentUser.avatarFraming?.zoom || 1}) translate(${currentUser.avatarFraming?.x || 0}%, ${currentUser.avatarFraming?.y || 0}%)`
                                        }}
                                    />
                                </div>

                                {/* Brasão (Club Badge) - Circular */}
                                {currentUser.clubBadge && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="absolute -bottom-2 -right-2 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-2xl z-20 border-4 border-background-secondary overflow-hidden"
                                    >
                                        <div className="w-full h-full bg-background-secondary flex items-center justify-center overflow-hidden">
                                            <img
                                                src={currentUser.clubBadge}
                                                className="w-full h-full object-cover transition-transform"
                                                alt="Brasão"
                                                style={{
                                                    transform: `scale(${currentUser.badgeFraming?.zoom || 1}) translate(${currentUser.badgeFraming?.x || 0}%, ${currentUser.badgeFraming?.y || 0}%)`
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                            </div>
                        </div>
                    </div>

                    {/* User Info & Actions - Centered Header */}


                    {/* Content Area - Switchable */}
                    <div className="flex-1 overflow-y-auto bg-black/20">
                        {activeTab === 'profile' && (
                            <div className="p-8 pb-4">
                                {/* Regular Profile View */}
                                <div className="flex flex-col items-center mb-8">
                                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                        {currentUser.name}
                                        {(() => {
                                            const patch = getPatchByLevel(currentUser.level);
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
                                                currentUser.level >= 10 ? 'from-yellow-600 to-yellow-900 border-yellow-400' :
                                                    currentUser.level >= 7 ? 'from-blue-600 to-blue-900 border-blue-400' :
                                                        currentUser.level >= 4 ? 'from-red-600 to-red-900 border-red-400' :
                                                            'from-gray-700 to-gray-900 border-gray-500';

                                            return (
                                                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center border shadow-sm`} title={patch?.name || 'Iniciante'}>
                                                    <PatchIcon size={12} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                                </div>
                                            );
                                        })()}
                                        {currentUser.premium && <Shield size={16} className="text-premium fill-premium" />}
                                    </h2>
                                    <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold text-center">
                                        {currentUser.bio}
                                    </p>

                                    {currentUser.motorcycle && currentUser.motorcycle.brand && (
                                        <div className="mt-3 flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                                            <Bike size={14} className="text-primary" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                                {currentUser.motorcycle.brand} {currentUser.motorcycle.model} • {currentUser.motorcycle.year}
                                            </span>
                                        </div>
                                    )}

                                    {/* Follower Stats */}
                                    <div className="flex items-center justify-center gap-4 mt-6 border-y border-white/5 py-3 w-full">
                                        <button
                                            onClick={() => setUserListConfig({ isOpen: true, title: 'Seguidores', userIds: currentUser.followersList || [] })}
                                            className="text-center flex-1 group active:scale-95 transition-transform"
                                        >
                                            <span className="block text-lg font-black text-white leading-none group-hover:text-primary transition-colors">{currentUser.followers?.toLocaleString() || '1.2k'}</span>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-gray-400">Seguidores</span>
                                        </button>
                                        <div className="w-[1px] h-6 bg-white/10" />
                                        <div className="text-center flex-1">
                                            <span className="block text-lg font-black text-primary leading-none">{totalKm.toLocaleString()}</span>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">KM Rodados</span>
                                        </div>
                                        <div className="w-[1px] h-6 bg-white/10" />
                                        <button
                                            onClick={() => setUserListConfig({ isOpen: true, title: 'Seguindo', userIds: currentUser.followingList || [] })}
                                            className="text-center flex-1 group active:scale-95 transition-transform"
                                        >
                                            <span className="block text-lg font-black text-white leading-none group-hover:text-primary transition-colors">{currentUser.following?.toLocaleString() || '342'}</span>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-gray-400">Seguindo</span>
                                        </button>
                                    </div>

                                    <div className="flex gap-3 mt-4 w-full px-4">
                                        {me && me.email !== currentUser.email && !me.followingList?.some(id => String(id) === String(currentUser.id)) ? (
                                            <button
                                                onClick={() => {
                                                    followUser(currentUser.id);
                                                    setCurrentUser(prev => {
                                                        const meIdStr = String(me.id);
                                                        const updatedList = [...(prev.followersList || [])];
                                                        if (!updatedList.some(id => String(id) === meIdStr)) {
                                                            updatedList.push(meIdStr);
                                                        }
                                                        return {
                                                            ...prev,
                                                            followers: updatedList.length,
                                                            followersList: updatedList
                                                        };
                                                    });
                                                }}
                                                className="flex-1 bg-primary hover:bg-orange-500 text-black transition-all px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg shadow-primary/20 active:scale-95"
                                            >
                                                <UserPlus size={16} strokeWidth={3} />
                                                Seguir
                                            </button>
                                        ) : me && me.email !== currentUser.email && (
                                            <button
                                                onClick={() => {
                                                    followUser(currentUser.id);
                                                    setCurrentUser(prev => {
                                                        const meIdStr = String(me.id);
                                                        const updatedList = (prev.followersList || []).filter(id => String(id) !== meIdStr);
                                                        return {
                                                            ...prev,
                                                            followers: updatedList.length,
                                                            followersList: updatedList
                                                        };
                                                    });
                                                }}
                                                className="flex-1 bg-primary/10 border border-primary/20 text-primary hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg shadow-black/20 transition-all active:scale-95 group"
                                            >
                                                <div className="group-hover:hidden flex items-center gap-2">
                                                    <BadgeCheck size={16} strokeWidth={3} />
                                                    Seguindo
                                                </div>
                                                <div className="hidden group-hover:flex items-center gap-2">
                                                    <X size={16} strokeWidth={3} />
                                                    Deixar de Seguir
                                                </div>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsChatOpen(true)}
                                            className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare size={16} strokeWidth={3} />
                                            Mensagem
                                        </button>
                                    </div>
                                </div>

                                {/* Patches */}
                                {currentUser.patches && currentUser.patches.length > 0 && (
                                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                        {currentUser.patches.map((patch, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 whitespace-nowrap">
                                                <Shield size={12} className="text-primary" />
                                                <span className="text-xs text-gray-300 font-bold capitalize">{patch.replace('-', ' ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="w-full h-px bg-white/10 mb-6"></div>

                                {/* Stats Grid - Clickable to Open Tabs */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button
                                        onClick={() => setActiveTab('routes_history')}
                                        className="bg-black/20 rounded-xl p-4 border border-white/5 hover:bg-white/5 transition-colors text-left group"
                                    >
                                        <p className="text-gray-400 text-[10px] uppercase font-bold mb-1 group-hover:text-primary transition-colors">Rotas Concluídas</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-2xl font-black text-white">{currentUser.routesCompleted || currentUser.completedRoutes?.length || 0}</p>
                                            <div className="bg-white/10 p-1 rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors"><MapPin size={14} /></div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('events_history')}
                                        className="bg-black/20 rounded-xl p-4 border border-white/5 hover:bg-white/5 transition-colors text-left group"
                                    >
                                        <p className="text-gray-400 text-[10px] uppercase font-bold mb-1 group-hover:text-primary transition-colors">Eventos</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-2xl font-black text-white">{currentUser.eventsAttended || currentUser.pastEvents?.length || 0}</p>
                                            <div className="bg-white/10 p-1 rounded group-hover:bg-primary/20 group-hover:text-primary transition-colors"><Calendar size={14} /></div>
                                        </div>
                                    </button>
                                </div>

                                {/* Quick Preview: Suggested Routes List */}
                                {currentUser.suggestedRoutes && currentUser.suggestedRoutes.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 opacity-60">
                                            <MapPin size={16} />
                                            Rotas Criadas
                                        </h3>
                                        <div className="space-y-2">
                                            {currentUser.suggestedRoutes.map((route, idx) => (
                                                <div key={idx} className="bg-white/5 p-3 rounded-lg flex items-center justify-between border border-white/5">
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-200">{route.name}</p>
                                                        <p className="text-xs text-gray-500">{route.area} • {route.distance}</p>
                                                    </div>
                                                    <div className="bg-primary/10 p-1.5 rounded text-primary">
                                                        <Trophy size={14} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'routes_history' && (
                            <div className="p-8 h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => setActiveTab('profile')} className="bg-white/5 p-2 rounded-full hover:bg-white/10">
                                        <X size={16} /> {/* Should be Back Arrow but X works for close/back context */}
                                    </button>
                                    <h3 className="text-lg font-black text-white">Histórico de Rotas</h3>
                                </div>

                                <div className="space-y-3">
                                    {currentUser.completedRoutes && currentUser.completedRoutes.length > 0 ? (
                                        currentUser.completedRoutes.map((route, idx) => (
                                            <div key={idx} className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-white">{route.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{route.date}</span>
                                                        <span className="text-xs text-primary font-bold">{route.distance}</span>
                                                    </div>
                                                </div>
                                                <CheckCircle size={18} className="text-green-500" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 text-sm">Nenhuma rota concluída ainda.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'events_history' && (
                            <div className="p-8 h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => setActiveTab('profile')} className="bg-white/5 p-2 rounded-full hover:bg-white/10">
                                        <X size={16} />
                                    </button>
                                    <h3 className="text-lg font-black text-white">Eventos Participados</h3>
                                </div>

                                <div className="space-y-3">
                                    {currentUser.pastEvents && currentUser.pastEvents.length > 0 ? (
                                        currentUser.pastEvents.map((event, idx) => (
                                            <div key={idx} className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-white">{event.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{event.date}</span>
                                                        <span className="text-xs text-gray-400">{event.location}</span>
                                                    </div>
                                                </div>
                                                <Calendar size={18} className="text-primary" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 text-sm">Nenhum evento participado ainda.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div >

            <UserListModal
                isOpen={userListConfig.isOpen}
                onClose={() => setUserListConfig({ ...userListConfig, isOpen: false })}
                title={userListConfig.title}
                userIds={userListConfig.userIds}
                onUserSelect={(u) => setCurrentUser(u)}
            />

            <ChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                recipient={currentUser}
            />
        </AnimatePresence >
    );
}
