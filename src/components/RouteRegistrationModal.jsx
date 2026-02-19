import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { X, Map, MapPin, Navigation, Plus, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPicker } from './MapComponents';
import { compressImage } from '../utils/imageCompression';

export default function RouteRegistrationModal({ isOpen, onClose, onRegister, routes }) {
    const { user } = useUser();

    // Initial State - Now focused on coordinates and resolved names
    const [formData, setFormData] = useState({
        name: '',
        distance: '',
        duration: '',
        difficulty: 'Lazer',
        description: '',
        image: '',
        stops: [
            { name: '', city: '', state: '', lat: null, lng: null, type: 'origin' },
            { name: '', city: '', state: '', lat: null, lng: null, type: 'destination' }
        ]
    });

    const [activeStopIndex, setActiveStopIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const DIFFICULTIES = ['Lazer', 'Médio', 'Expert'];

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                distance: '',
                duration: '',
                difficulty: 'Lazer',
                description: '',
                image: '',
                stops: [
                    { name: '', city: '', state: '', lat: null, lng: null, type: 'origin' },
                    { name: '', city: '', state: '', lat: null, lng: null, type: 'destination' }
                ]
            });
            setActiveStopIndex(0);
        }
    }, [isOpen]);

    const handleLocationSelected = ({ lat, lng, name, city, state }) => {
        const newStops = [...formData.stops];
        const index = activeStopIndex;

        // Use city name if available, otherwise short name
        const stopLabel = city || name.split(',')[0];

        newStops[index] = {
            ...newStops[index],
            name: name,
            city: city || stopLabel,
            state: state || '',
            lat,
            lng
        };

        setFormData(prev => ({ ...prev, stops: newStops }));

        // Auto-advance logic
        if (index < formData.stops.length - 1) {
            setActiveStopIndex(index + 1);
        }
    };

    const addStop = () => {
        const newStops = [...formData.stops];
        const insertIndex = newStops.length - 1;
        newStops.splice(insertIndex, 0, { name: '', city: '', state: '', lat: null, lng: null, type: 'stop' });
        setFormData(prev => ({ ...prev, stops: newStops }));
        setActiveStopIndex(insertIndex); // Auto-focus new stop
    };

    const removeStop = (index) => {
        if (formData.stops.length <= 2) return;
        const newStops = formData.stops.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, stops: newStops }));
        if (activeStopIndex >= newStops.length) {
            setActiveStopIndex(newStops.length - 1);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        const compressed = await compressImage(file, 1920, 0.8);
                        setFormData(prev => ({ ...prev, [name]: compressed }));
                    } catch (err) {
                        console.error("Compression error:", err);
                        setFormData(prev => ({ ...prev, [name]: reader.result }));
                    }
                };
                reader.readAsDataURL(file);
            }
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.distance || formData.stops.some(s => !s.lat)) {
            alert("Por favor, preencha o nome da rota e selecione todos os pontos no mapa.");
            return;
        }

        const start = formData.stops[0];
        const end = formData.stops[formData.stops.length - 1];
        const originStr = start.city ? `${start.city} - ${start.state}` : start.name.split(',')[0];
        const destStr = end.city ? `${end.city} - ${end.state}` : end.name.split(',')[0];

        const isDuplicate = routes?.some(r =>
            r.origin === originStr && r.destination === destStr
        );

        if (isDuplicate) {
            alert("Esta rota já possui cadastro!");
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            const newRoute = {
                ...formData,
                city: end.city || end.name.split(',')[0],
                state: end.state,
                origin: originStr,
                destination: destStr,
                waypoints: formData.stops.map(s => s.name),
                id: Date.now(),
                xp: Math.round((parseInt(formData.distance) || 10) * (formData.difficulty === 'Expert' ? 2 : formData.difficulty === 'Médio' ? 1.5 : 1)),
                likes: 0,
                createdBy: {
                    name: user?.name || 'Motociclista Anônimo',
                    avatar: user?.avatar,
                    level: user?.level,
                    patches: user?.badges || []
                }
            };
            onRegister(newRoute);
            onClose();
        }, 1500);
    };

    // Prepare map queries (only for showing existing route if needed, though mostly coordinate based now)
    const mapQueries = formData.stops
        .filter(s => s.lat && s.lng)
        .map(s => s.name || `${s.lat}, ${s.lng}`);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-background-secondary w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] supports-[height:100dvh]:max-h-[85dvh]"
                >
                    <header className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <Map className="text-primary" size={20} />
                            Planejar Rota
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </header>

                    <form id="route-form" onSubmit={handleSubmit} className="p-6 pb-12 overflow-y-auto flex-1 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome da Rota *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ex: Rota do Sol"
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Distância (KM)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="distance"
                                        value={formData.distance}
                                        readOnly
                                        placeholder="0"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">KM</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tempo Estimado</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="duration"
                                        value={formData.duration}
                                        readOnly
                                        placeholder="Calculando..."
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    />
                                    <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>
                        </div>

                        {/* Stops Section */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-gray-400 uppercase">Trajeto</label>

                            {formData.stops.map((stop, index) => {
                                const isFirst = index === 0;
                                const isLast = index === formData.stops.length - 1;
                                const isActive = activeStopIndex === index;
                                const hasLocation = stop.lat !== null;

                                return (
                                    <div key={index} className="flex gap-2 items-center">
                                        <div className="flex flex-col items-center w-6 self-stretch pt-2">
                                            <div
                                                onClick={() => setActiveStopIndex(index)}
                                                className={`w-3 h-3 rounded-full border-2 z-10 cursor-pointer transition-all transform
                                                    ${isActive ? 'scale-125 ring-2 ring-primary/30' : ''}
                                                    ${isFirst ? 'bg-primary border-primary' : isLast ? 'bg-red-500 border-red-500' : 'bg-zinc-800 border-gray-500'}
                                                    ${!hasLocation && !isActive ? 'opacity-40' : 'opacity-100'}
                                                `}
                                            ></div>
                                            {!isLast && <div className="w-0.5 flex-1 bg-white/10 -mb-2"></div>}
                                        </div>

                                        <div
                                            onClick={() => setActiveStopIndex(index)}
                                            className={`flex-1 bg-white/5 rounded-lg border p-3 min-h-[50px] flex items-center transition-colors cursor-pointer group
                                                ${isActive ? 'border-primary/50 bg-primary/10' : 'border-white/5'}
                                                ${!hasLocation && !isActive ? 'opacity-50' : 'opacity-100'}
                                            `}
                                        >
                                            <div className="flex-1 overflow-hidden">
                                                {hasLocation ? (
                                                    <p className="text-sm font-bold text-white truncate">
                                                        {stop.city || stop.name.split(',')[0]}
                                                        <span className="block text-[10px] text-gray-400 font-normal truncate opacity-60 group-hover:opacity-100 transition-opacity">
                                                            {stop.name}
                                                        </span>
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">
                                                        {isActive ? (
                                                            <span className="text-primary flex items-center gap-1 animate-pulse">
                                                                <MapPin size={12} /> Toque no mapa abaixo...
                                                            </span>
                                                        ) : (
                                                            isFirst ? 'Ponto de Partida' : isLast ? 'Destino Final' : 'Clique para definir...'
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {!isFirst && !isLast && (
                                            <button
                                                type="button"
                                                onClick={() => removeStop(index)}
                                                className="text-gray-500 hover:text-red-500 p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        {(isFirst || isLast) && <div className="w-8"></div>}
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                onClick={addStop}
                                className="ml-8 text-xs font-bold text-primary flex items-center gap-1 hover:text-primary/80 transition-colors"
                            >
                                <Plus size={14} />
                                Adicionar Parada
                            </button>
                        </div>

                        {/* Map Preview */}
                        <div className="mb-3">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex justify-between">
                                <span>Mapa Interativo</span>
                                <span className="text-primary animate-pulse">
                                    Editando: {activeStopIndex === 0 ? 'Saída' : activeStopIndex === formData.stops.length - 1 ? 'Chegada' : `Parada ${activeStopIndex}`}
                                </span>
                            </label>
                            <MapPicker
                                initialLat={formData.stops[activeStopIndex]?.lat}
                                initialLng={formData.stops[activeStopIndex]?.lng}
                                stops={formData.stops}
                                onLocationSelected={handleLocationSelected}
                                onRouteDetailsCalculated={(details) => {
                                    if (details) {
                                        const dist = (details.distance / 1000).toFixed(1);
                                        let durationStr = "";
                                        if (details.duration) {
                                            const totalMinutes = Math.floor(details.duration / 60);
                                            const hours = Math.floor(totalMinutes / 60);
                                            const minutes = totalMinutes % 60;
                                            durationStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
                                        }
                                        setFormData(prev => ({ ...prev, distance: dist, duration: durationStr }));
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Dicas, pontos de parada..."
                                rows={3}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dificuldade</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                            >
                                {DIFFICULTIES.map(diff => (
                                    <option key={diff} value={diff} className="bg-gray-900">{diff}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Foto da Paisagem</label>
                            <input
                                type="file"
                                name="image"
                                onChange={handleChange}
                                accept="image/*"
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90 transition-colors"
                            />
                        </div>
                    </form>

                    <footer className="p-4 border-t border-white/10 flex justify-end bg-zinc-900">
                        <button
                            type="submit"
                            form="route-form"
                            disabled={isSubmitting}
                            className={`
                                px-6 py-2 rounded-lg font-bold text-black flex items-center gap-2 transition-all
                                ${isSubmitting ? 'bg-gray-500 cursor-wait' : 'bg-white hover:bg-gray-200'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {isSubmitting ? 'Enviando...' : (
                                <>
                                    Sugerir Rota
                                    <Navigation size={16} fill="currentColor" />
                                </>
                            )}
                        </button>
                    </footer>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
