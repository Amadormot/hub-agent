import { useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { compressImage } from '../utils/imageCompression';
import { X, Camera, Upload, Shield, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CitySearchInput from './CitySearchInput';

export default function ProfileEditModal({ isOpen, onClose }) {
    const { user, updateProfile } = useUser();
    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [clubBadge, setClubBadge] = useState(user?.clubBadge || '');
    const [bikeBrand, setBikeBrand] = useState(user?.motorcycle?.brand || '');
    const [bikeModel, setBikeModel] = useState(user?.motorcycle?.model || '');
    const [bikeYear, setBikeYear] = useState(user?.motorcycle?.year || '');
    const [city, setCity] = useState(user?.details?.city || '');
    const [state, setState] = useState(user?.details?.state || '');
    const [avatarFraming, setAvatarFraming] = useState(user?.avatarFraming || { zoom: 1, x: 0, y: 0 });
    const [badgeFraming, setBadgeFraming] = useState(user?.badgeFraming || { zoom: 1, x: 0, y: 0 });
    const [pixKey, setPixKey] = useState(user?.pixKey || '');
    const [pixQR, setPixQR] = useState(user?.pixQR || '');

    const avatarInputRef = useRef(null);
    const badgeInputRef = useRef(null);
    const pixQRInputRef = useRef(null);

    const handleFileChange = async (e, setFunction) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Compress image before setting state
                // Using 500px width and 0.7 quality for profile images/badges
                const compressedDataUrl = await compressImage(file, 1024, 0.8);
                setFunction(compressedDataUrl);
            } catch (error) {
                console.error("Error compressing image:", error);
                // Fallback to original if compression fails (though unlikely)
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFunction(reader.result);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile({
            name,
            avatar,
            clubBadge,
            motorcycle: {
                brand: bikeBrand,
                model: bikeModel,
                year: bikeYear
            },
            location: city ? `${city}, ${state}` : '',
            details: { city, state },
            avatarFraming,
            badgeFraming,
            pixKey,
            pixQR
        });
        onClose();
    };

    const TouchFramingArea = ({ image, framing, setFraming, isCircular = true }) => {
        const containerRef = useRef(null);

        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newZoom = Math.min(Math.max(framing.zoom + delta, 1), 5);
            setFraming(prev => ({ ...prev, zoom: newZoom }));
        };

        return (
            <div
                ref={containerRef}
                className={`relative bg-zinc-900 overflow-hidden cursor-move border-2 border-primary/30 ${isCircular ? 'rounded-full w-24 h-24' : 'rounded-xl w-24 h-24'}`}
                onWheel={handleWheel}
                style={{ touchAction: 'none' }}
            >
                <motion.img
                    src={image}
                    drag
                    dragConstraints={containerRef}
                    dragElastic={0.2}
                    onDrag={(e, info) => {
                        // We translate the movement to percentage for our framing state
                        // This is a simplification, but works for the UI preview
                        const strength = 0.5 / framing.zoom;
                        setFraming(prev => ({
                            ...prev,
                            x: prev.x + (info.delta.x * strength),
                            y: prev.y + (info.delta.y * strength)
                        }));
                    }}
                    style={{
                        scale: framing.zoom,
                        x: `${framing.x}%`,
                        y: `${framing.y}%`,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                    className="pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <Camera size={20} className="text-white drop-shadow-lg" />
                </div>

                {/* Pinch-to-zoom simulation hint or actual implementation would go here */}
                {/* For web/desktop, wheel handles zoom. For mobile, we'd need a multi-touch gesture library or manual touch handler */}
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    ></motion.div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-background-secondary w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                            <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

                            {/* Avatar Section */}
                            <div className="space-y-4">
                                <div className="flex flex-col items-center">
                                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                        <TouchFramingArea
                                            image={avatar}
                                            framing={avatarFraming}
                                            setFraming={setAvatarFraming}
                                            isCircular={true}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-2">Foto de Perfil</span>
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        onChange={(e) => handleFileChange(e, setAvatar)}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 text-center italic">Arraste para mover • Role para Zoom</p>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome de Piloto</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                />
                            </div>

                            {/* Location Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Localização</label>
                                <CitySearchInput
                                    onSelect={(selectedCity) => {
                                        setCity(selectedCity.nome);
                                        setState(selectedCity.uf);
                                    }}
                                    defaultValue={city && state ? `${city}, ${state}` : city}
                                    placeholder="Sua cidade (Ex: São Paulo, SP)"
                                />
                            </div>

                            {/* Motorcycle Section */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Bike size={14} className="text-primary" /> Minha Motocicleta
                                </label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Marca</label>
                                        <input
                                            type="text"
                                            value={bikeBrand}
                                            onChange={(e) => setBikeBrand(e.target.value)}
                                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                            placeholder="Ex: BMW"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Modelo</label>
                                        <input
                                            type="text"
                                            value={bikeModel}
                                            onChange={(e) => setBikeModel(e.target.value)}
                                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                            placeholder="Ex: R 1250 GS"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ano</label>
                                    <input
                                        type="text"
                                        value={bikeYear}
                                        onChange={(e) => setBikeYear(e.target.value)}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                        placeholder="Ex: 2024"
                                    />
                                </div>
                            </div>

                            {/* Club Badge Section */}
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    Brasão do Moto Clube <Shield size={14} className="text-primary" />
                                </label>

                                <div className="flex flex-col items-center gap-4">
                                    {clubBadge ? (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            <div className="relative group cursor-pointer" onClick={() => badgeInputRef.current?.click()}>
                                                <TouchFramingArea
                                                    image={clubBadge}
                                                    framing={badgeFraming}
                                                    setFraming={setBadgeFraming}
                                                    isCircular={true}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500 italic">Arraste para mover • Role para Zoom</p>
                                            <button
                                                type="button"
                                                onClick={() => setClubBadge('')}
                                                className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest"
                                            >
                                                Remover Brasão
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className="w-full h-24 bg-background border border-white/10 border-dashed hover:border-primary/50 transition-colors cursor-pointer rounded-xl flex flex-col items-center justify-center gap-2"
                                            onClick={() => badgeInputRef.current?.click()}
                                        >
                                            <Shield size={24} className="text-gray-600" />
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-white uppercase tracking-wider">Upload do Brasão</p>
                                                <p className="text-[10px] text-gray-500">Clique para selecionar imagem</p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={badgeInputRef}
                                        onChange={(e) => handleFileChange(e, setClubBadge)}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                            </div>


                            <div className="pt-4 px-2">
                                <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all">
                                    Salvar Alterações
                                </button>
                            </div>

                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
