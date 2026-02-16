import { useState } from 'react';
import { productsData } from '../data/mockData';
import { Search, ShoppingBag, ExternalLink, Wrench, Tag, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';

export default function Garagem() {
    const { registerSale, products, affiliates } = useData();
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSaleToast, setShowSaleToast] = useState(false);

    const categories = ['Todos', 'Equipamentos', 'Peças', 'Acessórios', 'Manutenção'];

    // Merge Mock Products with Automation Affiliates
    const allItems = [...productsData, ...(affiliates || [])];

    const filteredProducts = allItems.filter(product => {
        const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleBuyClick = (e, product) => {
        // Simulate affiliate tracking
        registerSale(product);
        setShowSaleToast(true);
        setTimeout(() => setShowSaleToast(false), 3000);
    };

    return (
        <div className="p-6 pb-24">

            {/* Search Bar */}
            <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="O que você procura?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background-secondary border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600"
                />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedCategory === category
                            ? 'bg-primary border-primary text-black shadow-[0_0_10px_-2px_var(--color-primary)]'
                            : 'bg-background-secondary border-white/10 text-gray-400 hover:border-white/30'
                            }`}
                    >
                        {category}
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
                            className="bg-background-secondary rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-colors group flex flex-col h-full"
                        >
                            <div className="aspect-square relative overflow-hidden bg-gray-800">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 border border-white/10">
                                    <Tag size={10} /> {product.category}
                                </div>
                                {product.discount && (
                                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg transform rotate-3">
                                        {product.discount}
                                    </div>
                                )}
                                {product.type === 'ad' && !product.discount && (
                                    <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-black px-2 py-1 rounded shadow-lg">
                                        PARCEIRO
                                    </div>
                                )}
                            </div>

                            <div className="p-3 flex flex-col flex-1">
                                <h3 className="font-bold text-sm text-white mb-1 line-clamp-2 flex-grow">{product.name}</h3>
                                <div className="mt-2">
                                    <span className="block text-xs text-gray-500 mb-1">A partir de</span>
                                    <div className="flex justify-between items-end flex-wrap">
                                        <span className="text-lg font-black text-primary">{product.price}</span>
                                        {product.oldPrice && (
                                            <span className="text-xs text-gray-500 line-through mb-1 ml-2">{product.oldPrice}</span>
                                        )}
                                    </div>
                                    <a
                                        href={product.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => handleBuyClick(e, product)}
                                        className="mt-3 w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/5"
                                    >
                                        Comprar <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-500 text-sm">Nenhum produto encontrado nesta categoria.</p>
                    <button onClick={() => { setSearchTerm(''); setSelectedCategory('Todos') }} className="mt-2 text-primary text-xs font-bold hover:underline">Limpar filtros</button>
                </div>
            )}

            <AnimatePresence>
                {showSaleToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-black px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 w-max font-bold border border-green-400"
                    >
                        <CheckCircle size={20} />
                        <span>Venda Simulada! Comissão registrada. 💰</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
