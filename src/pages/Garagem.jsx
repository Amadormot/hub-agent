import { useState } from 'react';
import { Search, ShoppingBag, ExternalLink, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import ProductDetailsModal from '../components/ProductDetailsModal';

export default function Garagem() {
    const { registerSale, products } = useData();
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSaleToast, setShowSaleToast] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const categories = ['Todos', 'Equipamentos', 'Peças', 'Acessórios', 'Manutenção', 'Moda & Estilo'];

    // Prioritize DB Products
    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleBuyClick = (e, product) => {
        registerSale(product);
        setShowSaleToast(true);
        setTimeout(() => setShowSaleToast(false), 3000);
    };

    return (
        <div className="p-6 pb-24 min-h-screen">
            {/* Legend/Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    MINHA <span className="text-primary text-3xl italic">GARAGEM</span>
                </h2>
                <p className="text-gray-500 text-xs">As melhores ofertas com links de afiliado do Moto Hub.</p>
            </div>

            {/* Featured Banner (Simulated) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded-3xl bg-gradient-to-br from-primary/20 to-blue-500/10 border border-white/5 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-2">
                    <CheckCircle className="text-primary opacity-20" size={80} />
                </div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black bg-primary text-black px-2 py-0.5 rounded-full mb-2 inline-block">MOTO HUB DEALS</span>
                    <h3 className="text-lg font-black text-white leading-tight">OFERTAS DE <br />AFILIADOS <span className="text-primary italic text-xl">24H</span></h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Produtos selecionados manualmente com descontos reais.</p>
                </div>
            </motion.div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="O que você precisa hoje?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600 backdrop-blur-sm"
                />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide mb-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all border ${selectedCategory === category
                            ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-105'
                            : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                            }`}
                    >
                        {category.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-4">
                <AnimatePresence mode='popLayout'>
                    {filteredProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white/[0.03] backdrop-blur-xl rounded-[24px] overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-300 group flex flex-col h-full shadow-2xl"
                        >
                            <div className="aspect-[4/5] relative overflow-hidden bg-white/5">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />

                                {/* Discount Badge */}
                                {product.discount && (
                                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl z-20">
                                        {product.discount}
                                    </div>
                                )}

                                {/* Category Chip */}
                                <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] text-white font-bold border border-white/10 flex items-center gap-1 z-20 uppercase tracking-tighter">
                                    {product.category}
                                </div>

                                {/* Glass Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                            </div>

                            <div className="p-4 flex flex-col flex-1 relative">
                                <h3 className="font-bold text-xs text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>

                                <div className="mt-auto pt-2">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">R$</span>
                                        <span className="text-lg font-black text-white">{product.price.replace('R$', '').trim()}</span>
                                    </div>

                                    <button
                                        onClick={() => setSelectedProduct(product)}
                                        className="mt-3 w-full bg-primary/10 hover:bg-primary text-primary hover:text-black text-[10px] font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-primary/20"
                                    >
                                        VER DETALHES <ExternalLink size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 mt-4">
                    <ShoppingBag size={48} className="mx-auto text-gray-800 mb-4 opacity-50" />
                    <p className="text-gray-500 text-sm font-bold">Nenhum produto em sintonia.</p>
                    <button onClick={() => { setSearchTerm(''); setSelectedCategory('Todos') }} className="mt-4 text-primary text-xs font-black bg-primary/10 px-6 py-2 rounded-full border border-primary/20">LIMPAR BUSCA</button>
                </div>
            )}

            <ProductDetailsModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onBuy={handleBuyClick}
            />

            <AnimatePresence>
                {showSaleToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className="fixed bottom-28 left-1/2 bg-white text-black px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 w-[90%] max-w-sm border border-white"
                    >
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <p className="font-black text-xs uppercase tracking-tighter">Link Ativado!</p>
                            <p className="text-[10px] text-gray-600 font-bold">Gerando comissão de afiliado... 💰</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

