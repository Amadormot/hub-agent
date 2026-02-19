// ProductService - Simulates an AI Agent searching for affiliate products
// In a real scenario, this would connect to Amazon Product Advertising API, Magalu API, etc.

const MOCK_SEARCH_RESULTS = {
    'capacete': [
        {
            id: 'agent-1',
            name: 'Capacete Norisk Razor',
            price: 'R$ 649,90',
            category: 'Equipamentos',
            image: 'https://images.unsplash.com/photo-1621066023253-7a13673aa6f2?q=80&w=400&auto=format&fit=crop',
            link: 'https://www.google.com/search?q=Capacete+Norisk+Razor',
            description: 'Design aerodinâmico e grafismos modernos. Ótimo custo-benefício.',
            specs: ['ABS de alta pressão', 'Viseira troca rápida', 'Forro hipoalergênico'],
            source: 'Amazon',
            type: 'ad'
        },
        {
            id: 'agent-2',
            name: 'Capacete ASX Eagle',
            price: 'R$ 499,00',
            category: 'Equipamentos',
            image: 'https://images.unsplash.com/photo-1542223806-03f4730623f9?q=80&w=400&auto=format&fit=crop',
            link: 'https://www.google.com/search?q=Capacete+ASX+Eagle',
            description: 'Conforto e segurança para o dia a dia.',
            specs: ['Entradas de ar', 'Bavete e narigueira', 'Fecho micrométrico'],
            source: 'Magalu',
            type: 'ad'
        }
    ],
    'luva': [
        {
            id: 'agent-3',
            name: 'Luva X11 Fit X',
            price: 'R$ 99,00',
            category: 'Equipamentos',
            image: 'https://images.unsplash.com/photo-1626359570188-46700ab6134a?q=80&w=400&auto=format&fit=crop',
            link: 'https://www.google.com/search?q=Luva+X11+Fit+X',
            description: 'Luva leve e flexível, ideal para o verão.',
            specs: ['Tecido poliéster', 'Reforço na palma', 'Touchscreen'],
            source: 'Mercado Livre',
            type: 'ad'
        }
    ],
    'intercomunicador': [
        {
            id: 'agent-4',
            name: 'Intercomunicador Ejeas V6 Pro',
            price: 'R$ 289,00',
            category: 'Acessórios',
            image: 'https://images.unsplash.com/photo-1596452278453-61b6b5536531?q=80&w=400&auto=format&fit=crop',
            link: 'https://www.google.com/search?q=Intercomunicador+Ejeas+V6+Pro',
            description: 'Converse com até 6 motociclistas. Bateria de longa duração.',
            specs: ['Alcance 1200m', 'Bluetooth 5.1', 'À prova d\'água IP65'],
            source: 'AliExpress',
            type: 'ad'
        }
    ]
};



/**
 * =================================================================================
 *  🤖 AGENTE COMPRADOR (SALES AGENT) - INTEGRAÇÃO DE BANCO DE DADOS
 * =================================================================================
 * 
 * Para transformar este simulador em um Agente Real que salva os produtos encontrados
 * no banco de dados do Supabase, utilize a API global `window.ProductAPI`.
 * 
 * 1. Chave de API:
 *    const API_KEY = "moto-hub-secret-key-2024";
 * 
 * 2. Método de Criação:
 *    await window.ProductAPI.createProduct(produto, API_KEY);
 * 
 * 3. Estrutura do Objeto Produto:
 *    {
 *      name: "Nome do Produto",           // Obrigatório
 *      price: "R$ 00,00",                 // Obrigatório (Formatado)
 *      image: "https://...",              // Obrigatório (URL)
 *      category: "Equipamentos",          // Obrigatório
 *      link: "https://afiliado...",       // Link para compra
 *      description: "Descrição breve...", // Opcional
 *      specs: ["Spec 1", "Spec 2"],       // Opcional (Array)
 *      source: "Nome do Agente"           // Opcional (Default: 'AI Agent')
 *    }
 * 
 * =================================================================================
 */

const DEFAULT_RECOMMENDATIONS = [
    ...MOCK_SEARCH_RESULTS['capacete'],
    ...MOCK_SEARCH_RESULTS['intercomunicador']
];

export const ProductService = {
    // Simulate searching for products based on keywords
    searchProducts: async (query) => {
        console.log(`[Agent] Searching products for: "${query}"...`);

        return new Promise(resolve => {
            setTimeout(() => {
                const keyword = query.toLowerCase();
                const results = MOCK_SEARCH_RESULTS[keyword] || [];

                // If no specific results, return some random defaults if query is generic
                if (results.length === 0 && (keyword === 'ofertas' || keyword === 'recomendados')) {
                    resolve(DEFAULT_RECOMMENDATIONS);
                } else {
                    resolve(results);
                }
            }, 1000 + Math.random() * 1000); // Random delay 1-2s
        });
    },

    // Simulate an "Auto-Pilot" mode that finds daily deals
    getDailyDeals: async () => {
        console.log("[Agent] Fetching daily deals...");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(DEFAULT_RECOMMENDATIONS);
            }, 1500);
        });
    }
};
