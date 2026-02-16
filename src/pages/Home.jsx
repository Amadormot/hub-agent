import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, MapPin, Heart, Newspaper, Clock, ExternalLink, List } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import clsx from 'clsx';

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

export default function Home() {
    const { user } = useUser();
    const { routes, events, news } = useData();
    const navigate = useNavigate();

    return (
        <div className="p-6 space-y-8 pb-24">
            {/* Radar Pulse Animation Background */}
            <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
            <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse pointer-events-none z-0"></div>

            {/* Header Radar Style - REMOVED (Global Header) */}

            {/* Banner Marketing (Compact) */}
            <motion.section
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-5 border border-white/5 overflow-hidden shadow-lg"
                onClick={() => navigate('/eventos')}
            >
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-lg font-black text-white uppercase italic leading-none mb-1">Destaque seu <br /><span className="text-primary">Evento</span></h2>
                        <p className="text-[10px] text-gray-400 font-bold mb-3 max-w-[150px]">Alcance mais motociclistas na sua região.</p>
                        <button className="bg-primary text-black text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-white transition-colors">
                            Anunciar
                        </button>
                    </div>
                    <Trophy size={48} className="text-primary/20 rotate-12" />
                </div>
            </motion.section>

            {/* Feed de Notícias — Redesigned */}
            {news.length > 0 && (
                <section className="relative z-10">
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Newspaper size={18} className="text-primary" />
                            Radar de Notícias
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                                {news.length} artigos
                            </span>
                            <button
                                onClick={() => navigate('/noticias')}
                                className="bg-white/5 hover:bg-white/10 text-primary p-2 rounded-xl border border-white/5 transition-colors active:scale-95"
                                title="Ver todos os artigos e buscar"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

                    {/* News — Horizontal Scroll */}
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                        {news.map((item) => (
                            <div
                                key={item.id}
                                className="shrink-0 w-72 h-40 rounded-xl overflow-hidden relative border border-white/5 cursor-pointer group active:scale-[0.97] transition-transform"
                                onClick={() => window.open(item.url, '_blank')}
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                    <span className="bg-primary/90 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {item.source}
                                    </span>
                                    <span className="bg-black/50 backdrop-blur-sm text-gray-300 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 flex items-center gap-0.5">
                                        <Clock size={8} /> {timeAgo(item.created_at || item.date)}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h4 className="text-white font-bold text-sm leading-snug line-clamp-2 drop-shadow-md">
                                        {item.title}
                                    </h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Rotas em Alta (Horizontal Scroll) */}
            <section className="relative z-10">
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        🔥 Rotas Quentes
                    </h3>
                    <Link to="/rotas" className="text-[10px] text-primary font-bold uppercase tracking-wide">Ver todas</Link>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                    {routes
                        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                        .slice(0, 5)
                        .map((route, index) => (
                            <motion.div
                                key={route.id}
                                className="shrink-0 w-60 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 active:scale-95 transition-transform"
                                onClick={() => navigate('/rotas')}
                            >
                                <div className="h-28 relative">
                                    <img src={route.image} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                                    <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                                        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-white">
                                                <MapPin size={10} className="text-primary" /> {route.distance}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-white text-sm truncate mb-1">{route.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                        <span className="text-primary">{route.level || 'Iniciante'}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Heart size={10} /> {route.likes}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                </div>
            </section>

            {/* Eventos (Horizontal Cards) */}
            <section className="relative z-10">
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        🎉 Próximos Eventos
                    </h3>
                    <Link to="/eventos" className="text-[10px] text-primary font-bold uppercase tracking-wide">Ver agenda</Link>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-8 -mx-6 px-6 scrollbar-hide">
                    {events
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
                        .slice(0, 5)
                        .map((event, index) => (
                            <motion.div
                                key={event.id}
                                className={clsx(
                                    "shrink-0 w-40 aspect-[3/4] rounded-2xl overflow-hidden relative group active:scale-95 transition-transform border",
                                    event.premium
                                        ? "border-premium/50 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]"
                                        : "border-white/10"
                                )}
                                onClick={() => navigate('/eventos')}
                            >
                                <img src={event.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop'} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>

                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded border border-white/10">
                                    {event.date.split(' ')[0]} {/* Day only */}
                                </div>

                                {event.premium && (
                                    <div className="absolute top-0 left-0 bg-premium text-black text-[10px] font-black px-3 py-1 rounded-br-xl uppercase tracking-wider backdrop-blur-sm bg-opacity-90 z-20 shadow-lg">
                                        Destaque
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h4 className="font-black text-white text-sm leading-tight mb-1 drop-shadow-md line-clamp-2">{event.title}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-300 font-bold">
                                        <MapPin size={10} className="text-primary" />
                                        <span className="truncate">{event.location?.split(',')[0]}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                </div>
            </section>
        </div>
    );
}
