import { useState, useMemo } from 'react';
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
    ArrowUpRight
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { useData } from '../contexts/DataContext';
import { productsData } from '../data/mockData';
import NewsManager from '../components/NewsManager';

export default function AdminDashboard() {
    const { user } = useUser();
    const { routes, events, sales } = useData();
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
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Últimas Transações</h4>
                                                {sales.length === 0 ? (
                                                    <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-20" />
                                                        <p className="text-xs font-bold">Sem dados</p>
                                                    </div>
                                                ) : (
                                                    sales.map((sale) => (
                                                        <div key={sale.id} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5 hover:border-green-500/30 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                                                                    <CheckCircle size={20} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-white text-sm">{sale.productName}</h4>
                                                                    <p className="text-xs text-gray-500">{sale.date}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-black text-green-500 text-sm">
                                                                    + R$ {sale.commission.replace('.', ',')}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 uppercase font-bold">
                                                                    {sale.type === 'Destaque Evento' ? 'Receita Total' : 'Comissão (10%)'}
                                                                </div>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {productsData.slice(0, 4).map((product) => (
                                                <div key={product.id} className="bg-white/5 p-3 rounded-2xl flex items-center gap-4">
                                                    <img src={product.image} className="w-14 h-14 rounded-xl object-cover" />
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-white">{product.name}</h4>
                                                        <p className="text-primary text-xs font-black">{product.price}</p>
                                                    </div>
                                                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500"><Plus size={16} /></button>
                                                </div>
                                            ))}
                                            <button className="border border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all group">
                                                <Plus size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black uppercase">Novo Item</span>
                                            </button>
                                        </div>
                                    )}

                                    {activeTab !== 'store' && activeTab !== 'sales' && activeTab !== 'news' && (
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
