import { Home, Map, Calendar, User, Wrench } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useChat } from '../contexts/ChatContext';

const navItems = [
    { icon: Home, label: 'Radar', path: '/' },
    { icon: Map, label: 'Rotas', path: '/rotas' },
    { icon: Calendar, label: 'Eventos', path: '/eventos' },
    { icon: Wrench, label: 'Garagem', path: '/garagem' },
    { icon: User, label: 'Perfil', path: '/perfil' },
];

export default function BottomNav() {
    const { totalUnread } = useChat();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-white/10 px-4 py-4 pb-6 md:pb-4 z-50">
            <ul className="flex justify-around items-center w-full">
                {navItems.map((item) => (
                    <li key={item.path} className="flex-1">
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => clsx(
                                "flex flex-col items-center gap-1.5 transition-all duration-200 py-1 relative",
                                isActive ? "text-primary scale-110" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <div className="relative">
                                <item.icon size={28} />
                                {item.path === '/perfil' && totalUnread > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-background-secondary animate-pulse" />
                                )}
                            </div>
                            <span className="text-[10px] uppercase tracking-tighter font-black opacity-60">
                                {item.label}
                            </span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
