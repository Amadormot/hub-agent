import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import RoutesPage from './pages/Routes';
import Events from './pages/Events';
import Profile from './pages/Profile';
import Garagem from './pages/Garagem';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider } from './contexts/UserContext';
import { ChatProvider } from './contexts/ChatContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Main App Component with Routing and Context
function App() {
  return (
    <NotificationProvider>
      <UserProvider>
        <DataProvider>
          <ChatProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<Home />} />
                    <Route path="rotas" element={<RoutesPage />} />
                    <Route path="eventos" element={<Events />} />
                    <Route path="garagem" element={<Garagem />} />
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="perfil" element={
                      <ErrorBoundary>
                        <Profile />
                      </ErrorBoundary>
                    } />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </ChatProvider>
        </DataProvider>
      </UserProvider>
    </NotificationProvider>
  );
}

export default App;
