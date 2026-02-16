import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { X, Map, MapPin, Navigation, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPicker } from './MapComponents';

export default function RouteRegistrationModal({ isOpen, onClose, onRegister, routes }) {
    const { user } = useUser();

    // Initial State - Now using a list of Stops
    const [formData, setFormData] = useState({
        name: '',
        distance: '',
        difficulty: 'Lazer',
        description: '',
        image: '',
        stops: [
            { state: 'SP', city: '', type: 'origin' },     // Default Start
            { state: 'SP', city: '', type: 'destination' } // Default End
        ]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cache available cities for each stop index to avoid re-fetching constantly
    // Structure: { [index]: ["City1", "City2", ...] }
    const [cityOptions, setCityOptions] = useState({});

    const [isLoadingCity, setIsLoadingCity] = useState({}); // { [index]: boolean }

    const BRAZIL_STATES = [
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
        "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    const DIFFICULTIES = ['Lazer', 'Médio', 'Expert'];

    // Fetch Cities Helper
    const fetchCities = async (uf) => {
        try {
            const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
            const data = await res.json();
            return data.map(city => city.nome).sort();
        } catch (err) {
            console.error("Failed to fetch cities for " + uf, err);
            return [];
        }
    };

    // Load cities when a stop's state changes
    useEffect(() => {
        formData.stops.forEach((stop, index) => {
            if (stop.state && !cityOptions[`${index}-${stop.state}`]) {
                // If we haven't loaded cities for this state yet (using a simple cache key)
                setIsLoadingCity(prev => ({ ...prev, [index]: true }));
                fetchCities(stop.state).then(cities => {
                    setCityOptions(prev => ({ ...prev, [index]: cities, [`${index}-${stop.state}`]: true }));
                    setIsLoadingCity(prev => ({ ...prev, [index]: false }));
                });
            }
        });
    }, [formData.stops]);

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                distance: '',
                difficulty: 'Lazer',
                description: '',
                image: '',
                stops: [
                    { state: 'SP', city: '', type: 'origin' },
                    { state: 'SP', city: '', type: 'destination' }
                ]
            });
        }
    }, [isOpen]);

    const handleStopChange = (index, field, value) => {
        const newStops = [...formData.stops];
        newStops[index] = { ...newStops[index], [field]: value };

        // If state changed, clear city
        if (field === 'state') {
            newStops[index].city = '';
        }

        setFormData(prev => ({ ...prev, stops: newStops }));
    };

    const addStop = () => {
        const newStops = [...formData.stops];
        // Insert before the last item (Destination)
        const insertIndex = newStops.length - 1;
        newStops.splice(insertIndex, 0, { state: 'SP', city: '', type: 'stop' });
        setFormData(prev => ({ ...prev, stops: newStops }));
    };

    const removeStop = (index) => {
        // Prevent removing if only 2 stops left
        if (formData.stops.length <= 2) return;

        const newStops = formData.stops.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, stops: newStops }));
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            if (file) {
                if (file.size > 512 * 1024) {
                    alert("A imagem é muito grande! Por favor, escolha uma imagem menor que 500KB.");
                    e.target.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, [name]: reader.result }));
                };
                reader.readAsDataURL(file);
            }
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.distance || formData.stops.some(s => !s.city)) {
            alert("Por favor, preencha todos os campos obrigatórios e selecione as cidades para todas as paradas.");
            return;
        }

        // Duplicate Check
        const start = formData.stops[0];
        const end = formData.stops[formData.stops.length - 1];
        const originStr = `${start.city} - ${start.state}`;
        const destStr = `${end.city} - ${end.state}`;

        const isDuplicate = routes?.some(r =>
            r.origin === originStr && r.destination === destStr
        );

        if (isDuplicate) {
            alert("Esta rota já possui cadastro! Por favor, pesquise por ela na aba de rotas para visualizar detalhes ou iniciar o trajeto.");
            return;
        }

        setIsSubmitting(true);

        try {
            setTimeout(() => {
                setIsSubmitting(false);
                const start = formData.stops[0];
                const end = formData.stops[formData.stops.length - 1];

                const newRoute = {
                    ...formData,
                    city: `${end.city} (${end.state})`, // Legacy support
                    state: end.state,
                    origin: `${start.city} - ${start.state}`,
                    destination: `${end.city} - ${end.state}`,
                    waypoints: formData.stops.map(s => `${s.city}, ${s.state}`),

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
        } catch (error) {
            console.error("Error submitting route:", error);
            setIsSubmitting(false);
            alert("Ocorreu um erro ao enviar a rota. Tente novamente.");
        }
    };

    // Construct array of queries for the map
    const mapQueries = formData.stops
        .filter(s => s.city && s.state)
        .map(s => `${s.city}, ${s.state}, Brasil`);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-background-secondary w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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

                    <form id="route-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
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
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Distância (Calculada)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="distance"
                                        value={formData.distance}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                        readOnly // Preferably read-only if map calculates it
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">KM</span>
                                </div>
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
                        </div>

                        {/* Stops Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="block text-xs font-bold text-gray-400 uppercase">Trajeto (Cidades)</label>
                            </div>

                            {formData.stops.map((stop, index) => {
                                const isFirst = index === 0;
                                const isLast = index === formData.stops.length - 1;

                                return (
                                    <div key={index} className="flex gap-2 items-center">
                                        <div className="flex flex-col items-center w-6 self-stretch pt-2">
                                            {/* Visual Connector Line */}
                                            <div className={`w-3 h-3 rounded-full border-2 z-10 
                                                ${isFirst ? 'bg-primary border-primary' : isLast ? 'bg-red-500 border-red-500' : 'bg-zinc-800 border-gray-500'}
                                            `}></div>
                                            {!isLast && <div className="w-0.5 flex-1 bg-white/10 -mb-2"></div>}
                                        </div>

                                        <div className="flex-1 bg-white/5 rounded-lg border border-white/5 p-2 grid grid-cols-[70px_1fr] gap-2">
                                            <select
                                                value={stop.state}
                                                onChange={(e) => handleStopChange(index, 'state', e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded p-2 text-sm text-white focus:border-primary focus:outline-none"
                                            >
                                                {BRAZIL_STATES.map(uf => (
                                                    <option key={uf} value={uf} className="bg-gray-900">{uf}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={stop.city}
                                                onChange={(e) => handleStopChange(index, 'city', e.target.value)}
                                                disabled={isLoadingCity[index]}
                                                className="bg-black/20 border border-white/10 rounded p-2 text-sm text-white focus:border-primary focus:outline-none disabled:opacity-50"
                                            >
                                                <option value="" className="bg-gray-900">{isFirst ? 'Onde começa?' : isLast ? 'Onde termina?' : 'Parada...'}</option>
                                                {(cityOptions[index] || []).map(city => (
                                                    <option key={city} value={city} className="bg-gray-900">{city}</option>
                                                ))}
                                            </select>
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
                                        {(isFirst || isLast) && <div className="w-8"></div>} {/* Spacer */}
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
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Visualização da Rota</label>
                            <MapPicker
                                stops={mapQueries}
                                onRouteDetailsCalculated={(details) => {
                                    if (details && details.distance) {
                                        setFormData(prev => ({
                                            ...prev,
                                            distance: (details.distance / 1000).toFixed(1)
                                        }));
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
                                placeholder="Dicas, pontos de parada, condições da pista..."
                                rows={3}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Foto da Paisagem</label>
                            <input
                                type="file"
                                name="image"
                                onChange={handleChange}
                                accept="image/jpeg, image/png, image/webp"
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
