import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Shield, QrCode, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';

export default function PaymentModal({ isOpen, onClose, eventName, price = "1,00", onSuccess }) {
    const { allUsers } = useData();
    const { notify } = useNotification();
    const admin = allUsers.find(u => u.isAdmin);

    // Default Pix Data if Admin hasn't set it yet
    const pixKey = admin?.pixKey || "00020126360014BR.GOV.BCB.PIX0114+55119999999952040000530398654041.005802BR5913MOTO HUB BR6009SAO PAULO62070503***6304";
    const pixQR = admin?.pixQR || null;

    const [step, setStep] = useState('pix'); // pix, processing, success

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) setStep('pix');
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(pixKey);
        notify("Chave PIX copiada! Após o pagamento, o administrador confirmará seu destaque.", "success");

        // Simulate "Processing" state to show work is being recorded
        setTimeout(() => setStep('processing'), 1500);
        setTimeout(() => {
            setStep('success');
            if (onSuccess) onSuccess();
        }, 5000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-background-secondary w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative"
                >
                    <div className="p-8">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl uppercase tracking-tight">Checkout PIX</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pagamento Manual</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {step === 'pix' && (
                            <div className="space-y-6">
                                {/* Amount Card */}
                                <div className="bg-zinc-900/50 rounded-3xl p-6 text-center border border-white/5 shadow-inner">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total a pagar</p>
                                    <div className="text-4xl font-black text-white tracking-tighter">R$ {price}</div>
                                    <div className="mt-3 px-3 py-1 bg-primary/10 rounded-full inline-block">
                                        <p className="text-[10px] text-primary font-black uppercase tracking-tight">{eventName}</p>
                                    </div>
                                </div>

                                {/* QR Code Area */}
                                <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-xl relative group">
                                    {pixQR ? (
                                        <img src={pixQR} alt="PIX QR Code" className="w-48 h-48 object-contain" />
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-100">
                                            <QrCode size={64} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 rounded-[2rem]">
                                        <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center shadow-lg">
                                            <CheckCircle size={28} />
                                        </div>
                                        <span className="text-black font-black text-[10px] uppercase tracking-[0.2em] ml-[0.2em]">Escaneie o Código</span>
                                    </div>
                                </div>

                                {/* Copy Paste Area */}
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Ou use a chave Pix Copia e Cola</p>
                                        <div className="bg-black/60 rounded-2xl p-4 border border-white/5 flex items-center gap-4 group">
                                            <code className="flex-1 text-[11px] text-gray-400 truncate text-left font-medium">{pixKey}</code>
                                            <button
                                                onClick={handleCopy}
                                                className="bg-primary text-black p-2.5 rounded-xl hover:bg-orange-500 transition-all shadow-lg shadow-primary/20 active:scale-90"
                                            >
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 flex items-start gap-3">
                                        <AlertCircle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                                            <span className="text-yellow-500 font-black uppercase">Importante:</span> Pagamento manual. Após pagar, o administrador ativará seu destaque em até 24h.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleCopy}
                                        className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                                    >
                                        Já paguei, fechar Checkout
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'processing' && (
                            <div className="py-16 flex flex-col items-center justify-center text-center space-y-8">
                                <div className="relative">
                                    <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Clock size={40} className="text-primary animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-2xl uppercase tracking-tight">Processando...</h3>
                                    <p className="text-xs text-gray-500 mt-2 px-8 font-medium leading-relaxed">Estamos vinculando o comprovante ao seu evento.</p>
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="py-16 flex flex-col items-center justify-center text-center space-y-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-black shadow-[0_0_30px_-5px_rgba(34,197,94,0.5)]"
                                >
                                    <CheckCircle size={56} />
                                </motion.div>
                                <div>
                                    <h3 className="text-white font-black text-2xl uppercase tracking-tight">Solicitado!</h3>
                                    <p className="text-xs text-gray-400 mt-3 px-8 font-medium leading-relaxed">Evento sugerido com sucesso. O destaque será ativado assim que confirmarmos seu PIX.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[11px] shadow-xl active:scale-95"
                                >
                                    Entendido
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
