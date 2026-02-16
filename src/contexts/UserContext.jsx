import { createContext, useContext, useState, useEffect } from 'react';
import { getPatchByLevel } from '../constants/patches';
import { useNotification } from './NotificationContext';
import { supabase } from '../lib/supabase';
import { UserService } from '../services/UserService';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { notify } = useNotification();

    // Helper to calculate level updates
    const getLevelUpdates = (currentLevel, currentBadges, newXp) => {
        const newLevel = Math.floor(newXp / 1000) + 1;
        let updatedBadges = [...(currentBadges || [])];
        let levelUpOccurred = false;

        if (newLevel > currentLevel) {
            levelUpOccurred = true;
            for (let l = (currentLevel || 1) + 1; l <= newLevel; l++) {
                const patch = getPatchByLevel(l);
                if (patch && !updatedBadges.includes(patch.name)) {
                    updatedBadges.push(patch.name);
                }
            }
        }
        return { newLevel, updatedBadges, levelUpOccurred };
    };

    // Initialize Auth state listener
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check current session with timeout
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Auth Init Timeout")), 15000) // Aumentado para 15s
                );

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

                if (session?.user) {
                    // Also timeout the user data fetch to avoid infinite loading
                    const fetchPromise = fetchAndSetUserData(session.user.id);
                    await Promise.race([
                        fetchPromise,
                        new Promise(resolve => setTimeout(resolve, 10000)) // Aumentado para 10s para redes lentas
                    ]);
                }
            } catch (error) {
                console.warn("Error initializing auth (likely timeout):", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Changed:", event, session?.user?.id);
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                await fetchAndSetUserData(session.user.id, session);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('moto_hub_user');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchAndSetUserData = async (userId, newSession = null) => {
        if (!userId) return;

        try {
            // First time attempt with timeout
            const fetchPromise = supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("DB Fetch Timeout")), 5000)
            );

            const { data: userData, error } = await Promise.race([fetchPromise, timeoutPromise])
                .catch(err => {
                    console.warn("User data fetch failed or timed out, will try fallback.", err.message);
                    return { data: null, error: err };
                });

            // Se o banco falhar ou não retornar dados, usar o fallback (da sessão ou do parâmetro)
            if (error || !userData) {
                const sessionToUse = newSession || (await supabase.auth.getSession()).data.session;

                if (sessionToUse?.user?.id === userId) {
                    const fallbackUser = {
                        id: sessionToUse.user.id,
                        email: sessionToUse.user.email,
                        name: sessionToUse.user.user_metadata?.name || 'Piloto',
                        avatar: `https://ui-avatars.com/api/?name=${sessionToUse.user.user_metadata?.name || 'User'}&background=random`,
                        is_admin: sessionToUse.user.email === 'admin@motohub.com.br' || sessionToUse.user.email === 'agm_jr@outlook.com',
                        ...sessionToUse.user.user_metadata
                    };
                    setUser(prev => prev?.id === userId && prev.email ? prev : fallbackUser);
                    localStorage.setItem('moto_hub_user', JSON.stringify(fallbackUser));
                }
                return;
            }

            // Se tiver dados do banco, usa eles
            if (userData) {
                const formattedUser = {
                    ...userData,
                    isAdmin: userData.is_admin,
                    routesCompleted: userData.routes_completed,
                    eventsAttended: userData.events_attended,
                    likedRoutes: userData.liked_routes || [],
                    favoriteRoutes: userData.favorite_routes || [],
                    likedEvents: userData.liked_events || [],
                    favoriteEvents: userData.favorite_events || [],
                    followingList: userData.following_list || [],
                    followersList: userData.followers_list || [],
                    following: (userData.following_list || []).length,
                    followers: (userData.followers_list || []).length,
                    // Profile fields (camelCase columns in DB)
                    clubBadge: userData.clubBadge || userData.club_badge || '',
                    avatarFraming: userData.avatarFraming || userData.avatar_framing || { zoom: 1, x: 0, y: 0 },
                    badgeFraming: userData.badgeFraming || userData.badge_framing || { zoom: 1, x: 0, y: 0 },
                    // Additional profile data
                    bio: userData.bio || '',
                    patches: userData.patches || [],
                    premium: userData.premium || false,
                    completedRoutes: userData.completed_routes || [],
                    pastEvents: userData.past_events || [],
                    suggestedRoutes: userData.suggested_routes || []
                };
                setUser(formattedUser);
                localStorage.setItem('moto_hub_user', JSON.stringify(formattedUser));
            }
        } catch (error) {
            if (error.code === 20 || error.name === 'AbortError') {
                console.warn("Fetch aborted or cancelled (safe to ignore):", error);
                return;
            }
            console.error("Error fetching user data:", error);
            // Mesmo com erro, tenta manter o usuário logado com o que tiver
        }
    };

    const login = async (email, password) => {
        setIsLoading(true);
        console.log("Tentando login com:", email);
        try {
            const loginPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Supabase SDK Timeout")), 45000) // Aumentado para 45s
            );

            try {
                const { data, error } = await Promise.race([loginPromise, timeoutPromise]);
                console.log("Resposta do Login (SDK retornou):", { data, error });
                if (error) throw error;
                notify("Bem-vindo de volta!", "success");
                return true;
            } catch (err) {
                // Verificar se o login aconteceu via listener mesmo com timeout na promessa
                if (err.message === "Supabase SDK Timeout") {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        console.log("Login: Timeout na promessa mas usuário detectado na sessão. Continuando...");
                        notify("Logado com sucesso (Rede instável)", "warning");
                        return true;
                    }
                }
                throw err;
            }
        } catch (error) {
            console.error("Login error:", error);
            notify(error.message || "Erro ao fazer login", "error");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password, motorcycle = null, city = '', state = '') => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        motorcycle,
                        location: city ? `${city}, ${state}` : '',
                        details: { city, state }
                    }
                }
            });

            if (error) throw error;

            if (data.user && data.session) {
                notify("Conta criada com sucesso!", "success");
                return true;
            } else {
                notify("Verifique seu email para confirmar o cadastro.", "info");
                return true;
            }
        } catch (error) {
            console.error("Register error:", error);
            notify(error.message || "Erro ao criar conta", "error");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // setUser(null) and localStorage.removeItem are now handled by the useEffect's onAuthStateChange listener
            notify("Até a próxima!", "info");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const updateProfile = async (updatedData) => {
        if (!user) return;
        try {
            // Map frontend fields back to snake_case for DB
            const dbUpdates = {
                ...updatedData
            };
            if (updatedData.isAdmin !== undefined) dbUpdates.is_admin = updatedData.isAdmin;

            const updatedProfile = await UserService.updateUser(user.id, dbUpdates);
            if (updatedProfile) {
                await fetchAndSetUserData(user.id);
                notify("Perfil atualizado!", "success");
            }
        } catch (error) {
            console.error("Profile update error:", error);
            notify("Erro ao atualizar perfil", "error");
        }
    };

    const toggleLike = async (routeId) => {
        if (!user) return false;
        // In the future, this should use a routes_likes table
        const routeIdStr = String(routeId);
        const currentLikes = user.likedRoutes || [];
        const isCurrentlyLiked = currentLikes.includes(routeIdStr);
        const updatedLikes = isCurrentlyLiked
            ? currentLikes.filter(id => id !== routeIdStr)
            : [...currentLikes, routeIdStr];

        await updateProfile({ liked_routes: updatedLikes });
        return !isCurrentlyLiked;
    };

    const toggleFavorite = async (routeId) => {
        if (!user) return false;
        const routeIdStr = String(routeId);
        const currentFavorites = user.favoriteRoutes || [];
        const isCurrentlyFavorite = currentFavorites.includes(routeIdStr);
        const updatedFavorites = isCurrentlyFavorite
            ? currentFavorites.filter(id => id !== routeIdStr)
            : [...currentFavorites, routeIdStr];

        await updateProfile({ favorite_routes: updatedFavorites });

        if (!isCurrentlyFavorite) {
            notify("Adicionado aos favoritos!", "success");
        } else {
            notify("Removido dos favoritos.", "info");
        }
        return !isCurrentlyFavorite;
    };

    const toggleLikeEvent = async (eventId) => {
        if (!user) return false;
        const eventIdStr = String(eventId);
        const currentLikes = user.likedEvents || [];
        const isCurrentlyLiked = currentLikes.includes(eventIdStr);
        const updatedLikes = isCurrentlyLiked
            ? currentLikes.filter(id => id !== eventIdStr)
            : [...currentLikes, eventIdStr];

        await updateProfile({ liked_events: updatedLikes });
        return !isCurrentlyLiked;
    };

    const toggleFavoriteEvent = async (eventId) => {
        if (!user) return false;
        const eventIdStr = String(eventId);
        const currentFavorites = user.favoriteEvents || [];
        const isCurrentlyFavorite = currentFavorites.includes(eventIdStr);
        const updatedFavorites = isCurrentlyFavorite
            ? currentFavorites.filter(id => id !== eventIdStr)
            : [...currentFavorites, eventIdStr];

        await updateProfile({ favorite_events: updatedFavorites });

        if (!isCurrentlyFavorite) {
            notify("Evento adicionado aos favoritos!", "success");
        } else {
            notify("Evento removido dos favoritos.", "info");
        }
        return !isCurrentlyFavorite;
    };

    const addXp = async (amount, reason = "Atividade") => {
        if (!user) return;
        try {
            const result = await UserService.addXP(user.id, amount, reason);
            if (result.leveledUp) {
                notify(`Parabéns! Você alcançou o Nível ${result.newLevel} e ganhou novos patches!`, "success");
            }
            await fetchAndSetUserData(user.id);
        } catch (error) {
            console.error("Error adding XP:", error);
        }
    };

    const checkInEvent = async (event) => {
        if (!user) return;
        // Check if already attended eventually with a joined table
        notify(`Check-in realizado! Você ganhou 50 XP.`, "info");
        await addXp(50, `Participação em evento: ${event.title}`);
    };

    const followUser = async (targetUserId) => {
        if (!user || !targetUserId || String(user.id) === String(targetUserId)) return;

        try {
            const targetIdStr = String(targetUserId);
            const myIdStr = String(user.id);
            const currentFollowing = user.followingList || [];
            const isFollowing = currentFollowing.some(id => String(id) === targetIdStr);

            // 1. Update my following list
            const newFollowing = isFollowing
                ? currentFollowing.filter(id => String(id) !== targetIdStr)
                : [...currentFollowing, targetIdStr];

            await UserService.updateUser(user.id, {
                following_list: newFollowing
            });

            // 2. Update target user's followers list
            const { data: targetData } = await supabase
                .from('users')
                .select('followers_list')
                .eq('id', targetUserId)
                .single();

            if (targetData) {
                const targetFollowers = targetData.followers_list || [];
                const newTargetFollowers = isFollowing
                    ? targetFollowers.filter(id => String(id) !== myIdStr)
                    : [...targetFollowers, myIdStr];

                await supabase
                    .from('users')
                    .update({ followers_list: newTargetFollowers })
                    .eq('id', targetUserId);
            }

            // 3. Refresh my data
            await fetchAndSetUserData(user.id);

            notify(isFollowing ? "Deixou de seguir." : "Seguindo!", "success");
            return true;
        } catch (error) {
            console.error("Follow error:", error);
            notify("Erro ao seguir piloto", "error");
            return false;
        }
    };

    // Active Route State (Keep in localStorage for session resilience)
    const [activeRoute, setActiveRoute] = useState(() => {
        const stored = localStorage.getItem('moto_hub_active_route');
        return stored ? JSON.parse(stored) : null;
    });

    const startRoute = (routeId, routeName) => {
        if (activeRoute) return false;

        const newActiveRoute = {
            id: routeId,
            name: routeName || 'Rota #' + routeId,
            startTime: Date.now(),
            status: 'in_progress'
        };

        setActiveRoute(newActiveRoute);
        localStorage.setItem('moto_hub_active_route', JSON.stringify(newActiveRoute));
        return true;
    };

    const endRoute = async () => {
        if (!activeRoute || !user) return null;

        const finishedRoute = { ...activeRoute, endTime: Date.now(), status: 'completed' };
        setActiveRoute(null);
        localStorage.removeItem('moto_hub_active_route');

        // Increment routes completed in DB
        await UserService.updateUser(user.id, {
            routes_completed: (user.routesCompleted || 0) + 1
        });

        await addXp(100, `Rota concluída: ${activeRoute.name}`);
        await fetchAndSetUserData(user.id);

        return finishedRoute;
    };

    const abortRoute = () => {
        setActiveRoute(null);
        localStorage.removeItem('moto_hub_active_route');
        notify("Rota cancelada.", "info");
    };

    return (
        <UserContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
            updateProfile,
            addXp,
            activeRoute,
            startRoute,
            endRoute,
            abortRoute,
            toggleLike,
            toggleFavorite,
            toggleLikeEvent,
            toggleFavoriteEvent,
            followUser
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}

