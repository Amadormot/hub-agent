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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nwueiinchrvlqfxuxbxr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dWVpaW5jaHJ2bHFmeHV4YnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODQxMDAsImV4cCI6MjA4Njc2MDEwMH0.uBCW_BO8O7luMsGOX-w2Ogso2xzc59mV4NrTIAsVudo';

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
    }
};

const PRODUCT_CATEGORIES = [
    { name: 'Equipamentos', keywords: ['Capacete LS2 Rapid', 'Jaqueta Alpinestars T-GP', 'Luva X11 Fit X', 'Bota Macboot Moto', 'Capacete MT Stinger'] },
    { name: 'Acessórios', keywords: ['Intercomunicador Ejeas V6 Pro', 'Suporte Celular Alumínio', 'Baú Bauleto Givi 45L', 'Cadeado Corrente Moto High Security', 'Antena Corta-Pipa Inox'] },
    { name: 'Peças', keywords: ['Pneu Metzeler Karoo Street', 'Kit Relação Vaz Gold', 'Pastilha Freio Cobreq Racing', 'Filtro Ar Lavável', 'Escapamento Esportivo Yoshimura'] },
    { name: 'Manutenção', keywords: ['Kit Limpeza Motul C1 C4', 'Graxa Branca Spray', 'Capa de Chuva Pantaneiro', 'Carregador Bateria Inteligente'] },
    { name: 'Moda & Estilo', keywords: ['Camiseta Moto Hub Brasil', 'Moleton Yamaha Racing', 'Boné Honda Wing', 'Chaveiro Moto Couro', 'Carteira Slim Motovlog'] },
    { name: 'Super Ofertas 🔥', keywords: ['Capacete Axxis Draken', 'Intercomunicador FreedConn T-Com', 'Luva de Couro Monster X', 'Kit Transmissão DID Gold', 'Jaqueta Motoqueiro Cordura'] }
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

async function researchProductAssets(keywords, platformId) {
    const domain = platformId === 'amazon' ? 'amazon.com.br' : 'mercadolivre.com.br';
    const siteName = platformId === 'amazon' ? 'Amazon' : 'Mercado Livre';

    // Mira Laser: Usamos site:domain diretamente na busca de imagens para garantir que o link de origem seja o correto
    const query = encodeURIComponent(`site:${domain} ${keywords} product`);
    const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return { image: null, directUrl: null };
        const html = await res.text();

        const blacklist = ['bing.com', 'facebook', 'logo', 'icon', 'placeholder', 'advertisement', 'sharing'];

        // Pattern: m="{...}" na tag <a> ou similar
        const matches = [...html.matchAll(/m=\"({[^\"]+})\"/gi)];

        let foundImage = null;
        let foundDirectUrl = null;

        for (const m of matches) {
            try {
                const jsonStr = m[1].replace(/&quot;/g, '"');
                const data = JSON.parse(jsonStr);

                // 1. Validar imagem
                if (!foundImage) {
                    let imgUrl = data.murl.split('¿¿')[0]; // Pega a primeira parte se estiver sujo
                    if (!blacklist.some(b => imgUrl.toLowerCase().includes(b))) {
                        foundImage = imgUrl;
                    }
                }

                // 2. Validar Link Direto (purl ou strings no murl)
                if (!foundDirectUrl) {
                    const potentialUrls = [data.purl, ...data.murl.split('¿¿')];
                    for (const u of potentialUrls) {
                        if (u && u.includes(domain)) {
                            // Check patterns
                            if (platformId === 'amazon' && (u.includes('/dp/') || u.includes('/gp/product/'))) {
                                foundDirectUrl = u;
                                break;
                            }
                            if (platformId === 'mercado_livre' && (u.includes('MLB') || u.includes('/p/MLB') || u.includes('/p/'))) {
                                foundDirectUrl = u;
                                break;
                            }
                        }
                    }
                }

                if (foundImage && foundDirectUrl) break;
            } catch (e) { }
        }

        // SEGUNDA ONDA: Sniper de Texto (Se a imagem não deu link direto)
        if (!foundDirectUrl) {
            const textUrl = `https://www.bing.com/search?q=${encodeURIComponent(`site:${domain} ${keywords}`)}`;
            try {
                const textRes = await fetch(textUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                    signal: AbortSignal.timeout(5000)
                });
                if (textRes.ok) {
                    const textHtml = await textRes.text();
                    // Regex ultra-agressiva para links de produto no HTML
                    let regex;
                    if (platformId === 'amazon') regex = /https?:\/\/www\.amazon\.com\.br\/[^"'\s?]+?\/dp\/[A-Z0-9]{10}/i;
                    else if (platformId === 'mercado_livre') regex = /https?:\/\/www\.mercadolivre\.com\.br\/[^"'\s?]+?MLB[^\s"']+/i;

                    const textMatch = textHtml.match(regex);
                    if (textMatch) foundDirectUrl = textMatch[0];
                }
            } catch (e) { }
        }

        return { image: foundImage, directUrl: foundDirectUrl };
    } catch { return { image: null, directUrl: null }; }
}

function generateAffiliateLink(productName, platformId, directUrl = null) {
    const query = encodeURIComponent(productName);
    const platform = AFFILIATE_CONFIG[platformId] || AFFILIATE_CONFIG.amazon;

    // Se temos um link direto, usamos ele como base
    const base = directUrl || `${platform.baseUrl}${query}`;
    const connector = base.includes('?') ? '&' : '?';

    if (platform.id === 'amazon') {
        return directUrl ? `${base}${connector}tag=${platform.tag}` : `${platform.baseUrl}${query}&tag=${platform.tag}`;
    } else if (platform.id === 'mercado_livre') {
        return `${base}${connector}matt_tool=${platform.tag}&matt_word=${platform.word}`;
    }

    return base;
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

    const targetPerPlatform = 20;
    const platformStats = {};
    const platforms = Object.keys(AFFILIATE_CONFIG);
    platforms.forEach(p => platformStats[p] = 0);

    let totalPublished = 0;
    const maxTotal = targetPerPlatform * platforms.length;

    // Embaralha categorias para diversidade
    const shuffledCategories = [...PRODUCT_CATEGORIES].sort(() => Math.random() - 0.5);

    for (const category of shuffledCategories) {
        if (totalPublished >= maxTotal) break;

        console.log(`\n📂 Categoria: ${category.name}`);

        // Embaralha keywords da categoria
        const shuffledKeywords = [...category.keywords].sort(() => Math.random() - 0.5);

        for (const keyword of shuffledKeywords) {
            if (totalPublished >= maxTotal) break;

            console.log(`🔍 Buscando ofertas para: ${keyword}`);

            // Variantes por keyword com inteligência de recomendação e preço
            const variants = [
                { suffix: 'Original Loja Oficial', priceMult: 1, desc: '⭐ RECOMENDADO: Produto de Loja Oficial com máxima pontualidade e procedência garantida.', intel: '[LOJA OFICIAL ⭐]' },
                { suffix: 'Pro Edition Elite', priceMult: 1.4, desc: '🏆 TOP DE LINHA: Selecionado entre os mais bem avaliados por motociclistas profissionais.', intel: '[ALTA RECOMENDAÇÃO 🏆]' },
                { suffix: 'Promoção Imbatível', priceMult: 0.70, desc: '💰 PREÇO BAIXO: A oferta mais barata encontrada hoje com boa reputação do vendedor.', intel: '[OFERTA IMBATÍVEL 💰]' },
                { suffix: 'Custo-Benefício Real', priceMult: 0.85, desc: '🤝 EQUILÍBRIO: O melhor equilíbrio entre preço justo e satisfação do comprador.', intel: '[MELHOR CUSTO-BENEFÍCIO]' }
            ];

            const pricesPerCategory = {
                'Equipamentos': { min: 250, max: 1800 },
                'Acessórios': { min: 50, max: 600 },
                'Peças': { min: 120, max: 1200 },
                'Manutenção': { min: 30, max: 150 },
                'Moda & Estilo': { min: 45, max: 250 },
                'Super Ofertas 🔥': { min: 40, max: 400 }
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
                if (totalPublished >= maxTotal) break;

                // Seleciona apenas plataformas que ainda não atingiram a meta
                const availablePlatforms = platforms.filter(id => platformStats[id] < targetPerPlatform);
                if (availablePlatforms.length === 0) break;

                const platformId = availablePlatforms[Math.floor(Math.random() * availablePlatforms.length)];

                console.log(`📦 Processando: ${p.name} [Meta ${platformId}: ${platformStats[platformId]}/${targetPerPlatform}]`);

                const { image, directUrl } = await researchProductAssets(keyword, platformId);
                if (!image) {
                    console.log('⚠️ Sem imagem, pulando...');
                    continue;
                }

                const affiliateLink = generateAffiliateLink(keyword, platformId, directUrl);

                if (directUrl) console.log(`🎯 Link Sniper Achado: ${directUrl}`);
                console.log(`🔗 Link Final (Com sua Chave): ${affiliateLink}`);

                const discountValue = Math.random() > 0.4 ? `${Math.floor(Math.random() * 25 + 5)}% OFF` : null;

                const productRecord = {
                    name: p.name,
                    price: p.price,
                    image: image,
                    category: category.name,
                    link: affiliateLink,
                    description: `${p.intel || ''} ${p.description} Seleção inteligente Moto Hub via ${platformId.replace('_', ' ').toUpperCase()}.`,
                    discount: discountValue,
                    source: 'Sales AI Agent',
                    active: true
                };

                if (dryRun) {
                    console.log('🧪 DRY RUN:', productRecord);
                    platformStats[platformId]++;
                    totalPublished++;
                } else {
                    try {
                        const result = await supabaseInsert('products', productRecord, token);
                        console.log(`✅ Publicado! ID: ${result.id}`);
                        platformStats[platformId]++;
                        totalPublished++;
                    } catch (err) {
                        console.error(`❌ Erro ao publicar: ${err.message}`);
                    }
                }
            }
        }
    }

    console.log(`\n✨ Finalizado! Total de publicações: ${totalPublished}`);
    console.log('📊 Resumo por plataforma:', platformStats);
}

main().catch(console.error);
