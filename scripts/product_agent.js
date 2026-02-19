// scripts/product_agent.js
// Run with: node scripts/product_agent.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env locally if not in GitHub Actions
if (!process.env.GITHUB_ACTIONS) {
    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
            console.log('📝 Loaded local .env file');
        }
    } catch (e) {
        console.warn('Could not load .env file', e);
    }
}

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; // Service Role key would be better for backend, but Anon works with RLS policies we set

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mercado Livre API Configuration
const ML_API_BASE = 'https://api.mercadolibre.com/sites/MLB/search';
const ML_ACCESS_TOKEN = process.env.ML_ACCESS_TOKEN; // Credential from Mercado Livre Developers
const KEYWORDS = ['capacete moto', 'luva motociclista', 'intercomunicador moto'];

async function fetchMercadoLivreProducts(query) {
    console.log(`🔍 Searching for "${query}" on Mercado Livre...`);
    try {
        const headers = {
            'User-Agent': 'MotoHubBot/1.0',
            'Accept': 'application/json'
        };

        // If we have an official token, use it to avoid blocks
        if (ML_ACCESS_TOKEN) {
            headers['Authorization'] = `Bearer ${ML_ACCESS_TOKEN}`;
        }

        const response = await fetch(`${ML_API_BASE}?q=${encodeURIComponent(query)}&limit=3`, { headers });

        if (!response.ok) {
            console.error(`❌ ML API Error: ${response.status} (Using Mock Data fallback)`);
            console.error(`   Tip: To use the official API, set ML_ACCESS_TOKEN in .env`);
            return getMockData(query);
        }

        const data = await response.json();
        console.log(`✅ Found ${data?.results?.length || 0} items for "${query}"`);
        return data.results || [];
    } catch (error) {
        console.error(`❌ Error fetching ML:`, error);
        return getMockData(query);
    }
}

// Fallback Mock Data generator
function getMockData(query) {
    console.log(`⚠️ Generating mock data for "${query}"...`);
    return [
        {
            title: `[Simulado] ${query} - Oferta Especial`,
            price: 299.90,
            thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_966606-MLB74020352033_012024-O.webp', // Generic image
            permalink: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            id: `mock-${Date.now()}-${Math.random()}`
        }
    ];
}

async function saveProduct(product) {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select();

    if (error) {
        console.error(`❌ Error saving ${product.name}:`, error.message);
    } else {
        console.log(`✅ Saved: ${product.name}`);
    }
}

// Helper to generate affiliate link
function generateAffiliateLink(originalLink) {
    if (AFFILIATE_PREFIX) {
        return `${AFFILIATE_PREFIX}${encodeURIComponent(originalLink)}`;
    }
    return originalLink;
}

async function runAgent() {
    console.log('🤖 Starting Product Agent...');

    for (const keyword of KEYWORDS) {
        const results = await fetchMercadoLivreProducts(keyword);

        for (const item of results) {
            // Map ML item to our schema
            const product = {
                name: item.title,
                price: `R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                image: item.thumbnail.replace('http://', 'https://'), // Ensure HTTPS
                category: 'Equipamentos', // Simplification for demo
                link: generateAffiliateLink(item.permalink), // Apply affiliate logic here
                description: `Produto encontrado no Mercado Livre via Agente. ID: ${item.id}`,
                specs: [],
                source: 'Mercado Livre Agent',
                active: true
            };

            // Check if already exists (simple duplicate check by link)
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .eq('link', product.link)
                .single();

            if (!existing) {
                await saveProduct(product);
            } else {
                console.log(`Start skipping ${product.name} (already exists)`);
            }
        }
    }

    console.log('🏁 Agent finished.');
}

runAgent();
