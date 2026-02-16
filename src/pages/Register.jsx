import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import { Bike } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [bikeBrand, setBikeBrand] = useState('');
    const [bikeModel, setBikeModel] = useState('');
    const [bikeYear, setBikeYear] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register, user } = useUser();
    const navigate = useNavigate();

    // Redireciona se já estiver logado
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const motorcycle = {
            brand: bikeBrand,
            model: bikeModel,
            year: bikeYear
        };
        setIsLoading(true);
        const success = await register(name, email, password, motorcycle, city, state);
        setIsLoading(false);
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>

            <div className="max-w-md mx-auto w-full z-10">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-black text-white">Crie sua conta</h1>
                    <p className="text-gray-400 mt-2">Junte-se à maior comunidade de motociclistas.</p>
                </motion.div>

                <motion.form
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nome de Piloto</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Ex: Águia da Estrada"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cidade</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Ex: São Paulo"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">UF</label>
                            <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors uppercase text-center"
                                placeholder="SP"
                                maxLength={2}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Marca da Moto</label>
                            <input
                                type="text"
                                value={bikeBrand}
                                onChange={(e) => setBikeBrand(e.target.value)}
                                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Ex: Honda"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Modelo</label>
                            <input
                                type="text"
                                value={bikeModel}
                                onChange={(e) => setBikeModel(e.target.value)}
                                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="Ex: CB 500X"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Ano</label>
                        <input
                            type="text"
                            value={bikeYear}
                            onChange={(e) => setBikeYear(e.target.value)}
                            className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Ex: 2023"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Criando conta...' : 'Cadastrar'}
                    </button>
                </motion.form>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 text-center text-sm text-gray-500"
                >
                    Já tem uma conta? <Link to="/login" className="text-white font-bold hover:underline">Fazer Login</Link>
                </motion.div>
            </div>
        </div>
    );
}
