import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useNotification } from '../contexts/NotificationContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
    const [email, setEmail] = useState('agm_jr@outlook.com');
    const [password, setPassword] = useState('Mot@88453251');
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithGoogle, resetPassword, user } = useUser();
    const { notify } = useNotification();
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

        const success = await login(email, password);

        setIsLoading(false);

        if (success) {
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
                    <div className="inline-flex justify-center items-center mb-4">
                        <Logo size={80} />
                    </div>
                    <h1 className="text-3xl font-black text-white px-200">JORNADA <span className="text-primary">BIKER</span></h1>
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
                        <button
                            type="button"
                            onClick={() => {
                                if (!email) {
                                    notify("Digite seu e-mail primeiro para recuperar a senha.", "info");
                                } else {
                                    resetPassword(email);
                                }
                            }}
                            className="text-xs text-primary hover:text-orange-400 transition-colors"
                        >
                            Esqueceu a senha?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        {isLoading ? 'Entrando...' : (
                            <>
                                Entrar <ArrowRight size={18} />
                            </>
                        )}
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
                        Acessar com Google
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
