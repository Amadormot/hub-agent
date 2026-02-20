import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { routesData as initialRoutes, eventsData as initialEvents, productsData as initialProducts, mockUsers } from '../data/mockData';
import { NewsAPI } from '../services/NewsAPI';
import NotificationService from '../services/NotificationService';

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


    // [UPDATED] Products now come from Supabase via ProductAPI
    const [products, setProducts] = useState(initialProducts); // Start with mock, then replace

    const [sales, setSales] = useState(() => {
        const stored = localStorage.getItem('moto_hub_sales');
        return stored ? JSON.parse(stored) : [];
    });

    // Automation Data State
    const [news, setNews] = useState([]);
    const [affiliates, setAffiliates] = useState([]);
    const [isLoadingAutomation, setIsLoadingAutomation] = useState(true);

    // Fetch All Data (News + Products)
    const refreshData = async () => {
        setIsLoadingAutomation(true);
        try {
            // 1. News
            const newsData = await NewsAPI.getNews();
            setNews(newsData);

            // 2. Real Products from DB
            const { ProductAPI } = await import('../services/ProductAPI');
            const dbProducts = await ProductAPI.getProducts();

            if (dbProducts && dbProducts.length > 0) {
                console.log("[DataContext] Products fetched from Supabase:", dbProducts.length);
                setProducts(dbProducts);
            } else {
                // Fallback to initialProducts only if DB is empty
                setProducts(initialProducts);
            }

            // 3. Affiliates (Only from DB products now if we want strict affiliation)
            // But let's keep the NewsService ones if they exist
            const { NewsService } = await import('../services/NewsService');
            const affiliatesData = await NewsService.getAffiliates();

            // Filter to only show products with affiliate source in the unified state
            setAffiliates(affiliatesData || []);
            // 4. All Users from DB
            const { UserService } = await import('../services/UserService');
            const dbUsers = await UserService.getAllUsers();
            if (dbUsers && dbUsers.length > 0) {
                setDbUsers(dbUsers);
            }
        } catch (error) {
            console.error("[DataContext] Failed to fetch data:", error);
        } finally {
            setIsLoadingAutomation(false);
        }
    };

    useEffect(() => {
        refreshData();
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

    // Product persistence via API is handled in add/update functions now, 
    // so we don't need a useEffect for localStorage['moto_hub_products'] anymore.

    const addRoute = (newRoute) => {
        setRoutes(prev => [{ ...newRoute, id: Date.now(), likes: 0 }, ...prev]);
    };

    const addEvent = (newEvent) => {
        const eventWithId = {
            ...newEvent,
            id: Date.now(),
            likes: 0,
            paymentStatus: newEvent.premium ? 'pending' : 'paid' // Premium starts pending
        };
        setEvents(prev => [eventWithId, ...prev]);
    };

    const addProduct = async (newProduct) => {
        // Optimistic UI update
        const tempId = Date.now();
        const optimisticProduct = { ...newProduct, id: tempId };
        setProducts(prev => [optimisticProduct, ...prev]);

        try {
            const { ProductAPI } = await import('../services/ProductAPI');
            const savedProduct = await ProductAPI.createProduct(newProduct);

            // Replace optimistic with real DB data
            setProducts(prev => prev.map(p => p.id === tempId ? savedProduct : p));
        } catch (error) {
            console.error("Failed to add product to DB:", error);
            // Revert on error (optional implementation)
        }
    };

    const updateProduct = async (updatedProduct) => {
        // Optimistic UI update
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

        try {
            const { ProductAPI } = await import('../services/ProductAPI');
            await ProductAPI.updateProduct(updatedProduct.id, updatedProduct);
        } catch (error) {
            console.error("Failed to update product in DB:", error);
        }
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
                commission: (parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.')) * 0.10).toFixed(2),
                status: 'completed'
            };
        } else if (type === 'event_highlight') {
            const cost = Number(item.totalCost) || 0;
            saleData = {
                id: Date.now(),
                type: 'Destaque Evento',
                productName: `Destaque: ${item.title}`,
                price: `R$ ${cost.toFixed(2).replace('.', ',')}`,
                date: new Date().toLocaleString('pt-BR'),
                commission: cost.toFixed(2), // 100% revenue for ads, no split
                status: 'pending', // Premium ads start as pending
                relatedEventId: item.id // Keep track of which event this is for
            };
        }

        setSales(prev => [saleData, ...prev]);
    };

    const confirmPayment = (saleId) => {
        // 1. Find the sale
        const sale = sales.find(s => s.id === saleId);
        if (!sale) return;

        // 2. Update sale status
        setSales(prev => prev.map(s =>
            s.id === saleId ? { ...s, status: 'completed' } : s
        ));

        // 3. Update related event if applicable
        if (sale.relatedEventId) {
            setEvents(prev => prev.map(event =>
                String(event.id) === String(sale.relatedEventId)
                    ? { ...event, paymentStatus: 'paid' }
                    : event
            ));
        }
    };

    const joinEvent = (eventId, user) => {
        setEvents(prevEvents => prevEvents.map(event => {
            if (event.id === eventId) {
                const attendees = event.attendees || [];
                // Check if already attending
                if (attendees.some(a => String(a.id) === String(user.id))) {
                    return event; // No change
                }

                // Schedule local reminder for event
                NotificationService.scheduleEventReminder(event);

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
                return { ...route, likes: Math.max(0, (route.likes || 0) + (increment ? 1 : -1)) };
            }
            return route;
        }));
    };

    const updateEventLikes = (eventId, increment) => {
        setEvents(prevEvents => prevEvents.map(event => {
            if (String(event.id) === String(eventId)) {
                return { ...event, likes: Math.max(0, (event.likes || 0) + (increment ? 1 : -1)) };
            }
            return event;
        }));
    };

    // Unified User List (Mock + Creators + Self + Admin)
    const [allUsers, setAllUsers] = useState([]);
    const [dbUsers, setDbUsers] = useState([]);
    const [adminUser, setAdminUser] = useState(null);

    // Fetch Admin User data for payments
    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const { UserService } = await import('../services/UserService');
                const adminData = await UserService.getUserByEmail('agm_jr@outlook.com');
                if (adminData) {
                    setAdminUser({
                        ...adminData,
                        isAdmin: true,
                        pixKey: adminData.details?.pixKey,
                        pixQR: adminData.details?.pixQR
                    });
                }
            } catch (error) {
                console.error("[DataContext] Failed to fetch admin data:", error);
            }
        };
        fetchAdmin();
    }, []);

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

        // 4. Add users from DB
        dbUsers.forEach(u => {
            const id = String(u.id);
            if (!userMap.has(id)) userMap.set(id, u);
        });

        // 5. Add admin user if found
        if (adminUser) {
            userMap.set(String(adminUser.id), adminUser);
        }

        setAllUsers(Array.from(userMap.values()));
    }, [routes, events, adminUser, dbUsers]);

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
            addProduct,
            updateProduct,
            registerSale,
            confirmPayment,
            joinEvent,
            updateRouteLikes,
            updateEventLikes,
            refreshData
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    return useContext(DataContext);
}
