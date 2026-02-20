import { useState, useMemo } from 'react';
import { Search, ShoppingBag, ExternalLink, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import ProductDetailsModal from '../components/ProductDetailsModal';
import PullToRefresh from '../components/PullToRefresh';

export default function Garagem() {
    const { registerSale, products, refreshData } = useData();
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedPlatform, setSelectedPlatform] = useState('Todos');
    const [sortBy, setSortBy] = useState('recent');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSaleToast, setShowSaleToast] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const categories = ['Todos', 'Equipamentos', 'Peças', 'Acessórios', 'Manutenção', 'Moda & Estilo'];
    const platforms = ['Todos', 'Amazon', 'Mercado Livre'];

    const getPriceValue = (price) => {
        if (price === null || price === undefined) return 0;
        if (typeof price === 'number') return price;

        const priceStr = String(price);

        // Robust cleaning for Brazilian currency format R$ 1.250,50
        const cleaned = priceStr
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(/,/g, '.')
            .trim();

        return parseFloat(cleaned) || 0;
    };

    const filteredProducts = useMemo(() => {
        let result = products.filter(product => {
            const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

            // Platform detection logic based on link
            const isAmazon = product.link?.includes('amazon.com.br');
            const isML = product.link?.includes('mercadolivre.com.br');

            const matchesPlatform = selectedPlatform === 'Todos' ||
                (selectedPlatform === 'Amazon' && isAmazon) ||
                (selectedPlatform === 'Mercado Livre' && isML);

            return matchesCategory && matchesSearch && matchesPlatform;
        });

        // Sorting
        return [...result].sort((a, b) => { // Use spread to avoid mutating original filter result
            if (sortBy === 'price_asc') return getPriceValue(a.price) - getPriceValue(b.price);
            if (sortBy === 'price_desc') return getPriceValue(b.price) - getPriceValue(a.price);
            return 0; // 'recent' maintains the order from products state (API/Store)
        });
    }, [products, selectedCategory, searchTerm, selectedPlatform, sortBy]);

    const handleBuyClick = (e, product) => {
        registerSale(product);
        setShowSaleToast(true);
        setTimeout(() => setShowSaleToast(false), 3000);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
            <div className="p-6 pb-24 min-h-screen">
                {/* Legend/Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        MINHA <span className="text-primary text-3xl italic">GARAGEM</span>
                    </h2>
                    <p className="text-gray-500 text-xs italic uppercase tracking-widest">Ao comprar por este link você apoia o Jornada Biker sem pagar nada a mais por isso.</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="O que você precisa hoje?"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600 backdrop-blur-sm shadow-inner"
                    />
                </div>

                {/* Advanced Filters Toolbar */}
                <div className="space-y-4 mb-8">
                    {/* Categories Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all border ${selectedCategory === category
                                    ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                {category.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Platform & Sort Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Platform Filter */}
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-hidden">
                            {platforms.map(p => (
                                <button
                                    key={p}
                                    onClick={() => setSelectedPlatform(p)}
                                    className={`flex-1 py-2 text-[8px] font-black rounded-xl transition-all ${selectedPlatform === p
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-gray-600'}`}
                                >
                                    {p.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Sort Toggle */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-white/5 border border-white/5 text-white text-[9px] font-black rounded-2xl px-3 focus:outline-none appearance-none cursor-pointer text-center uppercase tracking-tighter"
                        >
                            <option value="recent">Mais Recentes</option>
                            <option value="price_asc">Menor Preço</option>
                            <option value="price_desc">Maior Preço</option>
                        </select>
                    </div>
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

                                    {/* Platform Indicator */}
                                    <div className="absolute top-3 left-3 z-20">
                                        {product.link?.includes('amazon') ? (
                                            <span className="bg-orange-500/80 backdrop-blur-sm text-[8px] font-black text-white px-2 py-0.5 rounded-lg border border-white/20">AMAZON</span>
                                        ) : (
                                            <span className="bg-yellow-400/80 backdrop-blur-sm text-[8px] font-black text-black px-2 py-0.5 rounded-lg border border-black/10">M. LIVRE</span>
                                        )}
                                    </div>

                                    {/* Category Chip */}
                                    <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] text-white font-bold border border-white/10 flex items-center gap-1 z-20 uppercase tracking-tighter">
                                        {product.category}
                                    </div>

                                    {/* Glass Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                                </div>

                                <div className="p-4 flex flex-col flex-1 relative">
                                    <h3 className="font-bold text-xs text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>

                                    <div className="mt-auto pt-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[10px] text-primary font-bold uppercase">R$</span>
                                            <span className="text-xl font-black text-white">{product.price?.toString().replace('R$', '').trim()}</span>
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
                    <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10 mt-4 backdrop-blur-sm">
                        <ShoppingBag size={48} className="mx-auto text-primary mb-4 opacity-20" />
                        <p className="text-gray-500 text-sm font-black uppercase italic tracking-widest">Garagem Vazia</p>
                        <p className="text-gray-700 text-[10px] mt-1 uppercase font-bold px-10">Tente ajustar seus filtros para encontrar novos itens.</p>
                        <button onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); setSelectedPlatform('Todos'); setSortBy('recent') }} className="mt-6 text-primary text-[10px] font-black bg-primary/10 px-8 py-3 rounded-2xl border border-primary/20 hover:bg-primary hover:text-black transition-all">LIMPAR TUDO</button>
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
        </PullToRefresh>
    );
}

