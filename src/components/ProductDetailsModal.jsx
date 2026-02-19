import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, Truck, Clock, Tag } from 'lucide-react';

export default function ProductDetailsModal({ product, isOpen, onClose, onBuy }) {
    if (!product) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-lg bg-background-secondary rounded-t-[32px] sm:rounded-[32px] overflow-hidden border-t sm:border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {/* Image Header */}
                            <div className="aspect-square relative w-full bg-white/5">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background-secondary via-transparent to-transparent"></div>

                                {product.discount && (
                                    <div className="absolute top-6 left-6 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-2xl">
                                        OFERTA: {product.discount}
                                    </div>
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="p-8 pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-widest border border-primary/20">
                                        {product.category}
                                    </span>
                                    {product.source === 'Sales AI Agent' && (
                                        <span className="text-[10px] font-black bg-white/5 text-gray-400 px-2 py-1 rounded-md uppercase tracking-widest border border-white/5">
                                            IA VERIFIED
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-2xl font-black text-white leading-tight mb-4">{product.name}</h2>

                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-3xl font-black text-primary">{product.price}</span>
                                    {product.oldPrice && (
                                        <span className="text-sm text-gray-500 line-through font-bold">{product.oldPrice}</span>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-4 mb-8">
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {product.description || "Este produto foi selecionado por nossa inteligência artificial como uma das melhores opções de custo-benefício para motociclistas hoje."}
                                    </p>
                                </div>

                                {/* Specs / Ficha Técnica */}
                                {product.specs && product.specs.length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Ficha Técnica</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {product.specs.map((spec, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                                    <span className="text-xs text-white font-bold">{spec}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Features / Trust Badges */}
                                <div className="grid grid-cols-3 gap-2 mb-8">
                                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <ShieldCheck className="text-primary mb-1" size={18} />
                                        <span className="text-[8px] font-black text-gray-500 uppercase text-center">Garantia Original</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <Truck className="text-blue-400 mb-1" size={18} />
                                        <span className="text-[8px] font-black text-gray-500 uppercase text-center">Entrega Rápida</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <Clock className="text-green-400 mb-1" size={18} />
                                        <span className="text-[8px] font-black text-gray-500 uppercase text-center">Oferta por Tempo</span>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <a
                                    href={product.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        onBuy(e, product);
                                        onClose();
                                    }}
                                    className="w-full bg-primary hover:bg-orange-600 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-primary/20"
                                >
                                    IR PARA LOJA PARCEIRA <ExternalLink size={20} />
                                </a>
                                <p className="text-[9px] text-gray-600 text-center mt-4 font-bold">
                                    Ao comprar por este link, você apoia o Moto Hub Brasil sem pagar nada a mais por isso.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
