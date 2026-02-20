import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Share2, Clock, Newspaper, Shield } from 'lucide-react';

export default function NewsDetailsModal({ news, isOpen, onClose }) {
    if (!news) return null;

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-lg bg-background-secondary rounded-t-[32px] sm:rounded-[32px] overflow-hidden border-t sm:border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="overflow-y-auto no-scrollbar pb-32">
                            {/* Image Header */}
                            <div className="aspect-[16/9] relative w-full bg-white/5">
                                <img
                                    src={news.image || news.urlToImage}
                                    alt={news.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background-secondary via-transparent to-black/40"></div>
                            </div>

                            {/* Info Section */}
                            <div className="p-8 pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-md uppercase tracking-widest border border-primary/20 flex items-center gap-1.5">
                                        <Newspaper size={12} /> NOTÍCIA
                                    </span>
                                    <span className="text-[10px] font-black bg-white/5 text-gray-500 px-3 py-1 rounded-md uppercase tracking-widest border border-white/5">
                                        {news.source}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-black text-white leading-tight mb-4 uppercase italic">
                                    {news.title}
                                </h2>

                                <div className="flex items-center gap-4 mb-8 text-gray-500">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        <Clock size={12} /> {timeAgo(news.created_at || news.date)} ago
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-6 text-gray-300 text-sm leading-relaxed italic">
                                    {news.content || news.summary || news.description || "Esta notícia está disponível na íntegra no site oficial. Clique no botão abaixo para ler a matéria completa."}
                                </div>

                                <div className="mt-12 bg-white/5 rounded-2xl border border-white/5 p-1">
                                    <a
                                        href={news.url || news.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-primary hover:bg-orange-600 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-primary/20 text-sm uppercase tracking-widest"
                                    >
                                        LER MATÉRIA COMPLETA <ExternalLink size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
