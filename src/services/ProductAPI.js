import { ProductServiceDB } from './ProductServiceDB';

const API_KEY = 'moto-hub-secret-key-2024'; // Same key for simplicity

// Validate API Key for external agents
const validateAPIKey = (key) => {
    return key === API_KEY;
};

// Validate product data structure
const validateProductData = (data) => {
    const required = ['name', 'price', 'image', 'category'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
};

export const ProductAPI = {
    // GET - List all products
    getProducts: async (options = {}) => {
        return await ProductServiceDB.getProducts(options);
    },

    // POST - Create new product (requires auth/key)
    createProduct: async (data, apiKey = null) => {
        // Validate API key if provided (for AI agents or external calls)
        if (apiKey && !validateAPIKey(apiKey)) {
            throw new Error('Invalid API key');
        }

        // Validate data
        validateProductData(data);

        const productData = {
            ...data,
            source: apiKey ? 'AI Agent' : (data.source || 'Manual')
        };

        return await ProductServiceDB.createProduct(productData);
    },

    // PUT - Update existing product
    updateProduct: async (id, data, apiKey = null) => {
        if (apiKey && !validateAPIKey(apiKey)) {
            throw new Error('Invalid API key');
        }

        return await ProductServiceDB.updateProduct(id, data);
    },

    // DELETE - Remove product
    deleteProduct: async (id, apiKey = null) => {
        if (apiKey && !validateAPIKey(apiKey)) {
            throw new Error('Invalid API key');
        }

        return await ProductServiceDB.deleteProduct(id);
    },

    // Utility
    validateAPIKey
};

// Expose to window for external agents/console
window.ProductAPI = ProductAPI;
