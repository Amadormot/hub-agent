import { LogOut } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
    const { logout } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 text-sm font-bold bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors"
        >
            <LogOut size={16} /> Sair
        </button>
    );
}
