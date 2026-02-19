import { supabase } from '../lib/supabase';

/**
 * Supabase Product Service
 * Handles all product-related database operations
 */

export const ProductServiceDB = {
    /**
     * Get all products
     */
    async getProducts(options = {}) {
        try {
            let query = supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            // Optional: Filter by active status
            if (!options.includeInactive) {
                query = query.eq('active', true);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    /**
     * Get single product by ID
     */
    async getProductById(id) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching product by ID:', error);
            return null;
        }
    },

    /**
     * Create product
     */
    async createProduct(productData) {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    name: productData.name,
                    price: productData.price,
                    image: productData.image,
                    category: productData.category,
                    link: productData.link,
                    description: productData.description || '',
                    specs: productData.specs || [],
                    source: productData.source || 'Manual',
                    active: true
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    /**
     * Update product
     */
    async updateProduct(id, updates) {
        try {
            const { data, error } = await supabase
                .from('products')
                .update({
                    ...updates,
                    // updated_at: new Date().toISOString() // If column exists
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    /**
     * Delete product
     */
    async deleteProduct(id) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true, id };
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
};
