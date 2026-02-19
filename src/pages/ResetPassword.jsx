import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { notify } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        // Verifica se o usuário chegou aqui via link de recuperação
        const hash = window.location.hash;
        if (!hash || !hash.includes('type=recovery')) {
            // Se não for um link de recuperação válido, manda para o login
            // Mas permitimos se houver uma sessão ativa (o Supabase às vezes loga o usuário)
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session) {
                    navigate('/login');
                }
            });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return notify("As senhas não coincidem.", "error");
        }

        if (password.length < 6) {
            return notify("A senha deve ter pelo menos 6 caracteres.", "warning");
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            notify("Senha atualizada com sucesso!", "success");
            navigate('/login');
        } catch (error) {
            console.error("Reset password error:", error);
            notify(error.message || "Erro ao atualizar senha", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]"></div>

            <div className="max-w-md mx-auto w-full z-10">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex justify-center items-center mb-4">
                        <Logo size={80} />
                    </div>
                    <h1 className="text-3xl font-black text-white">NOVA <span className="text-primary">SENHA</span></h1>
                    <p className="text-gray-400 mt-2">Digite sua nova senha de acesso.</p>
                </motion.div>

                <motion.form
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nova Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="••••••••"
                                required
                            />
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Confirmar Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-background-secondary border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="••••••••"
                                required
                            />
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-4"
                    >
                        {isLoading ? 'Atualizando...' : (
                            <>
                                Definir Nova Senha <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </motion.form>
            </div>
        </div>
    );
}
