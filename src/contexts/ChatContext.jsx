import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
    const { user } = useUser();
    const [conversations, setConversations] = useState(() => {
        const stored = localStorage.getItem('moto_hub_chats_v2');
        return stored ? JSON.parse(stored) : {};
    });

    const addReaction = (chatId, messageId, emoji) => {
        if (!user) return;
        const myId = user.id || user.email;

        setConversations(prev => {
            const thread = prev[chatId];
            if (!thread) return prev;

            const updatedMessages = thread.messages.map(msg => {
                if (msg.id !== messageId) return msg;

                const currentReactions = msg.reactions || {};
                const usersReacted = currentReactions[emoji] || [];

                let newUsersReacted;
                if (usersReacted.includes(myId)) {
                    // Remove reaction (toggle off)
                    newUsersReacted = usersReacted.filter(id => id !== myId);
                } else {
                    // Add reaction
                    newUsersReacted = [...usersReacted, myId];
                }

                const newReactions = { ...currentReactions };
                if (newUsersReacted.length > 0) {
                    newReactions[emoji] = newUsersReacted;
                } else {
                    delete newReactions[emoji];
                }

                return { ...msg, reactions: newReactions };
            });

            return {
                ...prev,
                [chatId]: {
                    ...thread,
                    messages: updatedMessages
                }
            };
        });
    };

    // Request Notification Permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Sync across tabs and handle incoming messages notification
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'moto_hub_chats_v2') {
                const newValue = e.newValue ? JSON.parse(e.newValue) : {};

                // Check for new messages to notify
                if (user && "Notification" in window && Notification.permission === "granted") {
                    const myId = user.id || user.email;

                    Object.values(newValue).forEach(newThread => {
                        const oldThread = conversations[newThread.id]; // assuming id is chatKey

                        // If logic to find thread ID in old conversations is complex due to key structure, 
                        // we rely on the fact that keys in localStorage object ARE the chatIds.
                    });

                    // Easier approach: iterate keys
                    Object.keys(newValue).forEach(chatId => {
                        const newThread = newValue[chatId];
                        const oldThread = conversations[chatId];

                        // If new message exists and I am not the sender
                        if (newThread.lastMessage &&
                            newThread.lastMessage.senderId !== myId &&
                            (!oldThread || newThread.lastMessage.id !== oldThread.lastMessage?.id)) {

                            new Notification(`Nova mensagem de ${newThread.participants[newThread.lastMessage.senderId]?.name}`, {
                                body: newThread.lastMessage.text || (newThread.lastMessage.image ? '📷 Imagem' : 'Nova mensagem'),
                                icon: '/pwa-192x192.png' // Ensure this exists or use a generic one
                            });
                        }
                    });
                }

                setConversations(newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [conversations, user]);

    // Persist to local storage with Error Handling
    useEffect(() => {
        try {
            localStorage.setItem('moto_hub_chats_v2', JSON.stringify(conversations));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                alert("Armazenamento cheio! Não foi possível salvar a última mensagem/imagem. Tente apagar conversas antigas.");
                console.error("LocalStorage Full:", error);
                // Optionally handle cleanup here
            }
        }
    }, [conversations]);

    const getChatId = (id1, id2) => {
        if (!id1 || !id2) return 'unknown';
        return [id1, id2].sort().join('_');
    };

    const sendMessage = (recipient, text, image = null, metadata = null) => {
        if (!user || !recipient) return;

        const myId = user.id || user.email;
        const recipientId = recipient.id || recipient.email;
        const chatId = getChatId(myId, recipientId);

        const newMessage = {
            id: Date.now(),
            senderId: myId,
            text,
            image,
            metadata, // e.g., { type: 'route', id: 'r1', name: '...', image: '...' }
            timestamp: new Date().toISOString(),
        };

        setConversations(prev => {
            const thread = prev[chatId] || {
                messages: [],
                participants: {
                    [myId]: { id: myId, name: user.name, avatar: user.avatar },
                    [recipientId]: { id: recipientId, name: recipient.name, avatar: recipient.avatar, clubBadge: recipient.clubBadge }
                },
                unreadCounts: { [myId]: 0, [recipientId]: 0 }
            };

            const newUnreadCounts = {
                ...(thread.unreadCounts || { [myId]: 0, [recipientId]: 0 }),
                [recipientId]: (thread.unreadCounts?.[recipientId] || 0) + 1
            };

            return {
                ...prev,
                [chatId]: {
                    ...thread,
                    id: chatId, // Ensure ID is saved for sync logic
                    participants: {
                        ...thread.participants,
                        [myId]: { id: myId, name: user.name, avatar: user.avatar },
                        [recipientId]: { id: recipientId, name: recipient.name, avatar: recipient.avatar, clubBadge: recipient.clubBadge }
                    },
                    messages: [...(thread.messages || []), newMessage],
                    lastMessage: newMessage,
                    unreadCounts: newUnreadCounts,
                    updatedAt: new Date().toISOString()
                }
            };
        });
    };

    const markAsRead = (chatId) => {
        if (!user) return;
        const myId = user.id || user.email;

        setConversations(prev => {
            const thread = prev[chatId];
            if (!thread) return prev;

            // Only update if there are unread messages
            if ((thread.unreadCounts?.[myId] || 0) === 0) return prev;

            return {
                ...prev,
                [chatId]: {
                    ...thread,
                    unreadCounts: {
                        ...thread.unreadCounts,
                        [myId]: 0
                    }
                }
            };
        });
    };

    const getConversation = (recipientId) => {
        if (!user) return [];
        const myId = user.id || user.email;
        const chatId = getChatId(myId, recipientId);
        return conversations[chatId]?.messages || [];
    };

    const getThreads = () => {
        if (!user) return [];
        const myId = user.id || user.email;

        return Object.values(conversations)
            .filter(thread => {
                return thread.participants && thread.participants[myId];
            })
            .map(thread => {
                const participantIds = Object.keys(thread.participants);
                const partnerId = participantIds.find(id => id !== myId) || participantIds[0];
                const partner = thread.participants[partnerId];

                return {
                    id: thread.id || getChatId(myId, partnerId),
                    partner,
                    lastMessage: thread.lastMessage,
                    unreadCount: thread.unreadCounts?.[myId] || 0,
                    updatedAt: thread.updatedAt
                };
            })
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    };

    // Calculate total unread messages for the current user
    const totalUnread = getThreads().reduce((acc, thread) => acc + thread.unreadCount, 0);

    return (
        <ChatContext.Provider value={{ conversations, sendMessage, getConversation, getThreads, markAsRead, totalUnread, addReaction }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    return useContext(ChatContext);
}
