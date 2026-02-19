import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationToast from '../components/NotificationToast';
import { AnimatePresence } from 'framer-motion';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [lastMessages, setLastMessages] = useState(new Map());

    const notify = useCallback((message, type = 'info') => {
        const now = Date.now();
        const lastSent = lastMessages.get(message);

        // Ignore duplicate messages within 2 seconds
        if (lastSent && now - lastSent < 2000) {
            return;
        }

        const id = `${now}-${Math.random().toString(36).substr(2, 9)}`;

        setLastMessages(prev => {
            const next = new Map(prev);
            next.set(message, now);
            return next;
        });

        setNotifications(prev => {
            // Limit to max 3 notifications to avoid clutter
            const next = [...prev, { id, message, type }];
            return next.slice(-3);
        });

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);

        // Cleanup lastMessages after 5 seconds
        setTimeout(() => {
            setLastMessages(prev => {
                const next = new Map(prev);
                if (next.get(message) === now) {
                    next.delete(message);
                }
                return next;
            });
        }, 5000);
    }, [lastMessages]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
                <AnimatePresence>
                    {notifications.map(notification => (
                        <NotificationToast
                            key={notification.id}
                            {...notification}
                            onClose={() => removeNotification(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};
