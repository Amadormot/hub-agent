import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield, Search, UserPlus, UserCheck } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useData } from '../contexts/DataContext';
import clsx from 'clsx';

export default function UserListModal({ isOpen, onClose, title, userIds, onUserSelect }) {
    const { user: currentUser, followUser } = useUser();
    const { allUsers } = useData();
    const [searchQuery, setSearchQuery] = useState('');

    // Combine known users with current user
    const allCandidates = useMemo(() => {
        const candidates = [...allUsers];
        if (currentUser && !candidates.some(u => String(u.id) === String(currentUser.id))) {
            candidates.push(currentUser);
        }
        return candidates;
    }, [allUsers, currentUser]);

    // Filter based on userIds if provided, or show all for "Global Search"
    const relevantUsers = useMemo(() => {
        if (!userIds) return allCandidates;
        return allCandidates.filter(u => userIds.some(id => String(id) === String(u.id)));
    }, [allCandidates, userIds]);

    // Apply text search
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return relevantUsers;
        const query = searchQuery.toLowerCase();
        return relevantUsers.filter(u =>
            u.name.toLowerCase().includes(query) ||
            (u.motorcycle?.brand && u.motorcycle.brand.toLowerCase().includes(query)) ||
            (u.motorcycle?.model && u.motorcycle.model.toLowerCase().includes(query))
        );
    }, [relevantUsers, searchQuery]);

    const handleFollow = async (e, userId) => {
        e.stopPropagation();
        await followUser(userId);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-background-secondary border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{relevantUsers.length} Pilotos</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-3 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por nome ou moto..."
                                    className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="p-2 overflow-y-auto flex-1">
                            {filteredUsers.length > 0 ? (
                                <div className="space-y-1">
                                    {filteredUsers.map((item) => {
                                        const isFollowing = currentUser?.followingList?.some(id => String(id) === String(item.id));
                                        const isMe = String(currentUser?.id) === String(item.id);

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    onUserSelect(item);
                                                    onClose();
                                                }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all group cursor-pointer active:scale-[0.98]"
                                            >
                                                {/* Avatar */}
                                                <div className="relative shrink-0">
                                                    <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-800">
                                                        {item.avatar ? (
                                                            <img src={item.avatar} className="w-full h-full object-cover" alt={item.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary uppercase font-bold">
                                                                {item.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {item.clubBadge && (
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-background bg-zinc-900 overflow-hidden shadow-sm">
                                                            <img src={item.clubBadge} className="w-full h-full object-cover" alt="Badge" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-white group-hover:text-primary transition-colors text-sm">{item.name}</span>
                                                        <span className="bg-primary/20 text-primary text-[8px] px-1.5 py-0.5 rounded uppercase font-black border border-primary/20">Lvl {item.level || 1}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 line-clamp-1 italic">
                                                        {item.motorcycle?.model ? `${item.motorcycle.model}` : item.bio}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                {!isMe && (
                                                    <button
                                                        onClick={(e) => handleFollow(e, item.id)}
                                                        className={clsx(
                                                            "p-2 rounded-xl transition-all active:scale-95 border",
                                                            isFollowing
                                                                ? "bg-white/5 border-white/10 text-gray-400"
                                                                : "bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-black hover:border-primary"
                                                        )}
                                                        title={isFollowing ? "Deixar de seguir" : "Seguir"}
                                                    >
                                                        {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
                                        <Search size={24} className="text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest px-10">Nenhum motociclista condiz com sua busca</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
