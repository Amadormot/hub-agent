import React, { useState, useMemo } from 'react';
import { X, Send, Search, CheckCircle2, User, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../contexts/UserContext';
import { useChat } from '../contexts/ChatContext';
import { useNotification } from '../contexts/NotificationContext';
import { useData } from '../contexts/DataContext';
import clsx from 'clsx';

export default function ShareModal({ isOpen, onClose, content }) {
    const { user: currentUser } = useUser();
    const { sendMessage } = useChat();
    const { notify } = useNotification();
    const { allUsers } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isSending, setIsSending] = useState(false);

    // Filter followed users and resolve their details from all known users
    const followedUsers = useMemo(() => {
        if (!currentUser || !currentUser.followingList) return [];

        return currentUser.followingList
            .map(id => {
                const idStr = String(id);
                if (idStr === 'me') return null;
                return allUsers.find(u => String(u.id) === idStr);
            })
            .filter(u => u && u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [currentUser, searchQuery, allUsers]);

    const handleToggleUser = (userId) => {
        setSelectedUserIds(prev =>
            prev.some(id => String(id) === String(userId))
                ? prev.filter(id => String(id) !== String(userId))
                : [...prev, String(userId)]
        );
    };

    const handleSend = async () => {
        if (selectedUserIds.length === 0) return;

        setIsSending(true);
        try {
            const shareText = content.type === 'evento'
                ? `🚀 Confira este evento: ${content.title || content.name}`
                : `📍 Confira esta rota: ${content.name}`;

            const shareLink = content.type === 'evento'
                ? `[Ver Evento](/eventos)`
                : `[Ver Rota](/rotas)`;

            const fullMessage = `${shareText}\n${shareLink}`;

            const shareMetadata = {
                type: content.type,
                id: content.id,
                name: content.title || content.name,
                image: content.image,
                location: content.location
            };

            for (const userId of selectedUserIds) {
                const userIdStr = String(userId);
                const recipient = allUsers.find(u => String(u.id) === userIdStr);
                if (recipient) {
                    sendMessage(recipient, fullMessage, null, shareMetadata);
                }
            }

            notify(`${selectedUserIds.length === 1 ? 'Compartilhado' : 'Compartilhados'} com sucesso!`, "success");
            setSelectedUserIds([]);
            onClose();
        } catch (error) {
            notify("Erro ao compartilhar. Tente novamente.", "error");
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <Share2 size={24} className="text-primary" />
                            Compartilhar
                        </h2>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
                            {content.type === 'evento' ? 'Evento' : 'Rota'}: {content.title || content.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar contatos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/30 transition-all"
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="max-h-64 overflow-y-auto px-2 pb-4 custom-scrollbar">
                    {followedUsers.length > 0 ? (
                        followedUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleToggleUser(user.id)}
                                className={clsx(
                                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all mb-1",
                                    selectedUserIds.includes(user.id) ? "bg-primary/20" : "hover:bg-white/5"
                                )}
                            >
                                <div className="relative">
                                    <img src={user.avatar} className="w-10 h-10 rounded-full border border-white/10" alt={user.name} />
                                    {selectedUserIds.includes(user.id) && (
                                        <div className="absolute -top-1 -right-1 bg-primary text-black rounded-full p-0.5">
                                            <CheckCircle2 size={12} fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium italic">Nível {user.level}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="py-8 text-center">
                            <User size={32} className="text-white/10 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Nenhum piloto encontrado</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-800/50 border-t border-white/5">
                    <button
                        onClick={handleSend}
                        disabled={selectedUserIds.length === 0 || isSending}
                        className={clsx(
                            "w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all",
                            selectedUserIds.length > 0 && !isSending
                                ? "bg-primary text-black hover:scale-[1.02] shadow-lg shadow-primary/20"
                                : "bg-white/5 text-gray-500 cursor-not-allowed"
                        )}
                    >
                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={16} fill="currentColor" />
                                Enviar para {selectedUserIds.length} {selectedUserIds.length === 1 ? 'piloto' : 'pilotos'}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
