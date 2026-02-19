import { useState, useMemo, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    MessageSquare,
    MapPin,
    Calendar,
    ShoppingBag,
    CheckCircle,
    XCircle,
    Clock,
    ChevronRight,
    Search,
    Plus,
    BarChart3,
    ArrowUpRight,
    QrCode,
    Copy,
    Upload,
    X,
    Shield
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { useData } from '../contexts/DataContext';
import { productsData } from '../data/mockData';
import NewsManager from '../components/NewsManager';
import ProductManager from '../components/ProductManager';
import { compressImage } from '../utils/imageCompression';
import { useNotification } from '../contexts/NotificationContext';

function AdminSettings() {
    const { user, updateProfile } = useUser();
    const { notify } = useNotification();
    const [pixKey, setPixKey] = useState(user?.pixKey || '');
    const [pixQR, setPixQR] = useState(user?.pixQR || '');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedDataUrl = await compressImage(file, 1024, 0.8);
                setPixQR(compressedDataUrl);
            } catch (error) {
                console.error("Error compressing image:", error);
                const reader = new FileReader();
                reader.onloadend = () => setPixQR(reader.result);
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({ pixKey, pixQR });
            notify("Configurações salvas com sucesso!", "success");
        } catch (error) {
            notify("Erro ao salvar configurações", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-4">
            <div className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                        <QrCode size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-lg uppercase tracking-tight">Configurações de Recebimento</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Defina como você receberá os pagamentos de patrocinadores</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Chave PIX</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={pixKey}
                                onChange={(e) => setPixKey(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold text-sm"
                                placeholder="E-mail, CPF, CNPJ ou Celular"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-50">
                                <Shield size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">QR Code PIX (Opcional)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div
                                className="aspect-square bg-black/40 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-all group overflow-hidden relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {pixQR ? (
                                    <>
                                        <img src={pixQR} className="w-full h-full object-contain bg-white" alt="PIX QR Code" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                                            <Upload size={24} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Trocar Imagem</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors">
                                            <Upload size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-white uppercase tracking-wider">Upload QR Code</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">PNG ou JPG</p>
                                        </div>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="flex flex-col justify-center space-y-4">
                                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Shield size={12} /> Segurança
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                        Esses dados serão exibidos apenas para usuários que solicitarem destaque (Premium) em seus eventos.
                                    </p>
                                </div>

                                {pixQR && (
                                    <button
                                        onClick={() => setPixQR('')}
                                        className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-2"
                                    >
                                        <X size={14} /> Remover QR Code
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-primary hover:bg-orange-600 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase tracking-[0.2em] text-xs active:scale-95"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user } = useUser();
    const { routes, events, sales, confirmPayment } = useData();
    const [activeTab, setActiveTab] = useState('sales');
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    // Protect Route
    if (!user || !user.isAdmin) {
        return <Navigate to="/" replace />;
    }

    const stats = [
        { label: 'Receita Total', value: `R$ ${sales.reduce((acc, sale) => acc + parseFloat(sale.commission), 0).toFixed(2).replace('.', ',')}`, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
        {
            label: 'Itens Vendidos',
            value: (
                <div className="flex flex-col text-sm">
                    <span className="font-black text-2xl">{sales.length}</span>
                    <div className="flex gap-2 text-[10px] opacity-70 mt-1 font-bold uppercase tracking-tight">
                        <span>🛍️ {sales.filter(s => s.type === 'Produto').length} Loja</span>
                        <span>🌟 {sales.filter(s => s.type === 'Destaque Evento').length} Eventos</span>
                    </div>
                </div>
            ),
            icon: ShoppingBag,
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        { label: 'Eventos Ativos', value: events.length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    const menuItems = [
        { id: 'sales', label: 'Vendas', icon: CheckCircle },
        { id: 'news', label: 'Notícias', icon: MessageSquare },
        { id: 'events', label: 'Eventos', icon: Calendar },
        { id: 'store', label: 'Loja Overview', icon: ShoppingBag },
        { id: 'config', label: 'Configurações', icon: LayoutDashboard },
    ];

    return (
        <div className="p-6 pb-24 min-h-screen">

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-background-secondary p-4 rounded-2xl border border-white/5 shadow-lg"
                    >
                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        <div className="text-2xl font-black text-white leading-none mb-1">{stat.value}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main Interface */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={clsx(
                                "w-full flex items-center justify-between p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest group",
                                activeTab === item.id
                                    ? "bg-primary text-black"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={18} />
                                {item.label}
                            </div>
                            <ChevronRight size={16} className={clsx(activeTab === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity")} />
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="flex-1">
                    <div className="bg-background-secondary rounded-3xl border border-white/5 overflow-hidden shadow-2xl min-h-[500px]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                                {menuItems.find(m => m.id === activeTab)?.label}
                                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full">ATIVO</span>
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        className="bg-black/20 border border-white/5 rounded-full py-1.5 pl-9 pr-4 text-xs text-white outline-none focus:border-primary/50 transition-all w-40"
                                    />
                                </div>
                                <button className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-all">
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >

                                    {activeTab === 'sales' && (
                                        <div className="space-y-8">
                                            {/* Revenue Evolution Chart */}
                                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                <div className="flex justify-between items-end mb-6">
                                                    <div>
                                                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                                            <BarChart3 size={20} className="text-primary" />
                                                            Evolução de Receita
                                                        </h3>
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                                            Visão Anual
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-black text-white">
                                                            R$ {sales.reduce((acc, sale) => acc + parseFloat(sale.commission), 0).toFixed(2).replace('.', ',')}
                                                        </div>
                                                        <div className="text-[10px] text-green-500 font-bold uppercase tracking-wide flex items-center justify-end gap-1">
                                                            <ArrowUpRight size={12} /> Acumulado
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="h-48 w-full relative">
                                                    {(() => {
                                                        const currentYear = new Date().getFullYear();
                                                        const monthlyData = Array(12).fill(0);

                                                        sales.forEach(sale => {
                                                            const [datePart] = sale.date.split(' ');
                                                            const [day, month, year] = datePart.split('/');
                                                            if (parseInt(year) === currentYear) {
                                                                monthlyData[parseInt(month) - 1] += parseFloat(sale.commission);
                                                            }
                                                        });

                                                        const maxVal = Math.max(...monthlyData, 1);
                                                        const points = monthlyData.map((val, idx) => {
                                                            const x = (idx / 11) * 100;
                                                            const y = 100 - ((val / maxVal) * 100);
                                                            return `${x},${y}`;
                                                        }).join(' ');

                                                        const areaPath = `M0,100 L${points.replace(/ /g, ' L')} L100,100 Z`;

                                                        return (
                                                            <div className="absolute inset-0 top-4 bottom-6">
                                                                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                                    <defs>
                                                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.5" />
                                                                            <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
                                                                        </linearGradient>
                                                                    </defs>

                                                                    {/* Area */}
                                                                    <path d={areaPath} fill="url(#chartGradient)" />

                                                                    {/* Line */}
                                                                    <path
                                                                        d={`M${points.replace(/ /g, ' L')}`}
                                                                        fill="none"
                                                                        stroke="#EAB308"
                                                                        strokeWidth="2"
                                                                        vectorEffect="non-scaling-stroke"
                                                                    />

                                                                    {/* Points */}
                                                                    {monthlyData.map((val, idx) => {
                                                                        const x = (idx / 11) * 100;
                                                                        const y = 100 - ((val / maxVal) * 100);
                                                                        const monthName = new Date(0, idx).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

                                                                        return (
                                                                            <g key={idx} className="group cursor-pointer">
                                                                                <circle cx={x} cy={y} r="0" className="opacity-0 group-hover:opacity-100 transition-opacity" fill="#EAB308" stroke="white" strokeWidth="0.5" />
                                                                                <circle cx={x} cy={y} r="1.5" className="fill-primary" vectorEffect="non-scaling-stroke" />

                                                                                {/* Tooltip */}
                                                                                <foreignObject x={x - 15} y={y - 25} width="30" height="20" className="opacity-0 group-hover:opacity-100 transition-opacity overflow-visible">
                                                                                    <div className="bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap -translate-x-1/2 left-1/2 relative text-center shadow-xl">
                                                                                        R${val.toFixed(0)}
                                                                                    </div>
                                                                                </foreignObject>
                                                                            </g>
                                                                        );
                                                                    })}
                                                                </svg>

                                                                {/* X-Axis Labels */}
                                                                <div className="absolute top-full left-0 right-0 flex justify-between mt-2">
                                                                    {monthlyData.map((_, idx) => (
                                                                        <span key={idx} className="text-[8px] sm:text-[10px] text-gray-600 font-bold uppercase w-8 text-center">
                                                                            {new Date(0, idx).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Transaction List */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Últimas Transações</h4>
                                                    <div className="flex gap-2">
                                                        <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                                            Concluído: {sales.filter(s => s.status === 'completed' || !s.status).length}
                                                        </span>
                                                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                                                            Pendente: {sales.filter(s => s.status === 'pending').length}
                                                        </span>
                                                    </div>
                                                </div>

                                                {sales.length === 0 ? (
                                                    <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-20" />
                                                        <p className="text-xs font-bold">Sem dados</p>
                                                    </div>
                                                ) : (
                                                    // Sort pending first
                                                    [...sales].sort((a, b) => (a.status === 'pending' ? -1 : 1)).map((sale) => (
                                                        <div key={sale.id} className={clsx(
                                                            "bg-white/5 p-4 rounded-xl flex items-center justify-between border transition-all",
                                                            sale.status === 'pending' ? 'border-yellow-500/30 ring-1 ring-yellow-500/10' : 'border-white/5 hover:border-green-500/30'
                                                        )}>
                                                            <div className="flex items-center gap-4">
                                                                <div className={clsx(
                                                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                                                    sale.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                                                                )}>
                                                                    {sale.status === 'pending' ? <Clock size={20} /> : <CheckCircle size={20} />}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-white text-sm">{sale.productName}</h4>
                                                                    <p className="text-xs text-gray-500">{sale.date}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right">
                                                                    <div className={clsx("font-black text-sm", sale.status === 'pending' ? 'text-white' : 'text-green-500')}>
                                                                        {sale.status === 'pending' ? '' : '+ '} R$ {sale.commission.replace('.', ',')}
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-400 uppercase font-bold">
                                                                        {sale.status === 'pending' ? 'Aguardando PIX' : (sale.type === 'Destaque Evento' ? 'Receita Total' : 'Comissão (10%)')}
                                                                    </div>
                                                                </div>

                                                                {sale.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => confirmPayment(sale.id)}
                                                                        className="bg-primary text-black text-[10px] font-black uppercase px-3 py-2 rounded-lg hover:bg-orange-500 transition-all shadow-lg shadow-primary/20"
                                                                    >
                                                                        Confirmar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'news' && (
                                        <NewsManager />
                                    )}

                                    {activeTab === 'store' && (
                                        <ProductManager />
                                    )}

                                    {activeTab === 'config' && (
                                        <AdminSettings />
                                    )}


                                    {activeTab !== 'store' && activeTab !== 'sales' && activeTab !== 'news' && activeTab !== 'config' && (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                                            <Clock size={48} className="mb-4 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Selecione uma categoria</p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>


        </div>
    );
}
