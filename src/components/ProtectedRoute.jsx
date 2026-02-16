import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function ProtectedRoute() {
    const { user, isLoading } = useUser();

    if (isLoading) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-primary">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
