import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Image as ImageIcon, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentModal from './PaymentModal';
import { useNotification } from '../contexts/NotificationContext';


export default function EventRegistrationModal({ isOpen, onClose, onRegister, user }) {
    const { notify } = useNotification();
    const [formData, setFormData] = useState({
        title: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        city: '',
        state: 'SP',
        description: '',
        image: '',
        isPremium: false,
        premiumDays: 7
    });

    const [step, setStep] = useState(1); // 1: Details, 2: Premium/Review
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);

    const PREMIUM_COST_PER_DAY = 1.00;
    const totalCost = formData.premiumDays * PREMIUM_COST_PER_DAY;

    const BRAZIL_STATES = [
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
        "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];

    const [cities, setCities] = useState([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);

    useEffect(() => {
        if (formData.state) {
            setIsLoadingCities(true);
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
                .then(res => res.json())
                .then(data => {
                    const cityNames = data.map(city => city.nome).sort();
                    setCities(cityNames);
                    setFormData(prev => ({ ...prev, city: '' })); // Reset city when state changes
                })
                .catch(err => console.error("Failed to fetch cities", err))
                .finally(() => setIsLoadingCities(false));
        }
    }, [formData.state]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({
                title: '',
                startDate: '',
                endDate: '',
                startTime: '',
                endTime: '',
                city: '',
                state: 'SP',
                description: '',
                image: '',
                isPremium: false,
                premiumDays: 7
            });
            setPaymentCompleted(false);
            setIsPaymentOpen(false);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // 2MB limit
                    notify("A imagem deve ter no máximo 2MB.", "warning");
                    return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                    // Basic safeguard: if string is massive, maybe truncate or warn?
                    // For now, trusting the 2MB check.
                    setFormData(prev => ({ ...prev, [name]: reader.result }));
                };
                reader.readAsDataURL(file);
            }
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const finalizeRegistration = () => {
        const dateObj = new Date(formData.startDate + 'T00:00:00');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
        const formattedDate = `${day} ${month}`;

        // Format time string for display
        const displayTime = formData.startTime && formData.endTime
            ? `${formData.startTime} - ${formData.endTime}`
            : formData.startTime || 'Horário a definir';

        onRegister({
            ...formData,
            date: formattedDate, // Display date (e.g., "12 MAR")
            time: displayTime,
            startDate: formData.startDate,
            endDate: formData.endDate || formData.startDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: `${formData.city} - ${formData.state}`,
            id: Date.now(),
            premium: formData.isPremium,
            premiumDays: formData.isPremium ? formData.premiumDays : 0,
            highlightExpiresAt: formData.isPremium ? Date.now() + (formData.premiumDays * 24 * 60 * 60 * 1000) : null,
            totalCost: formData.isPremium ? totalCost : 0,
            createdBy: {
                name: user?.name || 'Motociclista Anônimo',
                avatar: user?.avatar,
                level: user?.level,
                patches: user?.badges || []
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.isPremium) {
            setIsPaymentOpen(true);
            return;
        }

        setIsSubmitting(true);
        // Simulate API call for free events
        setTimeout(() => {
            setIsSubmitting(false);
            finalizeRegistration();
            onClose();
            notify("Evento Publicado! Já disponível na agenda.", "success");
        }, 1500);
    };

    const handlePaymentSuccess = () => {
        console.log("Payment success triggered");
        setPaymentCompleted(true);
        finalizeRegistration();
    };

    const handlePaymentClose = () => {
        setIsPaymentOpen(false);
        if (paymentCompleted) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-background-secondary w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <header className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <Calendar className="text-primary" size={20} />
                            Sugerir Evento
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </header>

                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                        {step === 1 ? (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Evento</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Ex: Moto Laguna 2026"
                                        autoFocus
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data Início</label>
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={formData.startDate}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors accent-primary"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data Fim</label>
                                                <input
                                                    type="date"
                                                    name="endDate"
                                                    value={formData.endDate}
                                                    min={formData.startDate} // Prevent end date before start date
                                                    onChange={handleChange}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors accent-primary"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hora Início</label>
                                                <input
                                                    type="time"
                                                    name="startTime"
                                                    value={formData.startTime}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors accent-primary"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hora Fim</label>
                                                <input
                                                    type="time"
                                                    name="endTime"
                                                    value={formData.endTime}
                                                    min={formData.startTime}
                                                    onChange={handleChange}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors accent-primary"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Local</label>
                                        <div className="grid grid-cols-[80px_1fr] gap-2">
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                className="bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors appearance-none text-center cursor-pointer"
                                                required
                                            >
                                                {BRAZIL_STATES.map(uf => (
                                                    <option key={uf} value={uf} className="bg-gray-900">{uf}</option>
                                                ))}
                                            </select>
                                            <div className="relative">
                                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                                <select
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    disabled={isLoadingCities}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-9 text-white focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50"
                                                    required
                                                >
                                                    <option value="" className="bg-gray-900">Selecione a Cidade</option>
                                                    {cities.map(city => (
                                                        <option key={city} value={city} className="bg-gray-900">{city}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Conte um pouco sobre o evento..."
                                        rows={3}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Imagem de Capa</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            name="image"
                                            onChange={handleChange}
                                            accept="image/*"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90 transition-colors focus:outline-none"
                                        />
                                    </div>
                                    {formData.image && (
                                        <div className="mt-3 rounded-lg overflow-hidden border border-white/10 h-32 relative">
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, image: '' }))}
                                                className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white hover:bg-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="space-y-6"
                            >
                                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${!formData.isPremium ? 'border-gray-600 bg-white/5' : 'border-gray-700 opacity-50'}`} onClick={() => setFormData(p => ({ ...p, isPremium: false }))}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">
                                                {!formData.isPremium && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">Anúncio Grátis</h3>
                                                <p className="text-xs text-gray-400">Listagem padrão na agenda</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-white">R$ 0,00</span>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${formData.isPremium ? 'border-primary bg-primary/10' : 'border-gray-700'}`} onClick={() => setFormData(p => ({ ...p, isPremium: true }))}>
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-start gap-3">
                                            <div className="w-5 h-5 mt-1 rounded-full border border-primary flex items-center justify-center">
                                                {formData.isPremium && <div className="w-3 h-3 bg-primary rounded-full" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white flex items-center gap-2">
                                                    Destaque Premium <Star size={14} fill="currentColor" className="text-premium" />
                                                </h3>
                                                <p className="text-xs text-gray-300 mt-1">
                                                    Seu evento no topo da lista e na Home.
                                                    <br />
                                                    <span className="text-primary font-bold">R$ 1,00 por dia</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-xl text-premium">R$ {totalCost.toFixed(2).replace('.', ',')}</span>
                                            <p className="text-[10px] text-gray-400">Total estimado</p>
                                        </div>
                                    </div>

                                    {formData.isPremium && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="mt-4 pt-4 border-t border-white/10"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <label className="block text-xs font-bold text-gray-300 uppercase mb-2">Duração do Destaque (Dias)</label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="30"
                                                    value={formData.premiumDays}
                                                    onChange={(e) => setFormData(p => ({ ...p, premiumDays: parseInt(e.target.value) }))}
                                                    className="flex-1 accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className="font-black text-xl w-12 text-center text-white">{formData.premiumDays}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                                <AlertCircle size={10} />
                                                Após {formData.premiumDays} dias, o evento perde o destaque mas continua listado.
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </form>

                    <footer className="p-4 border-t border-white/10 flex justify-between bg-zinc-900">
                        {step === 2 ? (
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Voltar
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {step === 1 ? (
                            <button
                                onClick={() => setStep(2)}
                                disabled={!formData.title || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime || !formData.city}
                                className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continuar
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`
                                    px-6 py-2 rounded-lg font-bold text-black flex items-center gap-2 transition-all
                                    ${formData.isPremium ? 'bg-premium hover:brightness-110 shadow-[0_0_15px_-5px_rgba(234,179,8,0.5)]' : 'bg-white hover:bg-gray-200'}
                                    ${isSubmitting ? 'opacity-70 cursor-wait' : ''}
                                `}
                            >
                                {isSubmitting ? 'Enviando...' : (
                                    <>
                                        {formData.isPremium ? 'Pagar e Publicar' : 'Publicar Grátis'}
                                        <CheckCircle size={16} />
                                    </>
                                )}
                            </button>
                        )}
                    </footer>
                </motion.div>
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={handlePaymentClose}
                eventName={formData.title}
                price={totalCost.toFixed(2).replace('.', ',')}
                onSuccess={handlePaymentSuccess}
            />
        </>
    );
}
