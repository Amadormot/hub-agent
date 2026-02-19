import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import { Bike } from 'lucide-react';
import Logo from '../components/Logo';
import CitySearchInput from '../components/CitySearchInput';

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
    const { register, loginWithGoogle, user } = useUser();
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
                    <div className="inline-flex justify-center items-center mb-4">
                        <Logo size={80} />
                    </div>
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

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Localização</label>
                        <CitySearchInput
                            onSelect={(selectedCity) => {
                                setCity(selectedCity.nome);
                                setState(selectedCity.uf);
                            }}
                            placeholder="Sua cidade (Ex: São Paulo, SP)"
                        />
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
                        className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        {isLoading ? 'Criando conta...' : 'Cadastrar'}
                    </button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-gray-500 font-bold tracking-widest">Ou</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={loginWithGoogle}
                        className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        Cadastrar com Google
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
