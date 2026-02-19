import { createContext, useContext, useState, useEffect } from 'react';
import { getPatchByLevel } from '../constants/patches';
import { useNotification } from './NotificationContext';
import { supabase } from '../lib/supabase';
import { UserService } from '../services/UserService';
import { getCurrentPosition } from '../utils/geo';
import NotificationService from '../services/NotificationService';

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
                fetchAndSetUserData(session.user.id, session); // Non-blocking
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('jornada_biker_user');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchAndSetUserData = async (userId, newSession = null, retryCount = 0) => {
        if (!userId || retryCount > 1) return;

        try {
            const fetchPromise = supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("DB Fetch Timeout")), 4000)
            );

            const { data: userData, error } = await Promise.race([fetchPromise, timeoutPromise])
                .catch(err => {
                    console.warn("User data fetch failed or timed out:", err.message);
                    return { data: null, error: err };
                });

            if (error || !userData) {
                console.log(`Dados não encontrados no banco (Tentativa ${retryCount}). Verificando sessão...`);
                const sessionToUse = newSession || (await supabase.auth.getSession()).data.session;

                if (sessionToUse?.user?.id === userId) {
                    if (retryCount === 0) {
                        try {
                            const { data: checkProfile } = await supabase
                                .from('users')
                                .select('id')
                                .eq('id', userId)
                                .maybeSingle();

                            if (!checkProfile) {
                                console.log("Perfil não existe. Criando agora...");
                                await UserService.createUser({
                                    id: userId,
                                    email: sessionToUse.user.email,
                                    name: sessionToUse.user.user_metadata?.name || 'Piloto',
                                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sessionToUse.user.user_metadata?.name || 'User')}&background=EA580C&color=fff&size=256`,
                                    motorcycle: sessionToUse.user.user_metadata?.motorcycle || {},
                                    location: sessionToUse.user.user_metadata?.location || null,
                                    details: sessionToUse.user.user_metadata?.details || {}
                                });
                                return fetchAndSetUserData(userId, sessionToUse, 1);
                            }
                        } catch (createError) {
                            console.error("Erro ao tentar auto-criar perfil:", createError);
                        }
                    }

                    const fallbackUser = {
                        id: sessionToUse.user.id,
                        email: sessionToUse.user.email,
                        name: sessionToUse.user.user_metadata?.name || 'Piloto',
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sessionToUse.user.user_metadata?.name || 'User')}&background=EA580C&color=fff&size=256`,
                        is_admin: sessionToUse.user.email === 'agm_jr@outlook.com',
                        level: 1,
                        xp: 0,
                        motorcycle: sessionToUse.user.user_metadata?.motorcycle || { brand: '', model: '', year: '' },
                        location: sessionToUse.user.user_metadata?.location || '',
                        details: sessionToUse.user.user_metadata?.details || { city: '', state: '' },
                        ...sessionToUse.user.user_metadata
                    };
                    setUser(prev => prev?.id === userId && prev.email ? prev : fallbackUser);
                    localStorage.setItem('jornada_biker_user', JSON.stringify(fallbackUser));
                }
                return;
            }

            if (userData) {
                const formattedUser = {
                    ...userData,
                    isAdmin: userData.is_admin,
                    routesCompleted: userData.routes_completed || 0,
                    eventsAttended: userData.events_attended || 0,
                    likedRoutes: userData.liked_routes || [],
                    favoriteRoutes: userData.favorite_routes || [],
                    likedEvents: userData.liked_events || [],
                    favoriteEvents: userData.favorite_events || [],
                    followingList: userData.following_list || [],
                    followersList: userData.followers_list || [],
                    following: (userData.following_list || []).length,
                    followers: (userData.followers_list || []).length,
                    clubBadge: userData.club_badge || '',
                    avatarFraming: userData.avatar_framing || { zoom: 1, x: 0, y: 0 },
                    badgeFraming: userData.badge_framing || { zoom: 1, x: 0, y: 0 },
                    motorcycle: userData.motorcycle || { brand: '', model: '', year: '' },
                    details: userData.details || { city: '', state: '' },
                    location: userData.location || '',
                    bio: userData.bio || '',
                    patches: userData.patches || [],
                    level: userData.level || 1,
                    xp: userData.xp || 0,
                    premium: userData.premium || false,
                    pixKey: userData.details?.pixKey || userData.pix_key || '',
                    pixQR: userData.details?.pixQR || userData.pix_qr || '',
                    completedRoutes: userData.completed_routes || [],
                    pastEvents: userData.past_events || [],
                    suggestedRoutes: userData.suggested_routes || []
                };
                setUser(formattedUser);
                localStorage.setItem('jornada_biker_user', JSON.stringify(formattedUser));

                // Initialize Push Notifications if on Android/iOS
                if (formattedUser?.id) {
                    NotificationService.initPush(formattedUser.id, (token) => {
                        // Update push_token in DB if different
                        if (formattedUser.push_token !== token) {
                            UserService.updateUser(formattedUser.id, { push_token: token });
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error in fetchAndSetUserData:", error);
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
            const location = city ? `${city}, ${state}` : '';
            const details = { city, state };

            const signupPromise = supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        motorcycle,
                        location,
                        details
                    }
                }
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Tempo limite de cadastro excedido (Rede lenta)")), 20000)
            );

            const { data, error } = await Promise.race([signupPromise, timeoutPromise]);

            if (error) throw error;

            if (data.user) {
                // Tenta criar o perfil na tabela 'users' imediatamente se tivermos uma sessão
                if (data.session) {
                    try {
                        // Tenta criar com um timeout curto
                        await Promise.race([
                            UserService.createUser({
                                id: data.user.id,
                                email,
                                name,
                                motorcycle,
                                location,
                                details
                            }),
                            new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 5000))
                        ]);
                    } catch (dbError) {
                        console.error("Erro ao criar perfil no banco (pode já existir ou timeout):", dbError);
                    }
                }

                if (data.session) {
                    notify("Conta criada com sucesso!", "success");
                    return true;
                } else {
                    notify("Verifique seu email para confirmar o cadastro.", "info");
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error("Register error:", error);
            notify(error.message || "Erro ao criar conta", "error");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Google Login error:", error);
            notify(error.message || "Erro ao entrar com Google", "error");
            return false;
        }
    };

    const resetPassword = async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            notify("Link de recuperação enviado para seu e-mail!", "success");
            return true;
        } catch (error) {
            console.error("Reset password error:", error);
            notify(error.message || "Erro ao enviar e-mail de recuperação", "error");
            return false;
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
            // Map frontend fields (camelCase) to DB fields (snake_case)
            const dbUpdates = {
                name: updatedData.name,
                avatar: updatedData.avatar,
                location: updatedData.location,
                motorcycle: updatedData.motorcycle,
                club_badge: updatedData.clubBadge,
                avatar_framing: updatedData.avatarFraming,
                badge_framing: updatedData.badgeFraming,
                // Explicitly allow persistence of like/favorite arrays
                liked_routes: updatedData.liked_routes || updatedData.likedRoutes,
                favorite_routes: updatedData.favorite_routes || updatedData.favoriteRoutes,
                liked_events: updatedData.liked_events || updatedData.likedEvents,
                favorite_events: updatedData.favorite_events || updatedData.favoriteEvents,
                past_events: updatedData.past_events || updatedData.pastEvents,
                completed_routes: updatedData.completed_routes || updatedData.completedRoutes,
                suggested_routes: updatedData.suggested_routes || updatedData.suggestedRoutes,
                pix_key: updatedData.pixKey,
                pix_qr: updatedData.pixQR,
                details: {
                    ...updatedData.details,
                    ...(updatedData.pixKey !== undefined ? { pixKey: updatedData.pixKey } : {}),
                    ...(updatedData.pixQR !== undefined ? { pixQR: updatedData.pixQR } : {})
                }
            };

            // Remove undefined fields to avoid overwriting with null
            Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

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

    const [processingCheckIns, setProcessingCheckIns] = useState(new Set());

    const checkInEvent = async (event) => {
        if (!user || !event?.id) return;

        const eventIdStr = String(event.id);

        // UI Guard: Already processing or already in pastEvents
        if (processingCheckIns.has(eventIdStr)) return;

        const currentPast = user.pastEvents || [];
        if (currentPast.some(pe => String(pe.id) === eventIdStr)) return;

        setProcessingCheckIns(prev => new Set(prev).add(eventIdStr));

        try {
            const updatedPast = [...currentPast, {
                id: event.id,
                title: event.title,
                date: new Date().toISOString()
            }];

            await updateProfile({ past_events: updatedPast });

            // Optimistic Update: Update local state immediately so UI reflects check-in
            setUser(prev => ({
                ...prev,
                pastEvents: updatedPast
            }));

            notify(`Check-in realizado! Você ganhou 50 XP.`, "success");
            await addXp(50, `Participação em evento: ${event.title}`);
        } finally {
            // Keep it locked for a bit to allow state sync
            setTimeout(() => {
                setProcessingCheckIns(prev => {
                    const next = new Set(prev);
                    next.delete(eventIdStr);
                    return next;
                });
            }, 3000);
        }
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
        const stored = localStorage.getItem('jornada_biker_active_route');
        return stored ? JSON.parse(stored) : null;
    });

    const startRoute = async (routeId, routeName) => {
        if (activeRoute) return false;

        try {
            const pos = await getCurrentPosition();
            const newActiveRoute = {
                id: routeId,
                name: routeName || 'Rota #' + routeId,
                startTime: Date.now(),
                startCoords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                status: 'in_progress'
            };

            setActiveRoute(newActiveRoute);
            localStorage.setItem('jornada_biker_active_route', JSON.stringify(newActiveRoute));
            return true;
        } catch (error) {
            notify("Ative a localização para iniciar a rota.", "error");
            return false;
        }
    };

    const endRoute = async () => {
        if (!activeRoute || !user) return null;

        try {
            const pos = await getCurrentPosition();
            const finishedRoute = {
                ...activeRoute,
                endTime: Date.now(),
                endCoords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                status: 'completed'
            };

            setActiveRoute(null);
            localStorage.removeItem('jornada_biker_active_route');

            // Increment routes completed in DB
            await UserService.updateUser(user.id, {
                routes_completed: (user.routesCompleted || 0) + 1
            });

            await addXp(100, `Rota concluída: ${activeRoute.name}`);
            await fetchAndSetUserData(user.id);

            return finishedRoute;
        } catch (error) {
            notify("Erro ao finalizar rota: localização necessária.", "error");
            return null;
        }
    };

    const abortRoute = () => {
        setActiveRoute(null);
        localStorage.removeItem('jornada_biker_active_route');
        notify("Rota cancelada.", "info");
    };

    return (
        <UserContext.Provider value={{
            user,
            isLoading,
            login,
            loginWithGoogle,
            resetPassword,
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
            checkInEvent,
            processingCheckIns,
            followUser
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}

