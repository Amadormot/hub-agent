import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Clock, ExternalLink, Newspaper } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateStr) {
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
}

export default function NewsFeed() {
    const { news } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNews = useMemo(() => {
        if (!searchTerm) return news;
        const lowerTerm = searchTerm.toLowerCase();
        return news.filter(item =>
            item.title.toLowerCase().includes(lowerTerm) ||
            (item.summary && item.summary.toLowerCase().includes(lowerTerm)) ||
            item.source.toLowerCase().includes(lowerTerm)
        );
    }, [news, searchTerm]);

    return (
        <div className="p-6 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/5"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-white flex items-center gap-2 leading-none">
                        <Newspaper size={24} className="text-primary" />
                        Arquivo de Notícias
                    </h1>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider ml-8">
                        {news.length} artigos disponíveis
                    </span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="sticky top-[88px] z-20 -mx-6 px-6 py-4 bg-background/95 backdrop-blur-md border-b border-white/5">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar por título, fonte ou assunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                {searchTerm && (
                    <div className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wide flex justify-between px-1">
                        <span>{filteredNews.length} resultados encontrados</span>
                        <span className="text-primary cursor-pointer" onClick={() => setSearchTerm('')}>
                            Limpar filtro
                        </span>
                    </div>
                )}
            </div>

            {/* News List */}
            <div className="space-y-4">
                {filteredNews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Search size={48} className="opacity-20 mb-4" />
                        <p className="text-sm">Nenhuma notícia encontrada.</p>
                    </div>
                ) : (
                    filteredNews.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-zinc-900 rounded-xl p-3 border border-white/5 hover:border-white/10 active:scale-[0.99] transition-all cursor-pointer flex gap-4 group shadow-lg"
                            onClick={() => window.open(item.url, '_blank')}
                        >
                            {/* Thumbnail */}
                            <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-zinc-800 relative">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop';
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider truncate max-w-[100px]">
                                            {item.source}
                                        </span>
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                                            <Clock size={10} /> {timeAgo(item.created_at || item.date)}
                                        </span>
                                    </div>
                                    <h3 className="text-white text-base font-bold leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-gray-400 line-clamp-1 w-[80%]">
                                        {item.summary ? item.summary.replace(/<[^>]*>/g, '').slice(0, 50) + '...' : 'Ler matéria completa'}
                                    </span>
                                    <ExternalLink size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
