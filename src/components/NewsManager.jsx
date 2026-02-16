import { useState, useEffect } from 'react';
import { NewsAPI } from '../services/NewsAPI';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Image as ImageIcon, ExternalLink, Loader, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import clsx from 'clsx';

export default function NewsManager() {
    const { notify } = useNotification();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [importStatus, setImportStatus] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        image: '',
        source: 'Moto Hub Admin',
        url: '',
        published: true
    });

    // Load news on mount
    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        setLoading(true);
        try {
            const data = await NewsAPI.getNews({ includeUnpublished: true });
            setNews(data);
        } catch (error) {
            notify('Erro ao carregar notícias', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            summary: '',
            content: '',
            image: '',
            source: 'Moto Hub Admin',
            url: '',
            published: true
        });
        setEditingNews(null);
        setIsFormOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingNews) {
                await NewsAPI.updateNews(editingNews.id, formData);
                notify('Notícia atualizada com sucesso!', 'success');
            } else {
                await NewsAPI.createNews(formData);
                notify('Notícia criada com sucesso!', 'success');
            }

            await loadNews();
            resetForm();
        } catch (error) {
            notify(error.message || 'Erro ao salvar notícia', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (newsItem) => {
        setEditingNews(newsItem);
        setFormData({
            title: newsItem.title,
            summary: newsItem.summary,
            content: newsItem.content || '',
            image: newsItem.image,
            source: newsItem.source,
            url: newsItem.url,
            published: newsItem.published
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja deletar esta notícia?')) return;

        setLoading(true);
        try {
            await NewsAPI.deleteNews(id);
            notify('Notícia deletada com sucesso!', 'success');
            await loadNews();
        } catch (error) {
            notify(error.message || 'Erro ao deletar notícia', 'error');
        } finally {
            setLoading(false);
        }
    };

    const togglePublished = async (newsItem) => {
        setLoading(true);
        try {
            await NewsAPI.updateNews(newsItem.id, { published: !newsItem.published });
            notify(`Notícia ${!newsItem.published ? 'publicada' : 'despublicada'}!`, 'success');
            await loadNews();
        } catch (error) {
            notify('Erro ao atualizar status', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImport = async () => {
        setImportStatus(null);
        let items;
        try {
            items = JSON.parse(importJson);
            if (!Array.isArray(items)) items = [items];
        } catch {
            setImportStatus({ type: 'error', msg: 'JSON inválido. Verifique o formato.' });
            return;
        }

        setLoading(true);
        let ok = 0, fail = 0;
        for (const item of items) {
            try {
                await NewsAPI.createNews({
                    title: item.title,
                    summary: item.summary,
                    image: item.image || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format',
                    source: item.source || 'AI Agent',
                    url: item.url || '#',
                    published: true
                });
                ok++;
            } catch {
                fail++;
            }
        }
        setLoading(false);
        setImportStatus({ type: 'success', msg: `${ok} publicada(s), ${fail} erro(s)` });
        if (ok > 0) {
            await loadNews();
            notify(`${ok} notícia(s) importada(s)!`, 'success');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black text-white">Gerenciar Notícias</h3>
                    <p className="text-xs text-gray-500 mt-1">Publique e gerencie o feed de notícias</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            const token = import.meta.env.VITE_GITHUB_ACTOR_TOKEN;
                            if (!token) {
                                alert("Token do GitHub não configurado! Adicione VITE_GITHUB_ACTOR_TOKEN no arquivo .env");
                                return;
                            }

                            if (!window.confirm("Deseja iniciar o Agente de Notícias agora?")) return;

                            try {
                                const res = await fetch('https://api.github.com/repos/Amadormot/hub-agent/actions/workflows/news-agent.yml/dispatches', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Accept': 'application/vnd.github.v3+json',
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ ref: 'master' })
                                });

                                if (res.ok) {
                                    notify("Agente disparado! 🚀 Aguarde alguns minutos para ver as notícias.", 'success');
                                } else {
                                    const err = await res.text();
                                    notify(`Erro ao disparar agente: ${res.status}`, 'error');
                                }
                            } catch (e) {
                                notify(`Erro de conexão: ${e.message}`, 'error');
                            }
                        }}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 border border-blue-500/30"
                    >
                        <span className="text-base">🤖</span>
                        Executar Agente
                    </button>
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 border border-blue-500/30"
                    >
                        <Upload size={16} />
                        Importar JSON
                    </button>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-primary hover:bg-orange-600 text-black px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Nova Notícia
                    </button>
                </div>
            </div>

            {/* API Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <ExternalLink size={20} className="text-blue-500 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-1">API para Agentes de IA</h4>
                        <p className="text-xs text-gray-400 mb-2">Use a API Key abaixo para publicar notícias via agentes:</p>
                        <code className="bg-black/40 text-primary text-xs px-3 py-1.5 rounded border border-white/10 font-mono block">
                            X-API-Key: {NewsAPI.getAPIKey()}
                        </code>
                    </div>
                </div>
            </div>

            {/* News List */}
            <div className="space-y-3">
                {loading && news.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="animate-spin text-primary" size={32} />
                    </div>
                ) : news.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                        <ImageIcon size={48} className="mx-auto mb-3 opacity-20 text-gray-500" />
                        <p className="text-sm text-gray-500 font-bold">Nenhuma notícia publicada</p>
                        <p className="text-xs text-gray-600 mt-1">Clique em "Nova Notícia" para começar</p>
                    </div>
                ) : (
                    news.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "bg-white/5 border rounded-xl p-4 flex gap-4",
                                item.published ? "border-white/10" : "border-yellow-500/30 bg-yellow-500/5"
                            )}
                        >
                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-bold text-white text-sm line-clamp-1">{item.title}</h4>
                                    {!item.published && (
                                        <span className="bg-yellow-500/20 text-yellow-500 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                                            Rascunho
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.summary}</p>
                                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                    <span>{item.source}</span>
                                    <span>•</span>
                                    <span>{item.date}</span>
                                    {item.author === 'ai-agent' && (
                                        <>
                                            <span>•</span>
                                            <span className="text-blue-400 font-bold">🤖 AI Agent</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <button
                                    onClick={() => togglePublished(item)}
                                    className={clsx(
                                        "p-2 rounded-lg transition-all",
                                        item.published
                                            ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                            : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                                    )}
                                    title={item.published ? "Despublicar" : "Publicar"}
                                >
                                    {item.published ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-all"
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all"
                                    title="Deletar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={resetForm}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background-secondary w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h3 className="text-xl font-bold text-white">
                                    {editingNews ? 'Editar Notícia' : 'Nova Notícia'}
                                </h3>
                                <button onClick={resetForm} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="Ex: Honda lança nova CB 500 Hornet 2026"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                        Resumo *
                                    </label>
                                    <textarea
                                        value={formData.summary}
                                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                                        rows={3}
                                        placeholder="Breve descrição da notícia..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                            Fonte
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.source}
                                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                            placeholder="Ex: MotoMundo"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                            Link Externo
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.url}
                                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                        URL da Imagem *
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="https://images.unsplash.com/..."
                                        required
                                    />
                                    {formData.image && (
                                        <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                                            <img src={formData.image} alt="Preview" className="w-full h-40 object-cover" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="published"
                                        checked={formData.published}
                                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                        className="w-4 h-4 accent-primary"
                                    />
                                    <label htmlFor="published" className="text-sm text-gray-400 font-bold">
                                        Publicar imediatamente
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-primary hover:bg-orange-600 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Salvando...' : editingNews ? 'Atualizar' : 'Publicar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Import JSON Modal */}
            <AnimatePresence>
                {isImportOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => { setIsImportOpen(false); setImportStatus(null); }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background-secondary w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Importar Notícias via JSON</h3>
                                    <p className="text-xs text-gray-500 mt-1">Cole o JSON gerado pelo Gem do Gemini</p>
                                </div>
                                <button onClick={() => { setIsImportOpen(false); setImportStatus(null); }} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                                    <p className="text-xs text-blue-400">💡 Peça ao Gem: <strong>"Pesquise 5 notícias sobre motos"</strong> e cole o JSON aqui.</p>
                                </div>

                                <textarea
                                    value={importJson}
                                    onChange={(e) => setImportJson(e.target.value)}
                                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-xs focus:outline-none focus:border-primary transition-colors resize-none"
                                    rows={12}
                                    placeholder='[\n  {\n    "title": "Título",\n    "summary": "Resumo",\n    "image": "https://...",\n    "source": "Fonte",\n    "url": "https://..."\n  }\n]'
                                />

                                {importStatus && (
                                    <div className={clsx(
                                        "flex items-center gap-2 p-3 rounded-xl text-sm font-bold",
                                        importStatus.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                    )}>
                                        {importStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {importStatus.msg}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleBulkImport}
                                        disabled={loading || !importJson.trim()}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader className="animate-spin" size={16} /> : <Upload size={16} />}
                                        {loading ? 'Importando...' : 'Importar e Publicar'}
                                    </button>
                                    <button
                                        onClick={() => { setIsImportOpen(false); setImportStatus(null); }}
                                        className="px-6 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
