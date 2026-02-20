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
    { name: 'Equipamentos', keywords: ['Capacete LS2 Rapid', 'Jaqueta Alpinestars T-GP', 'Luva X11 Fit X', 'Bota Macboot Moto', 'Capacete MT Stinger', 'Capacete Shark D-Skwal', 'Jaqueta LS2 Alba', 'Luva Alpinestars SP-8', 'Bota Alpine Stars SMX', 'Capacete Bell Qualifier'] },
    { name: 'Acessórios', keywords: ['Intercomunicador Ejeas V6 Pro', 'Suporte Celular Alumínio', 'Baú Bauleto Givi 45L', 'Cadeado Corrente Moto High Security', 'Antena Corta-Pipa Inox', 'Protetor de Motor Scam', 'Afastador de Alforge', 'Bolha Esportiva', 'Slider de Motor', 'Protetor de Punho'] },
    { name: 'Peças', keywords: ['Pneu Metzeler Karoo Street', 'Kit Relação Vaz Gold', 'Pastilha Freio Cobreq Racing', 'Filtro Ar Lavável', 'Escapamento Esportivo Yoshimura', 'Vela Iridium NGK', 'Amortecedor de Direção', 'Pedaleira Esportiva', 'Manete Esportivo Retrátil', 'Disco de Freio Wave'] },
    { name: 'Manutenção', keywords: ['Kit Limpeza Motul C1 C4', 'Graxa Branca Spray', 'Capa de Chuva Pantaneiro', 'Carregador Bateria Inteligente', 'Cera para Proteção Pintura', 'Óleo Repsol 10W40', 'Escova Limpeza Corrente', 'Kit Reparo Pneu Sem Câmara', 'Elevador Hidráulico Moto'] },
    { name: 'Moda & Estilo', keywords: ['Camiseta Moto Hub Brasil', 'Moleton Yamaha Racing', 'Boné Honda Wing', 'Chaveiro Moto Couro', 'Carteira Slim Motovlog', 'Bandana Tubular Rider', 'Camiseta Harley Davidson', 'Jaqueta Jeans Proteção Moto', 'Óculos Motociclista Retro'] },
    { name: 'Super Ofertas 🔥', keywords: ['Capacete Axxis Draken', 'Intercomunicador FreedConn T-Com', 'Luva de Couro Monster X', 'Kit Transmissão DID Gold', 'Jaqueta Motoqueiro Cordura', 'Bota de Couro Impermeável', 'Suporte GPS Moto Pro', 'Capa para Moto Térmica', 'Trava de Disco com Alarme'] }
];

const NICHE_WHITELIST = [
    'moto', 'motociclista', 'motociclismo', 'rider', 'biker', 'capacete', 'helmet', 'jaqueta', 'jacket',
    'luva', 'glove', 'bota', 'boot', 'racing', 'paddock', 'trail', 'custom', 'harley', 'honda', 'yamaha',
    'suzuki', 'kawasaki', 'bmw motorrad', 'triumph', 'ducati', 'ls2', 'alpinestars', 'agv', 'shark',
    'bell', 'mt helmets', 'axxis', 'x11', 'givi', 'scam', 'bauleto', 'intercomunicador', 'escapamento'
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

async function scrapeProductData(url, platformId) {
    if (!url) return { price: null, title: null };
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return { price: null, title: null };
        const html = await res.text();

        let price = null;
        let title = null;

        if (platformId === 'mercado_livre') {
            const metaPrice = /<meta itemprop="price" content="([\d.]+)"/.exec(html);
            if (metaPrice) price = `R$ ${parseFloat(metaPrice[1]).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            else {
                const spanPrice = /class="andes-money-amount__fraction"[^>]*>([\d.]+)</.exec(html);
                if (spanPrice) price = `R$ ${spanPrice[1].replace('.', ',')}`;
            }

            const titleMatch = /<h1 class="ui-pdp-title">([^<]+)<\/h1>/.exec(html);
            if (titleMatch) title = titleMatch[1].trim();
            else {
                const ogTitle = /property="og:title" content="([^"]+)"/.exec(html);
                if (ogTitle) title = ogTitle[1].trim();
            }
        } else if (platformId === 'amazon') {
            const amazonPrice = /class="a-offscreen"[^>]*>R\$\s?([\d.,]+)</.exec(html);
            if (amazonPrice) price = `R$ ${amazonPrice[1].trim()}`;
            else {
                const wholePrice = /class="a-price-whole"[^>]*>([\d.,]+)/.exec(html);
                if (wholePrice) price = `R$ ${wholePrice[1].trim()}`;
            }

            const amazonTitle = /id="productTitle"[^>]*>([^<]+)</.exec(html);
            if (amazonTitle) title = amazonTitle[1].trim();
        }

        if (title && (title.length < 15 || title.toLowerCase() === platformId.replace('_', ' '))) title = null;

        return { price, title };
    } catch (e) { return { price: null, title: null }; }
}

async function researchDirectLink(keywords, platformId) {
    const domain = platformId === 'amazon' ? 'amazon.com.br' : 'mercadolivre.com.br';
    const query = encodeURIComponent(`site:${domain} ${keywords}`);
    const url = `https://www.bing.com/search?q=${query}`;

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) return null;
        const html = await res.text();

        let regex;
        if (platformId === 'amazon') regex = /https?:\/\/www\.amazon\.com\.br\/[^"'\s?]+?\/dp\/[A-Z0-9]{10}/i;
        else if (platformId === 'mercado_livre') regex = /https?:\/\/www\.mercadolivre\.com\.br\/[^"'\s?]+?MLB[^\s"']+/i;

        const match = html.match(regex);
        return match ? match[0] : null;
    } catch { return null; }
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

            // Variantes por keyword apenas para nome e descrição (Sem cálculo de preço)
            const variants = [
                { suffix: 'Original', desc: 'Item selecionado para sua jornada sobre duas rodas.', intel: '[SELEÇÃO PREMIUM]' },
                { suffix: 'Premium', desc: 'Alta qualidade e durabilidade comprovada por motociclistas.', intel: '[RECOMENDADO]' }
            ];

            const trendingProducts = variants.map(v => ({
                name: `${keyword} ${v.suffix}`,
                price: 'VER PREÇO NA LOJA',
                description: `${v.desc}`
            }));

            const platforms = Object.keys(AFFILIATE_CONFIG);

            for (const p of trendingProducts) {
                if (totalPublished >= maxTotal) break;

                // Seleciona apenas plataformas que ainda não atingiram a meta
                const availablePlatforms = platforms.filter(id => platformStats[id] < targetPerPlatform);
                if (availablePlatforms.length === 0) break;

                const platformId = availablePlatforms[Math.floor(Math.random() * availablePlatforms.length)];

                console.log(`📦 Processando: ${p.name} [Meta ${platformId}: ${platformStats[platformId]}/${targetPerPlatform}]`);

                // BUSCA BLINDADA (Loja Oficial + Nicho)
                const searchKeyword = `${keyword} motociclismo loja oficial`;
                const { image, directUrl } = await researchProductAssets(searchKeyword, platformId);
                if (!image) {
                    console.log('⚠️ Sem imagem, pulando...');
                    continue;
                }

                // FILTRO DE RELEVÂNCIA (Blacklist + Whitelist de Nicho)
                const blacklist = ['stitch', 'disney', 'infantil', 'brinquedo', 'lego', 'kids'];
                if (blacklist.some(b => p.name.toLowerCase().includes(b))) {
                    console.log(`❌ Bloqueio de Blacklist: ${p.name}`);
                    continue;
                }

                // DADOS REAIS (POLÍTICA DE NOMES REAIS & PREÇO)
                let { price: realPrice, title: realTitle } = await scrapeProductData(directUrl, platformId);
                if (!realPrice || !realTitle) {
                    const fallbackUrl = await researchDirectLink(searchKeyword, platformId);
                    const fallbackData = await scrapeProductData(fallbackUrl, platformId);
                    realPrice = fallbackData.price;
                    realTitle = fallbackData.title;
                }

                // POLÍTICA DE CURADORIA DE ELITE (Whitelist de Nicho)
                if (realTitle) {
                    const isNiche = NICHE_WHITELIST.some(w => realTitle.toLowerCase().includes(w));
                    if (!isNiche) {
                        console.log(`🚫 REJEITADO (Nicho): Título "${realTitle}" não parece ser de motociclismo.`);
                        continue;
                    }
                }

                if (!realPrice || !realTitle) {
                    console.log(`🚫 REJEITADO (Dados): Informações incompletas para ${keyword}.`);
                    continue;
                }

                const affiliateLink = generateAffiliateLink(realTitle, platformId, directUrl);

                if (directUrl) console.log(`🎯 Link Sniper Achado: ${directUrl}`);
                console.log(`🏷️ Nome Real: ${realTitle}`);
                console.log(`💰 Preço Confirmado: ${realPrice}`);

                const productRecord = {
                    name: realTitle,
                    price: realPrice,
                    image: image,
                    category: category.name,
                    link: affiliateLink,
                    description: `${p.description} Seleção inteligente Jornada Biker via ${platformId.replace('_', ' ').toUpperCase()}.`,
                    discount: null,
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
                        console.log(`✅ Publicado! ID: ${result.id} | ${realTitle}`);
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
