import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Trophy, MapPin, Bike, Shield, Baby, Map, TrendingUp, Sunrise, BatteryCharging, CloudRain, Users, Tent, Crown, QrCode, Download, Image as ImageIcon } from 'lucide-react';
import { getPatchByLevel } from '../constants/patches';
import { useNotification } from '../contexts/NotificationContext';
import { useState } from 'react';

export default function ProfileShareModal({ isOpen, onClose, user, stats }) {
    const { notify } = useNotification();
    const [isExporting, setIsExporting] = useState(false);

    if (!user) return null;

    const generateImage = async () => {
        const card = document.getElementById('pilot-card-export');
        if (!card) return null;

        if (typeof window.html2canvas === 'undefined') {
            notify("Aguarde o carregamento do gerador de imagem...", "warning");
            return null;
        }

        setIsExporting(true);
        try {
            const canvas = await window.html2canvas(card, {
                backgroundColor: '#09090b',
                scale: 3, // 360 * 3 = 1080px (Instagram standard)
                useCORS: true,
                logging: false,
                allowTaint: true
            });

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            });
        } catch (error) {
            console.error('Error generating image:', error);
            notify("Erro ao gerar imagem. Tente novamente.", "error");
            return null;
        } finally {
            setIsExporting(false);
        }
    };

    const handleShareImage = async () => {
        const blob = await generateImage();
        if (!blob) return;

        const file = new File([blob], `pilot-card-${user.name.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Meu Pilot Card - Stories`,
                    text: `Dá um check no meu perfil no Jornada Biker! 🏍️🔥`
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.log('Error sharing file:', error);
                    // Fallback to download if sharing fails
                    downloadBlob(blob);
                }
            }
        } else {
            // Fallback: Download and copy link
            downloadBlob(blob);
            notify("Seu navegador não suporta compartilhamento direto de imagem. O card foi baixado!", "info");
        }
    };

    const downloadBlob = (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pilot-card-${user.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        notify("Link do perfil copiado!", "success");
    };

    const patch = getPatchByLevel(user.level);
    const PatchIcon = patch ? {
        "Baby": Baby, "Bike": Bike, "Map": Map, "TrendingUp": TrendingUp,
        "Sunrise": Sunrise, "BatteryCharging": BatteryCharging, "CloudRain": CloudRain,
        "Users": Users, "Tent": Tent, "Crown": Crown
    }[patch.icon] || Shield : Shield;

    const tierColors = user.level >= 10 ? 'from-yellow-600 to-yellow-900 border-yellow-400' :
        user.level >= 7 ? 'from-blue-600 to-blue-900 border-blue-400' :
            user.level >= 4 ? 'from-red-600 to-red-900 border-red-400' :
                'from-gray-700 to-gray-900 border-gray-500';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-[420px] flex flex-col items-center"
                    >
                        {/* THE CARD (Exportable Area) */}
                        <div
                            id="pilot-card-export"
                            className="w-[360px] h-[640px] bg-zinc-950 relative flex flex-col items-center shadow-2xl mx-auto overflow-hidden text-center"
                        >
                            {/* Background imitating Profile Header */}
                            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-800 to-zinc-950 z-0">
                                <div className="absolute inset-0 bg-black/20"></div>
                            </div>

                            {/* Content Container - pushing down to match profile spacing */}
                            <div className="relative z-10 mt-24 w-full px-6 flex flex-col items-center">

                                {/* Avatar Section */}
                                <div className="relative mb-4">
                                    <div className="w-32 h-32 rounded-full border-4 border-zinc-950 overflow-hidden bg-gray-700 shadow-2xl relative z-10">
                                        <img
                                            src={user.avatar}
                                            crossOrigin="anonymous"
                                            className="w-full h-full object-cover"
                                            style={{
                                                transform: `scale(${user.avatarFraming?.zoom || 1}) translate(${user.avatarFraming?.x || 0}%, ${user.avatarFraming?.y || 0}%)`
                                            }}
                                        />
                                    </div>

                                    {/* Club Badge - Circular */}
                                    {user.clubBadge && (
                                        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg z-20 border-4 border-zinc-950 overflow-hidden">
                                            <div className="w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={user.clubBadge}
                                                    crossOrigin="anonymous"
                                                    className="w-full h-full object-cover"
                                                    style={{
                                                        transform: `scale(${user.badgeFraming?.zoom || 1}) translate(${user.badgeFraming?.x || 0}%, ${user.badgeFraming?.y || 0}%)`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Name & Level */}
                                <div className="mb-6">
                                    <h1 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-2">
                                        {user.name}
                                        {(() => {
                                            const tierColors = user.level >= 10 ? 'from-yellow-600 to-yellow-900 border-yellow-400' :
                                                user.level >= 7 ? 'from-blue-600 to-blue-900 border-blue-400' :
                                                    user.level >= 4 ? 'from-red-600 to-red-900 border-red-400' :
                                                        'from-gray-700 to-gray-900 border-gray-500';
                                            return (
                                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tierColors} flex items-center justify-center border-2 shadow-sm`}>
                                                    <PatchIcon size={14} className="text-white drop-shadow-md" strokeWidth={2.5} />
                                                </div>
                                            );
                                        })()}
                                    </h1>

                                    <p className="text-gray-400 text-sm mb-2 font-medium">
                                        Membro desde 2024
                                        {user.location && <span className="text-gray-500"> • {user.location}</span>}
                                    </p>

                                    {user.motorcycle && user.motorcycle.brand && (
                                        <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full w-fit mx-auto">
                                            <Bike size={14} className="text-primary" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                                {user.motorcycle.brand} {user.motorcycle.model} • {user.motorcycle.year}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center justify-center gap-6 mb-8 w-full border-y border-white/10 py-4 bg-white/[0.02]">
                                    <div className="text-center">
                                        <span className="block text-xl font-black text-white leading-none">{user.followers?.toLocaleString() || 0}</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">Seguidores</span>
                                    </div>
                                    <div className="w-[1px] h-8 bg-white/10" />
                                    <div className="text-center">
                                        <span className="block text-xl font-black text-primary leading-none">{stats?.totalKm?.toLocaleString() || 0}</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">KM Rodados</span>
                                    </div>
                                    <div className="w-[1px] h-8 bg-white/10" />
                                    <div className="text-center">
                                        <span className="block text-xl font-black text-white leading-none">{(user.routesCompleted || 0) + (user.eventsAttended || 0)}</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">Atividades</span>
                                    </div>
                                </div>

                                {/* XP Box */}
                                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 mb-8 shadow-lg w-full">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                                        <span className="text-gray-400 italic text-[10px]">Nível {user.level}</span>
                                        <span className="text-primary text-[10px]">{Math.floor((user.xp % 1000) / 1000 * 100)}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-orange-600"
                                            style={{ width: `${(user.xp % 1000) / 1000 * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-2 text-right">Total XP: {user.xp.toLocaleString()}</p>
                                </div>

                                {/* Footer Logo */}
                                <div className="mt-auto pt-8 flex flex-col items-center opacity-50">
                                    <h3 className="text-white font-black text-xl tracking-tighter leading-none mb-1">
                                        JORNADA <span className="text-primary">BIKER</span>
                                    </h3>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em]">Comunidade Oficial</p>
                                </div>

                            </div>
                        </div>

                        {/* Actions */}
                        <div className="w-full flex flex-col gap-3 mt-6">
                            <button
                                onClick={handleShareImage}
                                disabled={isExporting}
                                className="w-full bg-primary hover:bg-orange-600 text-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest active:scale-95 shadow-xl shadow-primary/20"
                            >
                                {isExporting ? (
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <ImageIcon size={20} fill="currentColor" />
                                        Publicar Card no Instagram
                                    </>
                                )}
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={async () => {
                                        const blob = await generateImage();
                                        if (blob) downloadBlob(blob);
                                    }}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                >
                                    <Download size={16} />
                                    Baixar Imagem
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                >
                                    <Copy size={16} />
                                    Copiar Link
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-6 text-gray-500 hover:text-white transition-colors p-2"
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
