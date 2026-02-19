import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, X, Upload, Save, Link as LinkIcon, ShoppingBag, Trash2, Pencil } from 'lucide-react';

export default function ProductManager() {
    const { products, addProduct, updateProduct } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Equipamentos',
        image: '',
        link: '',
        description: ''
    });

    const categories = ['Equipamentos', 'Peças', 'Acessórios', 'Manutenção'];

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.price || !formData.image) {
            alert('Preencha os campos obrigatórios!');
            return;
        }

        const productData = {
            ...formData,
            // If no link provided, default to google search as fallback, 
            // but the UI encourages a specific link.
            link: formData.link || `https://www.google.com/search?q=${encodeURIComponent(formData.name)}`,
            specs: [] // Empty specs for manually added items for now
        };

        if (editingId) {
            updateProduct({ ...productData, id: editingId });
        } else {
            addProduct(productData);
        }

        // Reset and close
        setFormData({
            name: '',
            price: '',
            category: 'Equipamentos',
            image: '',
            link: '', // Reset link field
            description: ''
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            price: product.price,
            category: product.category,
            image: product.image,
            link: product.link || '',
            description: product.description || ''
        });
        setEditingId(product.id);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
            name: '',
            price: '',
            category: 'Equipamentos',
            image: '',
            link: '',
            description: ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <ShoppingBag size={20} className="text-primary" />
                        Gerenciar Loja
                    </h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {products.length} Itens cadastrados
                    </p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-primary text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Novo Produto
                    </button>
                )}
            </div>

            {isAdding ? (
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-white font-bold">{editingId ? 'Editar Produto' : 'Adicionar Novo Produto'}</h4>
                        <button onClick={handleCancel} className="text-gray-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Produto *</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Capacete LS2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço (R$) *</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                                    value={formData.price}
                                    onChange={e => {
                                        const value = e.target.value;
                                        // Remove non-digits
                                        const numericValue = value.replace(/\D/g, '');

                                        // Format as currency (R$)
                                        const formatted = new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(numericValue / 100);

                                        setFormData({ ...formData, price: formatted });
                                    }}
                                    placeholder="R$ 0,00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                                <select
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL da Imagem *</label>
                                <div className="relative">
                                    <Upload size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white focus:border-primary/50 outline-none"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link de Afiliado / Venda *</label>
                            <div className="relative">
                                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-primary/30 rounded-xl pl-9 pr-4 py-2 text-white focus:border-primary outline-none"
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="Cole aqui o seu link de afiliado (Amazon, Magalu, etc)"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">* Se deixado em branco, será gerado um link de busca automática.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Breve Descrição</label>
                            <textarea
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none h-20 resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Uma descrição curta e atrativa sobre o produto..."
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-primary text-black px-6 py-2 rounded-xl text-sm font-black uppercase hover:bg-white transition-colors flex items-center gap-2"
                            >
                                <Save size={16} /> Salvar Produto
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* List Products */}
                    {products.map((product) => (
                        <div key={product.id} className="bg-white/5 p-3 rounded-2xl flex items-center gap-4 group border border-white/5 hover:border-white/10 transition-colors">
                            <img src={product.image} className="w-16 h-16 rounded-xl object-cover bg-black/20" alt={product.name} />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
                                <p className="text-primary text-xs font-black">{product.price}</p>
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">{product.category}</p>
                            </div>
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="p-1.5 hover:bg-blue-500/20 text-gray-500 hover:text-blue-500 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors" title="Remover (Em breve)">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add Button Card */}
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group min-h-[90px]"
                    >
                        <Plus size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase">Adicionar Item</span>
                    </button>
                </div>
            )}
        </div>
    );
}
