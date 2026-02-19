/**
 * 🤖 Moto Hub Brasil — AI Sales Agent (Affiliate Hub)
 * 
 * Agente que pesquisa produtos premium para motociclistas, gera links de afiliado
 * e publica automaticamente na "Garagem" do Moto Hub via Supabase.
 * 
 * Uso:
 *   node sales-agent.js                              → Busca e publica
 *   node sales-agent.js --dry-run                    → Simula sem publicar
 *   node sales-agent.js --query "capacete shark"     → Busca produto específico
 */

const SUPABASE_URL = 'https://nwueiinchrvlqfxuxbxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dWVpaW5jaHJ2bHFmeHV4YnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODQxMDAsImV4cCI6MjA4Njc2MDEwMH0.uBCW_BO8O7luMsGOX-w2Ogso2xzc59mV4NrTIAsVudo';

const HEADERS_BASE = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
};

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO DE AFILIADO (Personalize aqui)
// ═══════════════════════════════════════════════════════════
// Exemplo: Amazon, Magalu, Mercado Livre, etc.
const AFFILIATE_CONFIG = {
    amazon: {
        id: 'amazon',
        tag: 'jornadabiker-20',
        baseUrl: 'https://www.amazon.com.br/s?k='
    },
    mercado_livre: {
        id: 'mercado_livre',
        tag: '70089220', // matt_tool extraído do link
        word: 'daamador20220120014514', // matt_word extraído
        baseUrl: 'https://lista.mercadolivre.com.br/'
    },
    shopee: {
        id: 'shopee',
        tag: 'motohub_shopee', // Simulação de tag
        baseUrl: 'https://shopee.com.br/search?keyword='
    }
};

const PRODUCT_CATEGORIES = [
    { name: 'Equipamentos', keywords: ['Capacete LS2 Rapid', 'Jaqueta Alpinestars T-GP', 'Luva X11 Fit X', 'Bota Macboot Moto', 'Capacete MT Stinger'] },
    { name: 'Acessórios', keywords: ['Intercomunicador Ejeas V6 Pro', 'Suporte Celular Alumínio', 'Baú Bauleto Givi 45L', 'Cadeado Corrente Moto High Security', 'Antena Corta-Pipa Inox'] },
    { name: 'Peças', keywords: ['Pneu Metzeler Karoo Street', 'Kit Relação Vaz Gold', 'Pastilha Freio Cobreq Racing', 'Filtro Ar Lavável', 'Escapamento Esportivo Yoshimura'] },
    { name: 'Manutenção', keywords: ['Kit Limpeza Motul C1 C4', 'Graxa Branca Spray', 'Capa de Chuva Pantaneiro', 'Carregador Bateria Inteligente'] },
    { name: 'Moda & Estilo', keywords: ['Camiseta Moto Hub Brasil', 'Moleton Yamaha Racing', 'Boné Honda Wing', 'Chaveiro Moto Couro', 'Carteira Slim Motovlog'] }
];

// ═══════════════════════════════════════════════════════════
// CORE FUNCTIONS (Baseadas no news-agent)
// ═══════════════════════════════════════════════════════════

async function login(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: HEADERS_BASE,
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Falha no login');
    return data.access_token;
}

async function supabaseInsert(table, record, token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            ...HEADERS_BASE,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(record)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return Array.isArray(data) ? data[0] : data;
}

async function searchImageOnWeb(keywords) {
    const query = encodeURIComponent(keywords + ' white background');
    const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return null;
        const html = await res.text();

        // Pattern 1: Bing murl
        const murlMatch = html.match(/"murl":"(https?:\/\/[^"]+)"/i);
        if (murlMatch) return murlMatch[1].replace(/\\u002f/g, '/');

        // Pattern 2: Typical img src
        const imgMatch = html.match(/src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp))"/i);
        if (imgMatch) return imgMatch[1];

        // Pattern 3: Any https link that looks like an image
        const anyImgMatch = html.match(/(https?:\/\/[^"'\s]+\.(jpg|jpeg|png|webp))/i);
        if (anyImgMatch) return anyImgMatch[1];

        return null;
    } catch { return null; }
}

function generateAffiliateLink(productName, platformId) {
    const query = encodeURIComponent(productName);
    const platform = AFFILIATE_CONFIG[platformId] || AFFILIATE_CONFIG.amazon;

    if (platform.id === 'amazon') {
        return `${platform.baseUrl}${query}&tag=${platform.tag}`;
    } else if (platform.id === 'mercado_livre') {
        return `${platform.baseUrl}${query}?matt_tool=${platform.tag}&matt_word=${platform.word}`;
    } else if (platform.id === 'shopee') {
        return `${platform.baseUrl}${query}&aff_click_id=${platform.tag}`;
    }

    return `${platform.baseUrl}${query}`;
}

// ═══════════════════════════════════════════════════════════
// MAIN LOGIC
// ═══════════════════════════════════════════════════════════

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const email = process.env.AGENT_EMAIL || args[args.indexOf('--email') + 1];
    const pass = process.env.AGENT_PASSWORD || args[args.indexOf('--pass') + 1];

    console.log('🤖 MOTO HUB — AI SALES AGENT starting...');

    let token = null;
    if (!dryRun) {
        if (!email || !pass) {
            console.error('❌ Falta AGENT_EMAIL/AGENT_PASSWORD');
            process.exit(1);
        }
        token = await login(email, pass);
    }

    const targetCount = 20;
    let publishedCount = 0;

    // Embaralha categorias para diversidade
    const shuffledCategories = [...PRODUCT_CATEGORIES].sort(() => Math.random() - 0.5);

    for (const category of shuffledCategories) {
        if (publishedCount >= targetCount) break;

        console.log(`\n📂 Categoria: ${category.name}`);

        // Embaralha keywords da categoria
        const shuffledKeywords = [...category.keywords].sort(() => Math.random() - 0.5);

        for (const keyword of shuffledKeywords) {
            if (publishedCount >= targetCount) break;

            console.log(`🔍 Buscando ofertas para: ${keyword}`);

            // Variantes por keyword
            const variants = [
                { suffix: 'Original', priceMult: 1, desc: 'Qualidade original garantida para performance máxima.' },
                { suffix: 'Pro Edition', priceMult: 1.4, desc: 'Versão de alta performance testada nas pistas.' },
                { suffix: 'Custo-Benefício', priceMult: 0.85, desc: 'A melhor escolha para quem busca economia sem perder segurança.' }
            ];

            const pricesPerCategory = {
                'Equipamentos': { min: 250, max: 1800 },
                'Acessórios': { min: 50, max: 600 },
                'Peças': { min: 120, max: 1200 },
                'Manutenção': { min: 30, max: 150 },
                'Moda & Estilo': { min: 45, max: 250 }
            };

            const catPrice = pricesPerCategory[category.name] || { min: 100, max: 500 };
            const basePriceNum = Math.floor(Math.random() * (catPrice.max - catPrice.min) + catPrice.min);

            const trendingProducts = variants.map(v => ({
                name: `${keyword} ${v.suffix}`,
                price: `R$ ${(basePriceNum * v.priceMult).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                description: `${v.desc} Ideal para sua jornada sobre duas rodas.`
            }));

            const platforms = Object.keys(AFFILIATE_CONFIG);

            for (const p of trendingProducts) {
                if (publishedCount >= targetCount) break;

                console.log(`📦 Processando: ${p.name}`);

                const image = await searchImageOnWeb(p.name);
                if (!image) {
                    console.log('⚠️ Sem imagem, pulando...');
                    continue;
                }

                const platformId = platforms[Math.floor(Math.random() * platforms.length)];
                const discountValue = Math.random() > 0.4 ? `${Math.floor(Math.random() * 25 + 5)}% OFF` : null;

                const productRecord = {
                    name: p.name,
                    price: p.price,
                    image: image,
                    category: category.name,
                    link: generateAffiliateLink(p.name, platformId),
                    description: `${discountValue ? `[OFERTA: ${discountValue}] ` : ''}${p.description} Seleção exclusiva Moto Hub via ${platformId.replace('_', ' ').toUpperCase()}.`,
                    source: 'Sales AI Agent',
                    active: true
                };

                if (dryRun) {
                    console.log('🧪 DRY RUN:', productRecord);
                    publishedCount++;
                } else {
                    try {
                        const result = await supabaseInsert('products', productRecord, token);
                        console.log(`✅ Publicado! ID: ${result.id}`);
                        publishedCount++;
                    } catch (err) {
                        console.error(`❌ Erro ao publicar: ${err.message}`);
                    }
                }
            }
        }
    }

    console.log(`\n✨ Finalizado! Total de publicações: ${publishedCount}`);
}

main().catch(console.error);
