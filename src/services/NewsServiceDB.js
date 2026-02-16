import { supabase } from '../lib/supabase';

/**
 * Supabase News Service
 * Handles all news-related database operations
 */

export const NewsServiceDB = {
    /**
     * Get all published news
     */
    async getNews(options = {}) {
        try {
            let query = supabase
                .from('news')
                .select('*')
                .order('created_at', { ascending: false });

            // Filter by published status
            if (!options.includeUnpublished) {
                query = query.eq('published', true);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching news:', error);
            return [];
        }
    },

    /**
     * Get single news by ID
     */
    async getNewsById(id) {
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching news by ID:', error);
            return null;
        }
    },

    /**
     * Create news
     */
    async createNews(newsData) {
        try {
            const { data, error } = await supabase
                .from('news')
                .insert([{
                    title: newsData.title,
                    summary: newsData.summary,
                    content: newsData.content || '',
                    image: newsData.image,
                    source: newsData.source || 'Moto Hub Admin',
                    url: newsData.url || '#',
                    author: newsData.author || 'admin',
                    published: newsData.published !== false
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating news:', error);
            throw error;
        }
    },

    /**
     * Update news
     */
    async updateNews(id, updates) {
        try {
            const { data, error } = await supabase
                .from('news')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating news:', error);
            throw error;
        }
    },

    /**
     * Delete news
     */
    async deleteNews(id) {
        try {
            const { error } = await supabase
                .from('news')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true, id };
        } catch (error) {
            console.error('Error deleting news:', error);
            throw error;
        }
    },

    /**
     * Toggle published status
     */
    async togglePublished(id) {
        try {
            // Get current status
            const news = await this.getNewsById(id);
            if (!news) throw new Error('News not found');

            // Toggle
            return await this.updateNews(id, { published: !news.published });
        } catch (error) {
            console.error('Error toggling published status:', error);
            throw error;
        }
    }
};
