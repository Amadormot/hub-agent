import { useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { compressImage } from '../utils/imageCompression';
import { X, Camera, Upload, Shield, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

    const avatarInputRef = useRef(null);
    const badgeInputRef = useRef(null);

    const handleFileChange = async (e, setFunction) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Compress image before setting state
                // Using 500px width and 0.7 quality for profile images/badges
                const compressedDataUrl = await compressImage(file, 500, 0.7);
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
            badgeFraming
        });
        onClose();
    };

    const FramingControls = ({ framing, setFraming, label }) => (
        <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-white/5 mt-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/70">{label}</h4>
            <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-400 w-8 font-bold">ZOOM</span>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.01"
                        value={framing.zoom}
                        onChange={(e) => setFraming(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                        className="flex-1 accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-white font-black w-8 text-right">{framing.zoom.toFixed(2)}x</span>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold">X</span>
                        <input
                            type="range"
                            min="-100"
                            max="100"
                            value={framing.x}
                            onChange={(e) => setFraming(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                            className="flex-1 accent-primary/70 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold">Y</span>
                        <input
                            type="range"
                            min="-100"
                            max="100"
                            value={framing.y}
                            onChange={(e) => setFraming(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                            className="flex-1 accent-primary/70 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

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
                                    <div className="relative w-24 h-24 mb-2 group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary bg-zinc-900">
                                            <img
                                                src={avatar}
                                                alt="Avatar Preview"
                                                className="w-full h-full object-cover transition-transform"
                                                style={{
                                                    transform: `scale(${avatarFraming.zoom}) translate(${avatarFraming.x}%, ${avatarFraming.y}%)`
                                                }}
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Foto de Perfil</span>
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        onChange={(e) => handleFileChange(e, setAvatar)}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>

                                <FramingControls
                                    framing={avatarFraming}
                                    setFraming={setAvatarFraming}
                                    label="Ajuste de Enquadramento - Foto"
                                />
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
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cidade</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                        placeholder="Cidade"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">UF</label>
                                    <input
                                        type="text"
                                        value={state}
                                        onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm font-bold uppercase text-center"
                                        placeholder="UF"
                                        maxLength={2}
                                    />
                                </div>
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
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    Brasão do Moto Clube <Shield size={14} className="text-primary" />
                                </label>

                                <div className="flex items-center gap-4 bg-background p-4 rounded-xl border border-white/10 border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={() => badgeInputRef.current?.click()}>
                                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                                        {clubBadge ? (
                                            <img
                                                src={clubBadge}
                                                alt="Brasão"
                                                className="w-full h-full object-contain p-1"
                                                style={{
                                                    transform: `scale(${badgeFraming.zoom}) translate(${badgeFraming.x}%, ${badgeFraming.y}%)`
                                                }}
                                            />
                                        ) : (
                                            <Shield size={24} className="text-gray-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white mb-1">Upload do Brasão</p>
                                        <p className="text-xs text-gray-400">Clique para selecionar imagem</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={badgeInputRef}
                                        onChange={(e) => handleFileChange(e, setClubBadge)}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>

                                {clubBadge && (
                                    <FramingControls
                                        framing={badgeFraming}
                                        setFraming={setBadgeFraming}
                                        label="Ajuste de Enquadramento - Brasão"
                                    />
                                )}
                            </div>

                            <div className="pt-4">
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
