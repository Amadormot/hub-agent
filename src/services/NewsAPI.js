// NewsAPI - Now powered by Supabase
import { NewsServiceDB } from './NewsServiceDB';

const API_KEY = 'moto-hub-secret-key-2024';

// Helper to format relative time
const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
};

// Validate API Key for external agents
const validateAPIKey = (key) => {
    return key === API_KEY;
};

// Validate news data structure
const validateNewsData = (data) => {
    const required = ['title', 'summary', 'image'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // No minimum length restrictions for title/summary

    return true;
};

export const NewsAPI = {
    // GET - List all published news
    getNews: async (options = {}) => {
        try {
            const news = await NewsServiceDB.getNews(options);

            // Add formatted date
            return news.map(item => ({
                ...item,
                date: formatRelativeTime(item.created_at)
            }));
        } catch (error) {
            console.error('NewsAPI.getNews error:', error);
            return [];
        }
    },

    // POST - Create new news (requires auth)
    createNews: async (data, apiKey = null) => {
        try {
            // Validate API key if provided (for AI agents)
            if (apiKey && !validateAPIKey(apiKey)) {
                throw new Error('Invalid API key');
            }

            // Validate data
            validateNewsData(data);

            const newsData = {
                title: data.title,
                summary: data.summary,
                content: data.content || '',
                image: data.image,
                source: data.source || 'Moto Hub Admin',
                url: data.url || '#',
                author: apiKey ? 'ai-agent' : 'admin',
                published: data.published !== false
            };

            const newNews = await NewsServiceDB.createNews(newsData);
            return newNews;
        } catch (error) {
            console.error('NewsAPI.createNews error:', error);
            throw error;
        }
    },

    // PUT - Update existing news (requires auth)
    updateNews: async (id, data, apiKey = null) => {
        try {
            // Validate API key if provided
            if (apiKey && !validateAPIKey(apiKey)) {
                throw new Error('Invalid API key');
            }

            // Validate data if title/summary are being updated
            if (data.title || data.summary) {
                const existing = await NewsServiceDB.getNewsById(id);
                if (!existing) throw new Error('News not found');

                validateNewsData({ ...existing, ...data });
            }

            const updatedNews = await NewsServiceDB.updateNews(id, data);
            return updatedNews;
        } catch (error) {
            console.error('NewsAPI.updateNews error:', error);
            throw error;
        }
    },

    // DELETE - Remove news (requires auth)
    deleteNews: async (id, apiKey = null) => {
        try {
            // Validate API key if provided
            if (apiKey && !validateAPIKey(apiKey)) {
                throw new Error('Invalid API key');
            }

            const result = await NewsServiceDB.deleteNews(id);
            return result;
        } catch (error) {
            console.error('NewsAPI.deleteNews error:', error);
            throw error;
        }
    },

    // Utility - Validate API Key
    validateAPIKey,

    // Utility - Get API Key (for documentation/testing)
    getAPIKey: () => API_KEY
};
