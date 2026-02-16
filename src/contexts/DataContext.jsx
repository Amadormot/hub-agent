import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { routesData as initialRoutes, eventsData as initialEvents, productsData as initialProducts, mockUsers } from '../data/mockData';
import { NewsAPI } from '../services/NewsAPI';

const DataContext = createContext();

export function DataProvider({ children }) {
    const [routes, setRoutes] = useState(() => {
        const stored = localStorage.getItem('moto_hub_routes');
        return stored ? JSON.parse(stored) : initialRoutes;
    });

    const [events, setEvents] = useState(() => {
        const stored = localStorage.getItem('moto_hub_events');
        return stored ? JSON.parse(stored) : initialEvents;
    });


    const [products] = useState(initialProducts);
    const [sales, setSales] = useState(() => {
        const stored = localStorage.getItem('moto_hub_sales');
        return stored ? JSON.parse(stored) : [];
    });

    // Automation Data State
    const [news, setNews] = useState([]);
    const [affiliates, setAffiliates] = useState([]);
    const [isLoadingAutomation, setIsLoadingAutomation] = useState(true);

    // Fetch Automation Data (News from new API)
    useEffect(() => {
        const fetchAutomationData = async () => {
            try {
                // Use new NewsAPI for news (only published)
                const newsData = await NewsAPI.getNews();
                console.log("[DataContext] News fetched from Supabase:", newsData?.length || 0, "items", newsData);
                setNews(newsData);

                // Keep affiliates from old service for now
                const { NewsService } = await import('../services/NewsService');
                const affiliatesData = await NewsService.getAffiliates();
                setAffiliates(affiliatesData);
            } catch (error) {
                console.error("[DataContext] Failed to fetch automation data:", error);
            } finally {
                setIsLoadingAutomation(false);
            }
        };

        fetchAutomationData();
    }, []);

    useEffect(() => {
        localStorage.setItem('moto_hub_routes', JSON.stringify(routes));
    }, [routes]);

    useEffect(() => {
        localStorage.setItem('moto_hub_events', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        localStorage.setItem('moto_hub_sales', JSON.stringify(sales));
    }, [sales]);

    const addRoute = (newRoute) => {
        setRoutes(prev => [{ ...newRoute, id: Date.now(), likes: 0 }, ...prev]);
    };

    const addEvent = (newEvent) => {
        setEvents(prev => [{ ...newEvent, id: Date.now(), likes: 0 }, ...prev]);
    };

    const registerSale = (item, type = 'product') => {
        let saleData = {};

        if (type === 'product') {
            saleData = {
                id: Date.now(),
                type: 'Produto',
                productName: item.name,
                price: item.price,
                date: new Date().toLocaleString('pt-BR'),
                commission: (parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.')) * 0.10).toFixed(2)
            };
        } else if (type === 'event_highlight') {
            const cost = Number(item.totalCost) || 0;
            saleData = {
                id: Date.now(),
                type: 'Destaque Evento',
                productName: `Destaque: ${item.title}`,
                price: `R$ ${cost.toFixed(2).replace('.', ',')}`,
                date: new Date().toLocaleString('pt-BR'),
                commission: cost.toFixed(2) // 100% revenue for ads, no split
            };
        }

        setSales(prev => [saleData, ...prev]);
    };

    const joinEvent = (eventId, user) => {
        setEvents(prevEvents => prevEvents.map(event => {
            if (event.id === eventId) {
                const attendees = event.attendees || [];
                // Check if already attending
                if (attendees.some(a => String(a.id) === String(user.id))) {
                    return event; // No change
                }
                return {
                    ...event,
                    attendees: [...attendees, { id: user.id, name: user.name, avatar: user.avatar }]
                };
            }
            return event;
        }));
    };

    const updateRouteLikes = (routeId, increment) => {
        setRoutes(prevRoutes => prevRoutes.map(route => {
            if (String(route.id) === String(routeId)) {
                return { ...route, likes: (route.likes || 0) + (increment ? 1 : -1) };
            }
            return route;
        }));
    };

    // Unified User List (Mock + Creators + Self)
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        const userMap = new Map();

        // 1. Add static mock users
        mockUsers.forEach(u => userMap.set(String(u.id), u));

        // 2. Add creators from routes
        routes.forEach(r => {
            if (r.createdBy && r.createdBy.id) {
                const id = String(r.createdBy.id);
                if (!userMap.has(id)) userMap.set(id, r.createdBy);
            }
        });

        // 3. Add creators from events
        events.forEach(e => {
            if (e.createdBy && e.createdBy.id) {
                const id = String(e.createdBy.id);
                if (!userMap.has(id)) userMap.set(id, e.createdBy);
            }
        });

        setAllUsers(Array.from(userMap.values()));
    }, [routes, events]);

    // Sorting Logic
    const sortedRoutes = useMemo(() => {
        // Sort by Likes (Descending)
        return [...routes].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }, [routes]);

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            // 1. Priority: Premium/Highlight
            if (a.premium && !b.premium) return -1;
            if (!a.premium && b.premium) return 1;

            // 2. Priority: Likes (Descending)
            return (b.likes || 0) - (a.likes || 0);
        });
    }, [events]);

    return (
        <DataContext.Provider value={{
            routes: sortedRoutes,
            events: sortedEvents,
            products,
            sales,
            news,
            affiliates,
            allUsers,
            isLoadingAutomation,
            addRoute,
            addEvent,
            registerSale,
            joinEvent,
            updateRouteLikes
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    return useContext(DataContext);
}
