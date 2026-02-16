import { X, Copy, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentModal({ isOpen, onClose, eventName, price = "1,00", onSuccess }) {
    const [step, setStep] = useState('pix'); // pix, processing, success

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) setStep('pix');
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText("00020126360014BR.GOV.BCB.PIX0114+55119999999952040000530398654041.005802BR5913MOTO HUB BR6009SAO PAULO62070503***6304");
        // Simulate payment processing after copy
        setTimeout(() => setStep('processing'), 1000);
        setTimeout(() => {
            setStep('success');
            console.log("Calling onSuccess from PaymentModal");
            if (onSuccess) onSuccess();
        }, 3000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-background-secondary border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>

                            <div className="p-6 text-center">
                                {step === 'pix' && (
                                    <>
                                        <h3 className="text-xl font-bold mb-2">Destaque seu Evento</h3>
                                        <p className="text-sm text-gray-400 mb-6">Impulsione <span className="text-white font-semibold">"{eventName}"</span> por 24h.</p>

                                        <div className="bg-white p-4 rounded-xl inline-block mb-6 relative">
                                            {/* Placeholder QR Code */}
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example-pix-code`} alt="QR Code Pix" className="w-40 h-40 mix-blend-multiply" />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="bg-primary/10 rounded-full p-2">
                                                    {/* Logo overlay if needed */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-2xl font-black text-primary mb-6">R$ {price} <span className="text-xs text-gray-500 font-normal">/ dia</span></div>

                                        <button
                                            onClick={handleCopy}
                                            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Copy size={18} />
                                            Copiar código Pix
                                        </button>
                                    </>
                                )}

                                {step === 'processing' && (
                                    <div className="py-10">
                                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <h3 className="text-lg font-bold">Validando Pagamento...</h3>
                                        <p className="text-sm text-gray-500">Aguarde a confirmação do banco.</p>
                                    </div>
                                )}

                                {step === 'success' && (
                                    <div className="py-6">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black"
                                        >
                                            <CheckCircle size={40} />
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-white mb-2">Sucesso!</h3>
                                        <p className="text-sm text-gray-400 mb-6">Seu evento agora está em destaque para milhares de motociclistas.</p>
                                        <button
                                            onClick={onClose}
                                            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl"
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer Security Badge */}
                            <div className="bg-black/20 py-3 text-center border-t border-white/5">
                                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Ambiente Seguro e Criptografado
                                </p>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
