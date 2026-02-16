import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, ChevronLeft, Image as ImageIcon, Smile, Paperclip, Camera, Navigation, Download } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useUser } from '../contexts/UserContext';
import { compressImage } from '../utils/imageCompression';

// Quick reactions list
const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function ChatModal({ isOpen, onClose, recipient }) {
    const { user: currentUser } = useUser();
    const { sendMessage, getConversation, markAsRead, addReaction } = useChat();
    const [messageText, setMessageText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const scrollRef = useRef(null);

    // Common Emojis
    const emojis = ["👍", "👋", "🏍️", "🔥", "😂", "😎", "🤝", "🍻", "❤️", "📍", "📸", "✅"];

    const messages = recipient ? getConversation(recipient.id || recipient.email) : [];

    const handleSend = (e) => {
        e.preventDefault();
        if ((!messageText.trim()) || !recipient) return;

        sendMessage(recipient, messageText);
        setMessageText('');
        setShowEmojiPicker(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const compressedImage = await compressImage(file, 1600, 0.85);
            sendMessage(recipient, '', compressedImage);
        } catch (error) {
            console.error("Erro ao comprimir imagem:", error);
            alert("Erro ao processar imagem.");
        }
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const handleCapture = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const compressedImage = await compressImage(file, 1600, 0.85);
            sendMessage(recipient, '', compressedImage);
        } catch (error) {
            console.error("Erro ao processar captura:", error);
            alert("Erro ao processar foto.");
        }
        e.target.value = '';
    };

    const addEmoji = (emoji) => {
        setMessageText(prev => prev + emoji);
    };

    const handleDownloadImage = (e, imageUrl, fileName) => {
        e.preventDefault();
        e.stopPropagation();

        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName || `moto-hub-image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Mark as read when opening
    useEffect(() => {
        if (isOpen && recipient && currentUser) {
            const chatId = [currentUser.id || currentUser.email, recipient.id || recipient.email].sort().join('_');
            markAsRead(chatId);
        }
    }, [isOpen, recipient, messages.length]); // Mark read when opening or receiving new msg while open

    if (!recipient) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0.5 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-background-secondary sm:rounded-3xl rounded-t-3xl border-t sm:border border-white/10 shadow-2xl flex flex-col h-[80vh] sm:h-[600px] pointer-events-auto overflow-hidden"
                    >
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full sm:hidden">
                                    <ChevronLeft size={20} className="text-gray-400" />
                                </button>
                                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-zinc-800 shrink-0">
                                    {recipient.avatar ? (
                                        <img src={recipient.avatar} className="w-full h-full object-cover" alt={recipient.name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                                            {recipient.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white">{recipient.name}</h3>
                                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Messages List */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
                            onClick={() => setShowEmojiPicker(false)}
                        >
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-8">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-dashed border-white/20">
                                        <Send size={24} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-white">Inicie uma conversa com {recipient.name.split(' ')[0]}</p>
                                    <p className="text-[10px] mt-2 text-gray-400">Combine rotas, troque dicas e faça novos amigos no asfalto.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === (currentUser?.id || currentUser?.email);
                                    const avatarSrc = isMe ? currentUser?.avatar : recipient?.avatar;

                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10, x: isMe ? 20 : -20 }}
                                            animate={{ opacity: 1, y: 0, x: 0 }}
                                            className={`flex gap-3 mb-4 ${isMe ? 'flex-row-reverse' : ''} group relative`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/10 self-end mb-1">
                                                {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/20" />}
                                            </div>

                                            <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`p-3 rounded-2xl text-sm break-words relative overflow-visible ${isMe
                                                    ? 'bg-primary !text-black font-medium rounded-tr-none shadow-lg shadow-primary/10'
                                                    : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                                                    }`}>
                                                    {msg.image && (
                                                        <div className="relative group/image mb-2">
                                                            <img
                                                                src={msg.image}
                                                                alt="Attachment"
                                                                className="rounded-lg max-w-full max-h-48 object-cover border border-black/10"
                                                            />
                                                            <button
                                                                onClick={(e) => handleDownloadImage(e, msg.image)}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover/image:opacity-100 transition-opacity backdrop-blur-sm"
                                                                title="Baixar imagem"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {msg.metadata?.id && (
                                                        <div className="mb-2 bg-black/40 rounded-xl overflow-hidden border border-white/10 group/card shadow-inner min-w-[200px]">
                                                            <div className="h-32 relative">
                                                                <img src={msg.metadata.image || 'https://images.unsplash.com/photo-1558981403-c5f91dbbe9ad'} className="w-full h-full object-cover" alt={msg.metadata.name} />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-bottom p-3 flex-col justify-end">
                                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{msg.metadata.type === 'evento' ? 'Evento' : 'Rota'}</span>
                                                                    <p className="text-xs font-black text-white truncate drop-shadow-md">{msg.metadata.name}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const path = msg.metadata.type === 'evento' ? '/eventos' : '/rotas';
                                                                    window.location.href = `${path}?id=${msg.metadata.id}`;
                                                                }}
                                                                className="w-full py-2.5 px-3 bg-white/5 hover:bg-primary hover:text-black transition-all text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border-t border-white/5"
                                                            >
                                                                <Navigation size={12} className="fill-current" />
                                                                Ver Detalhes
                                                            </button>
                                                        </div>
                                                    )}

                                                    {msg.text && <p className={msg.metadata ? "text-xs opacity-70" : ""}>{msg.text}</p>}

                                                    {/* Reactions Display */}
                                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                        <div className={`absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'} flex gap-1`}>
                                                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => {
                                                                        const chatId = [currentUser.id || currentUser.email, recipient.id || recipient.email].sort().join('_');
                                                                        addReaction(chatId, msg.id, emoji);
                                                                    }}
                                                                    className={`text-[10px] px-1.5 py-0.5 rounded-full border shadow-sm transition-transform hover:scale-110 flex items-center gap-1
                                                                        ${users.includes(currentUser?.id || currentUser?.email)
                                                                            ? 'bg-primary text-black border-primary'
                                                                            : 'bg-zinc-800 text-gray-300 border-white/10'}`}
                                                                >
                                                                    <span>{emoji}</span>
                                                                    <span className="font-bold">{users.length}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 mt-1 px-1">
                                                    <span className="text-[10px] text-gray-500">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>

                                                    {/* Reaction Trigger Button (Hover/Click) */}
                                                    <div className="relative group/reaction">
                                                        <button className="text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Smile size={14} />
                                                        </button>

                                                        {/* Quick Reaction Popup */}
                                                        <div className={`absolute bottom-full ${isMe ? 'right-0' : 'left-0'} mb-2 bg-zinc-800 border border-white/10 rounded-full p-1 flex gap-1 shadow-xl opacity-0 invisible group-hover/reaction:opacity-100 group-hover/reaction:visible transition-all duration-200 z-10`}>
                                                            {quickReactions.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => {
                                                                        const chatId = [currentUser.id || currentUser.email, recipient.id || recipient.email].sort().join('_');
                                                                        addReaction(chatId, msg.id, emoji);
                                                                    }}
                                                                    className="hover:scale-125 transition-transform p-1 text-base leading-none"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Emoji Picker Popover */}
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute bottom-20 left-4 bg-zinc-800 border border-white/10 rounded-xl p-3 shadow-2xl z-50 w-64 grid grid-cols-6 gap-2"
                                >
                                    {emojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => addEmoji(emoji)}
                                            className="text-xl hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-white/5 bg-zinc-900/30">
                            <form onSubmit={handleSend} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 pl-2 focus-within:border-primary/50 transition-all">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-2 rounded-xl transition-colors ${showEmojiPicker ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Smile size={20} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-gray-400 hover:text-white rounded-xl transition-colors"
                                >
                                    <ImageIcon size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="p-2 text-gray-400 hover:text-white rounded-xl transition-colors"
                                >
                                    <Camera size={20} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <input
                                    type="file"
                                    ref={cameraInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCapture}
                                />

                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Mensagem..."
                                    className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-gray-600 min-w-0"
                                />
                                <button
                                    type="submit"
                                    disabled={!messageText.trim()}
                                    className="w-10 h-10 bg-primary disabled:bg-zinc-800 disabled:opacity-50 text-black rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0"
                                >
                                    <Send size={18} strokeWidth={2.5} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
