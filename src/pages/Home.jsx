import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Heart, Clock, Users, Search, Share2, Bookmark, Crown, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { useNotification } from '../contexts/NotificationContext';
import { calculateDistance, getCurrentPosition } from '../utils/geo';
import clsx from 'clsx';

// Components
import UserListModal from '../components/UserListModal';
import UserProfileModal from '../components/UserProfileModal';
import RouteDetailsModal from '../components/RouteDetailsModal';
import EventDetailsModal from '../components/EventDetailsModal';
import RouteCard from '../components/RouteCard';
import EventCard from '../components/EventCard';
import ShareModal from '../components/ShareModal';
import PullToRefresh from '../components/PullToRefresh';
import ProductDetailsModal from '../components/ProductDetailsModal';
import NewsDetailsModal from '../components/NewsDetailsModal';

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
    const { news, events, routes, products, affiliates, joinEvent, allUsers, refreshData, isLoadingAutomation, registerSale } = useData();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const {
        user: currentUser,
        toggleLike: toggleLikeRoute,
        toggleFavorite: toggleFavoriteRoute,
        toggleLikeEvent,
        toggleFavoriteEvent,
        checkInEvent,
        processingCheckIns,
        startRoute,
        endRoute,
        abortRoute,
        activeRoute
    } = useUser();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
    const [viewingRoute, setViewingRoute] = useState(null);
    const [viewingEvent, setViewingEvent] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [viewingNews, setViewingNews] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareContent, setShareContent] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // Auto-open logic for shared content
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const autoOpenId = params.get('id');
        const autoOpenType = params.get('type');

        if (autoOpenId && autoOpenType) {
            if (autoOpenType === 'evento') {
                const ev = events.find(e => String(e.id) === String(autoOpenId));
                if (ev) setViewingEvent(ev);
            } else if (autoOpenType === 'rota') {
                const rt = routes.find(r => String(r.id) === String(autoOpenId));
                if (rt) setViewingRoute(rt);
            }
        }
    }, [location, events, routes]);

    // Content Interleaving Logic (Real Interleaving)
    const feedItems = useMemo(() => {
        const newsBuckets = [...news].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
        const eventBuckets = [...events].sort((a, b) => (a.premium ? -1 : 1));
        const routeBuckets = [...routes].sort((a, b) => (b.likes || 0) - (a.likes || 0));
        const productBuckets = [...products, ...(affiliates || [])];

        const finalFeed = [];
        const maxLength = Math.max(newsBuckets.length, eventBuckets.length, routeBuckets.length, productBuckets.length);

        for (let i = 0; i < maxLength; i++) {
            if (newsBuckets[i]) finalFeed.push({ ...newsBuckets[i], feedType: 'news' });
            if (eventBuckets[i]) finalFeed.push({ ...eventBuckets[i], feedType: 'event' });
            if (routeBuckets[i]) finalFeed.push({ ...routeBuckets[i], feedType: 'route' });
            if (productBuckets[i]) finalFeed.push({ ...productBuckets[i], feedType: 'product' });

            // Random Banner Injection (every ~5 items)
            if (finalFeed.length > 0 && finalFeed.length % 5 === 0) {
                const banners = [
                    {
                        id: `banner-event-${finalFeed.length}`,
                        feedType: 'banner',
                        title: "Destaque seu Evento",
                        description: "Alcance milhares de motociclistas com anúncios premium no Moto Hub Brasil.",
                        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000",
                        actionLabel: "Ver Planos",
                        link: "/profile"
                    },
                    {
                        id: `banner-store-${finalFeed.length}`,
                        feedType: 'banner',
                        title: "Sua Loja na Garagem",
                        description: "Quer vender seus produtos aqui? Entre em contato para integração de afiliados.",
                        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000",
                        actionLabel: "Anunciar",
                        link: "/garagem"
                    },
                    {
                        id: `banner-club-${finalFeed.length}`,
                        feedType: 'banner',
                        title: "Crie seu Motoclube",
                        description: "Organize seus membros, rotas e eventos em um só lugar.",
                        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000",
                        actionLabel: "Começar",
                        link: "/profile"
                    }
                ];
                finalFeed.push(banners[Math.floor(Math.random() * banners.length)]);
            }
        }

        return finalFeed;
    }, [news, events, routes, products, affiliates]);

    // Filter featured members
    const featuredMembers = allUsers
        .filter(u => String(u.id) !== String(currentUser?.id))
        .sort((a, b) => (b.level || 1) - (a.level || 1))
        .slice(0, 10);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        setTimeout(() => setIsRefreshing(false), 1000);
        notify("Radar atualizado!", "success");
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
            {/* Background Effects */}
            <div className="fixed top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0"></div>

            {/* Header / Pilotos no Radar — Integrated into Scroll */}
            <div className="px-6 pt-8 pb-4 relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        Pilotos no Radar
                    </h3>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary active:scale-95 transition-all"
                    >
                        <Search size={18} />
                    </button>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6">
                    {featuredMembers.map((member) => (
                        <motion.div
                            key={member.id}
                            whileTap={{ scale: 0.9 }}
                            className="shrink-0 flex flex-col items-center gap-2 group"
                            onClick={() => setViewingUser(member)}
                        >
                            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-primary to-orange-500 shadow-lg shadow-primary/10">
                                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-zinc-800">
                                    {member.avatar ? (
                                        <img
                                            src={member.avatar}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            style={{ transform: `scale(${member.avatarFraming?.zoom || 1}) translate(${member.avatarFraming?.x || 0}%, ${member.avatarFraming?.y || 0}%)` }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-base font-black text-primary/40">{member.name[0]}</div>
                                    )}
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase truncate w-16 text-center transition-colors">{member.name.split(' ')[0]}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Vertical Feed Header */}
            <div className="px-6 py-2 relative z-10">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
            </div>

            {/* Vertical Feed */}
            <div className="flex flex-col gap-8 p-4 relative z-10">
                {feedItems.map((item, index) => {
                    if (item.feedType === 'route') {
                        return (
                            <RouteCard
                                key={`${item.feedType}-${item.id}-${index}`}
                                route={item}
                                index={index}
                                user={currentUser}
                                activeRoute={activeRoute}
                                onStartRoute={(e, r) => startRoute(r)}
                                onToggleLike={(e, id) => toggleLikeRoute(id)}
                                onToggleFavorite={(e, id) => toggleFavoriteRoute(id)}
                                onOpenProfile={(e, u) => setViewingUser(u)}
                                onClick={() => setViewingRoute(item)}
                            />
                        );
                    }

                    if (item.feedType === 'event') {
                        return (
                            <EventCard
                                key={`${item.feedType}-${item.id}-${index}`}
                                event={item}
                                index={index}
                                user={currentUser}
                                isLocating={isLocating}
                                processingCheckIns={processingCheckIns}
                                onJoin={(ev) => joinEvent(ev.id, currentUser)}
                                onCheckIn={async (e, ev) => {
                                    setIsLocating(true);
                                    try {
                                        const pos = await getCurrentPosition();
                                        const distance = calculateDistance(pos.coords.latitude, pos.coords.longitude, ev.latitude, ev.longitude);
                                        if (distance <= 1) {
                                            checkInEvent(ev);
                                        } else {
                                            const distStr = (distance !== null && distance !== undefined) ? Number(distance).toFixed(1) : "0";
                                            notify(`Você está a ${distStr}km.`, "warning");
                                        }
                                    } catch (err) {
                                        notify("Ative o GPS.", "error");
                                    } finally {
                                        setIsLocating(false);
                                    }
                                }}
                                onToggleLike={(e, id) => toggleLikeEvent(id)}
                                onToggleFavorite={(e, id) => toggleFavoriteEvent(id)}
                                onOpenProfile={(e, u) => setViewingUser(u)}
                                onClick={() => setViewingEvent(item)}
                            />
                        );
                    }

                    return (
                        <motion.div
                            key={`${item.feedType}-${item.id}-${index}`}
                            onClick={() => {
                                if (item.feedType === 'news') setViewingNews(item);
                                if (item.feedType === 'product') setViewingProduct(item);
                                if (item.feedType === 'banner') navigate(item.link || '/');
                            }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className="relative w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group"
                        >
                            {/* Imagem de Fundo */}
                            <img
                                src={item.image || item.urlToImage}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                            {/* Overlay: Top Info */}
                            <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border",
                                    item.feedType === 'news' && "bg-primary text-black border-primary/50",
                                    item.feedType === 'product' && "bg-green-600 text-white border-green-400/50",
                                    item.feedType === 'banner' && "bg-gradient-to-r from-primary to-orange-500 text-black border-white/20"
                                )}>
                                    {item.feedType === 'news' ? 'Notícia' :
                                        item.feedType === 'product' ? 'Garagem' : 'Divulgação'}
                                </span>

                                {item.feedType === 'news' && (
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full border border-white/10">
                                        {item.source}
                                    </span>
                                )}
                            </div>

                            {/* Overlay: Bottom Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black via-black/90 to-transparent">
                                <h2 className="text-xl font-black text-white uppercase italic leading-tight mb-2 group-hover:text-primary transition-colors">
                                    {item.title || item.name}
                                </h2>

                                {(item.description || item.content) && (
                                    <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed italic opacity-80">
                                        {item.description || item.content}
                                    </p>
                                )}

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        {item.feedType === 'product' && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-black text-primary">{item.price}</span>
                                                {item.discount && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-black">{item.discount}</span>}
                                            </div>
                                        )}
                                        {item.feedType === 'news' && (
                                            <p className="text-xs text-gray-400 line-clamp-1 italic">
                                                Fonte: {item.source} • {timeAgo(item.created_at || item.date)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Main Action Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (item.feedType === 'news') setViewingNews(item);
                                            if (item.feedType === 'product') setViewingProduct(item);
                                            if (item.feedType === 'banner') navigate(item.link || '/');
                                        }}
                                        className="h-12 px-6 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all active:scale-95 shadow-xl shadow-white/5"
                                    >
                                        {item.feedType === 'news' ? 'Ler mais' :
                                            item.feedType === 'product' ? 'Ver Oferta' : 'Saiba Mais'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Modals for Deep Integration */}
            <RouteDetailsModal
                route={viewingRoute}
                onClose={() => setViewingRoute(null)}
                user={currentUser}
                isCheckedIn={currentUser?.completedRoutes?.includes(String(viewingRoute?.id))}
                activeRoute={activeRoute}
                onStartRoute={(e, r) => startRoute(r)}
                onEndRoute={(e, r) => endRoute(r)}
                onAbortRoute={() => abortRoute()}
                onToggleLike={(e, id) => toggleLikeRoute(e, id)}
                onToggleFavorite={(e, id) => toggleFavoriteRoute(e, id)}
                onShare={(r) => {
                    setShareContent({ ...r, type: 'rota' });
                    setIsShareModalOpen(true);
                }}
                onOpenProfile={(u) => setViewingUser(u)}
            />

            <EventDetailsModal
                event={viewingEvent}
                onClose={() => setViewingEvent(null)}
                user={currentUser}
                isProcessing={processingCheckIns?.has(String(viewingEvent?.id))}
                isLocating={isLocating}
                onJoin={(ev) => {
                    if (!currentUser) {
                        notify("Faça login para participar!", "info");
                        return;
                    }
                    joinEvent(ev.id, currentUser);
                    notify("Presença confirmada!", "success");
                }}
                onCheckIn={async (ev) => {
                    setIsLocating(true);
                    try {
                        const pos = await getCurrentPosition();
                        const distance = calculateDistance(pos.coords.latitude, pos.coords.longitude, ev.latitude, ev.longitude);
                        if (distance <= 1) {
                            checkInEvent(ev);
                        } else {
                            notify(`Você está a ${distance.toFixed(1)}km.`, "warning");
                        }
                    } catch (err) {
                        notify("Ative o GPS.", "error");
                    } finally {
                        setIsLocating(false);
                    }
                }}
                onOpenProfile={(u) => setViewingUser(u)}
                onShare={(ev) => {
                    setShareContent({ ...ev, type: 'evento' });
                    setIsShareModalOpen(true);
                }}
            />

            <ProductDetailsModal
                product={viewingProduct}
                isOpen={!!viewingProduct}
                onClose={() => setViewingProduct(null)}
                onBuy={(e, p) => {
                    registerSale(p);
                    // notify("Link de afiliado ativado!", "success"); // Optional toast here too
                }}
            />

            <NewsDetailsModal
                news={viewingNews}
                isOpen={!!viewingNews}
                onClose={() => setViewingNews(null)}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                content={shareContent}
            />

            <UserListModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                title="Buscar Pilotos"
                onUserSelect={(u) => setViewingUser(u)}
            />

            <UserProfileModal
                user={viewingUser}
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(null)}
            />
        </PullToRefresh>
    );
}
