import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import { Bike, ArrowRight } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, user } = useUser();
    const navigate = useNavigate();

    // Redireciona se já estiver logado
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Login agora é seguro e gerencia o loading globalmente via onAuthStateChange
        // O retorno 'success' aqui é apenas para feedback imediato se necessário,
        // mas a navegação é garantida pelo useEffect acima
        const success = await login(email, password);

        setIsLoading(false);

        if (success) {
            // Navegação redundante caso o useEffect demore
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>

            <div className="max-w-md mx-auto w-full z-10">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex justify-center items-center w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl border border-white/10 mb-4 shadow-xl">
                        <Bike size={32} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-black text-white px-200">MOTO HUB <span className="text-primary">BRASIL</span></h1>
                    <p className="text-gray-400 mt-2">O sistema operacional do motociclista.</p>
                </motion.div>

                <motion.form
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
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

                    <div className="flex justify-end">
                        <a href="#" className="text-xs text-primary hover:text-orange-400">Esqueceu a senha?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Entrando...' : (
                            <>
                                Entrar <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </motion.form>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 text-center text-sm text-gray-500"
                >
                    Não tem uma conta? <Link to="/register" className="text-white font-bold hover:underline">Cadastre-se</Link>
                </motion.div>
            </div>
        </div>
    );
}
