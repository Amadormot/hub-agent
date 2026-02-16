import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Shield } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useData } from '../contexts/DataContext';

export default function UserListModal({ isOpen, onClose, title, userIds, onUserSelect }) {
    const { user: currentUser } = useUser();
    const { allUsers } = useData();

    // Combine known users with current user so they appear in lists if needed
    const allCandidates = [...allUsers];
    if (currentUser && !allCandidates.some(u => String(u.id) === String(currentUser.id))) {
        allCandidates.push(currentUser);
    }

    // Filter actual users from the ID list
    const listUsers = allCandidates.filter(u => userIds && userIds.some(id => String(id) === String(u.id)));

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
                        className="relative w-full max-w-md bg-background-secondary border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh]"
                    >
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="p-2 overflow-y-auto overflow-x-hidden">
                            {listUsers.length > 0 ? (
                                <div className="space-y-1">
                                    {listUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                onUserSelect(user);
                                                onClose();
                                            }}
                                            className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all group active:scale-[0.98]"
                                        >
                                            <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-800 shrink-0">
                                                {user.avatar ? (
                                                    <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary uppercase font-bold">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white group-hover:text-primary transition-colors">{user.name}</span>
                                                    <span className="bg-primary text-black text-[8px] px-1.5 py-0.5 rounded uppercase font-black">Lvl {user.level}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-1 italic">{user.bio || "Motociclista apaixonado"}</p>
                                            </div>

                                            {user.clubBadge && (
                                                <div className="p-1.5 bg-zinc-800 rounded-lg border border-white/5">
                                                    <Shield size={14} className="text-primary" fill="currentColor" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
                                        <User size={24} className="text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Nenhum motociclista encontrado</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
