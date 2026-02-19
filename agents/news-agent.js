/**
 * 🤖 Moto Hub Brasil — AI News Agent
 * 
 * Agente que pesquisa notícias de motos na web e publica automaticamente
 * no feed do Moto Hub via API REST do Supabase.
 * 
 * *** ZERO dependências externas — usa apenas Node.js nativo ***
 * 
 * Uso:
 *   node news-agent.js                              → Busca e publica (precisa de credenciais)
 *   node news-agent.js --dry-run                    → Simula sem publicar
 *   node news-agent.js --count 5                    → Publica até 5 notícias
 *   node news-agent.js --email x@x.com --pass 123   → Passa credenciais inline
 */

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://nwueiinchrvlqfxuxbxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dWVpaW5jaHJ2bHFmeHV4YnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODQxMDAsImV4cCI6MjA4Njc2MDEwMH0.uBCW_BO8O7luMsGOX-w2Ogso2xzc59mV4NrTIAsVudo';

const HEADERS_BASE = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
};

// Banco de imagens de motos para usar nas notícias
const MOTO_IMAGES = [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format',
    'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format',
    'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format',
    'https://images.unsplash.com/photo-1615172282427-72c6a4a53cb0?w=800&auto=format',
    'https://images.unsplash.com/photo-1622185135505-2d795003994a?w=800&auto=format',
    'https://images.unsplash.com/photo-1580310614729-ccd69652491d?w=800&auto=format',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&auto=format',
    'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&auto=format',
];

// ═══════════════════════════════════════════════════════════
// AUTENTICAÇÃO
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

// ═══════════════════════════════════════════════════════════
// SUPABASE REST HELPERS
// ═══════════════════════════════════════════════════════════

async function supabaseGet(table, query, token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: { ...HEADERS_BASE, 'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}` }
    });
    return res.json();
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

// ═══════════════════════════════════════════════════════════
// FONTES DE NOTÍCIAS
// ═══════════════════════════════════════════════════════════

/**
 * Fonte 1: Feeds RSS Diretos de Sites Brasileiros
 */
async function fetchDirectRSS() {
    const feeds = [
        { url: 'https://www.motoo.com.br/feed', name: 'MOTOO' },
        { url: 'https://www.motonline.com.br/feed', name: 'Motonline' },
        { url: 'https://motociclismoonline.com.br/feed', name: 'Motociclismo Online' }
    ];

    const allNews = [];
    for (const feed of feeds) {
        try {
            const res = await fetch(feed.url, {
                headers: { 'User-Agent': 'MotoHubBrasil/1.0' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const xml = await res.text();
            const items = parseRSS(xml, feed.name, true);
            allNews.push(...items);
        } catch (err) {
            console.log(`  ⚠️  ${feed.name}: ${err.message}`);
        }
    }
    return allNews;
}

/**
 * Fonte 2: Google News RSS (fonte principal)
 */
async function fetchGoogleNews() {
    const queries = [
        'motos brasil',
        'motocicleta lançamento brasil',
        'moto honda yamaha brasil',
        'moto elétrica brasil',
        'moto custom brasil',
        'review moto brasil',
        'comparativo motos brasil'
    ];

    const allNews = [];
    for (const keyword of queries) {
        try {
            const query = encodeURIComponent(keyword);
            const url = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

            const res = await fetch(url, {
                headers: { 'User-Agent': 'MotoHubBrasil/1.0' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const xml = await res.text();
            const items = parseGoogleNewsRSS(xml);
            allNews.push(...items);
            await sleep(300);
        } catch (err) {
            console.log(`  ⚠️  Google News [${keyword}]: ${err.message}`);
        }
    }
    return allNews;
}

// ═══════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════

/**
 * Valida se a URL é de uma fonte brasileira confiável
 */
function isBrazilianSource(url) {
    if (!url) return false;

    const brazilianDomains = [ // ... existing domains ...
        // Sites especializados em motos
        'motoo.com.br',
        'motonline.com.br',
        'motociclismoonline.com.br',
        'motoadventure.com.br',
        'duasrodas.com.br',
        'moto.com.br',
        'webmotors.com.br',
        'motorcycle.com.br',
        'motorede.com.br',
        'mundomotociclista.com.br',
        'revistamoto.com.br',
        'showradical.com',
        // Sites automotivos
        'autopapo.com.br',
        'autoesporte.globo.com',
        'motor1.uol.com.br',
        'quatrorodas.abril.com.br',
        'motorshow.com.br',
        'mobiauto.com.br',
        'car.blog.br',
        'vrum.com.br',
        'noticiasautomotivas.com.br',
        // Portais de notícias
        'g1.globo.com',
        'uol.com.br',
        'estadao.com.br',
        'folha.uol.com.br',
        'gazetasp.com.br',
        'em.com.br',
        'cnnbrasil.com.br',
        'veja.abril.com.br',
        'cartacapital.com.br',
        'infomoney.com.br',
        'diariodopara.com.br',
        'diariodaregiao.com.br',
        'monitordomercado.com.br',
        'timesbrasil.com.br',
        'noticiasaominuto.com.br',
        'olhardigital.com.br',
        'oantagonista.com.br',
        'agenciabrasil.ebc.com.br',
        'ig.com.br',
        'gov.br',
        'portaldotransito.com.br',
        'agazeta.com.br',
        'mobilidade.estadao.com.br',
        'saladeimprensa.honda.com.br'
    ];

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        return brazilianDomains.some(domain => hostname.includes(domain));
    } catch {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 🔍 BUSCA INTELIGENTE DE IMAGENS
// ═══════════════════════════════════════════════════════════

const MOTO_BRANDS = [
    'honda', 'yamaha', 'kawasaki', 'suzuki', 'bmw', 'ducati', 'triumph',
    'harley-davidson', 'harley', 'ktm', 'husqvarna', 'royal enfield',
    'mv agusta', 'aprilia', 'moto guzzi', 'indian', 'dafra', 'shineray',
    'haojue', 'kasinski', 'benelli', 'cfmoto', 'zontes', 'traxx',
    'can-am', 'piaggio', 'vespa', 'kymco', 'sym', 'bajaj'
];

/**
 * Extrai marca + modelo de moto a partir do título da notícia
 */
/**
 * Extrai marca + modelo de moto a partir do título ou descrição
 */
function extractMotoKeywords(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    const found = [];

    // Encontrar marcas conhecidas
    for (const brand of MOTO_BRANDS) {
        if (lower.includes(brand)) {
            found.push(brand);
        }
    }

    // Extrair modelos alfanuméricos: CB 300, MT-07, CG 160, XRE 300, Z900, etc.
    const models = text.match(/\b([A-Z]{1,5}[-\s]?\d{2,4}[A-Z]{0,2})\b/gi);
    if (models) found.push(...models);

    // Extrair nomes de modelos conhecidos
    const knownModels = ['tenere', 'ténéré', 'transalp', 'africa twin', 'versys',
        'ninja', 'burgman', 'biz', 'pop', 'factor', 'crosser', 'lander',
        'fazer', 'neo', 'pcx', 'adv', 'trail', 'sahara', 'falcon',
        'titan', 'fan', 'start', 'nmax', 'xmax', 'tracer', 'tiger',
        'street triple', 'speed triple', 'multistrada', 'panigale',
        'scrambler', 'monster', 'diavel', 'sportster', 'iron', 'fat boy',
        'road king', 'electra glide', 'street glide', 'adventure',
        'super cub', 'goldwing', 'gold wing', 'hayabusa', 'v-strom'];
    for (const model of knownModels) {
        if (lower.includes(model)) {
            found.push(model);
        }
    }

    return found.length > 0 ? [...new Set(found)].join(' ') : null;
}

/**
 * Busca imagem da moto na web via Bing Images
 */
async function searchImageOnWeb(keywords) {
    const query = encodeURIComponent(keywords + ' moto motocicleta');
    const url = `https://www.bing.com/images/search?q=${query}&qft=+filterui:photo-photo&form=IRFLTR&first=1`;

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return null;
        const html = await res.text();

        // Bing armazena URLs das imagens no formato "murl":"..."
        const match = html.match(/"murl":"(https?:\/\/[^"]+)"/i);
        if (match && match[1]) {
            return match[1].replace(/\\u002f/g, '/');
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Busca metadados do artigo (imagem og:image + descrição)
 */
async function fetchArticleMeta(url) {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'MotoHubBrasil/1.0' },
            redirect: 'follow',
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return {};
        const html = await res.text();

        // og:image
        const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

        // og:description
        const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);

        // twitter:image (fallback)
        const twImg = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

        return {
            image: (ogImg && ogImg[1]) || (twImg && twImg[1]) || null,
            description: (ogDesc && ogDesc[1]) || null
        };
    } catch {
        return {};
    }
}

function parseRSS(xml, source, skipDomainCheck = false) {
    const items = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = regex.exec(xml)) !== null) {
        const block = m[1];
        const title = extractTag(block, 'title');
        const link = extractTag(block, 'link');
        const desc = extractTag(block, 'description');
        const pubDate = extractTag(block, 'pubDate');

        if (title && title.length > 10 && (skipDomainCheck || isBrazilianSource(link))) {
            items.push({
                title: cleanText(title).slice(0, 150),
                summary: cleanText(desc || `Notícia via ${source}`).slice(0, 300),
                source,
                url: link || '#',
                image: randomImage(),
                date: pubDate ? new Date(pubDate) : new Date()
            });
        }
    }
    return items;
}

/**
 * Parser especial para Google News RSS
 * Extrai <source url="..."> para validar domínio ao invés do link redirect
 */
function parseGoogleNewsRSS(xml) {
    const items = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = regex.exec(xml)) !== null) {
        const block = m[1];
        const title = extractTag(block, 'title');
        const link = extractTag(block, 'link');
        const desc = extractTag(block, 'description');
        const pubDate = extractTag(block, 'pubDate');

        // Extrair URL real da tag <source url="...">
        const sourceMatch = block.match(/<source\s+url="([^"]+)"[^>]*>([^<]*)<\/source>/);
        const sourceUrl = sourceMatch ? sourceMatch[1] : '';
        const sourceName = sourceMatch ? sourceMatch[2] : 'Google News';

        // Limpar título (Google News adiciona " - Fonte" no final)
        const cleanTitle = title.replace(/\s*-\s*[^-]+$/, '');

        if (cleanTitle && cleanTitle.length > 10 && isBrazilianSource(sourceUrl)) {
            items.push({
                title: cleanText(cleanTitle).slice(0, 150),
                summary: cleanText(desc || `Notícia via ${sourceName}`).slice(0, 300),
                source: sourceName,
                url: link || '#',
                image: randomImage(),
                date: pubDate ? new Date(pubDate) : new Date()
            });
        }
    }
    return items;
}

function extractTag(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return m ? (m[1] || m[2] || '').trim() : '';
}

function cleanText(s) {
    return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

/**
 * Valida se a data é dos últimos 5 dias
 */
function isRecent(date) {
    if (!date || !(date instanceof Date)) return false;
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
    return date >= fiveDaysAgo && date <= now;
}

function randomImage() {
    return MOTO_IMAGES[Math.floor(Math.random() * MOTO_IMAGES.length)];
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function dedup(news) {
    const seen = new Set();
    return news.filter(n => {
        const k = n.title.toLowerCase().slice(0, 40);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseArgs() {
    const args = process.argv.slice(2);
    const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
    return {
        dryRun: args.includes('--dry-run'),
        count: parseInt(get('--count') || '5'),
        email: get('--email') || process.env.AGENT_EMAIL || '',
        password: get('--pass') || process.env.AGENT_PASSWORD || ''
    };
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
    const opts = parseArgs();

    console.log('');
    console.log('  ═══════════════════════════════════════════');
    console.log('   🏍️  JORNADA BIKER — AI NEWS AGENT');
    console.log('  ═══════════════════════════════════════════');
    console.log(`   Modo: ${opts.dryRun ? '🧪 DRY RUN' : '🚀 PRODUÇÃO'}`);
    console.log(`   Máximo: ${opts.count} notícias`);
    console.log(`   ${new Date().toLocaleString('pt-BR')}`);
    console.log('  ═══════════════════════════════════════════\n');

    // 1. Autenticar
    let token = null;
    if (!opts.dryRun) {
        if (!opts.email || !opts.password) {
            console.log('❌ Credenciais obrigatórias! Use:\n');
            console.log('   node news-agent.js --email seu@email.com --pass suaSenha\n');
            console.log('   Ou defina AGENT_EMAIL e AGENT_PASSWORD no ambiente.\n');
            process.exit(1);
        }
        try {
            console.log(`🔐 Autenticando ${opts.email}...`);
            token = await login(opts.email, opts.password);
            console.log('✅ Autenticado!\n');
        } catch (err) {
            console.error(`❌ Login falhou: ${err.message}`);
            process.exit(1);
        }
    }

    // 2. Pesquisar notícias
    console.log(`🔍 Pesquisando notícias de motos (últimos 5 dias)...\n`);

    const [rss, google] = await Promise.all([
        fetchDirectRSS(),
        fetchGoogleNews()
    ]);

    console.log(`   📰 Feeds Diretos: ${rss.length} artigos encontrados`);
    console.log(`   📰 Google News: ${google.length} artigos encontrados\n`);

    // Filtrar por últimos 3 dias
    const allNews = shuffle(dedup([...rss, ...google])).filter(n => isRecent(n.date));

    console.log(`   ✅ Total Recente e Únicas: ${allNews.length}\n`);

    if (allNews.length === 0) {
        console.log('❌ Nenhuma notícia encontrada para hoje.');
        process.exit(0);
    }

    // 3. Publicar
    let published = 0, skipped = 0, errors = 0;
    console.log('📤 Publicando...\n');

    for (const item of allNews) {
        if (published >= opts.count) break;
        const shortTitle = item.title.length > 60 ? item.title.slice(0, 57) + '...' : item.title;
        process.stdout.write(`   📰 [${new Date(item.date).toLocaleTimeString()}] "${shortTitle}" `);

        if (opts.dryRun) {
            console.log('→ ✅ [simulação]');
            published++;
            continue;
        }

        try {
            // Verificar duplicata no banco
            const existing = await supabaseGet('news', `title=ilike.*${encodeURIComponent(item.title.slice(0, 25))}*&limit=1`, token);
            if (existing && existing.length > 0) {
                console.log('→ ⏭️  já existe');
                skipped++;
                continue;
            }
            // Buscar imagem real e descrição do artigo
            process.stdout.write('🔗 ');
            const meta = await fetchArticleMeta(item.url);

            const articleSummary = meta.description
                ? cleanText(meta.description).slice(0, 300)
                : item.summary;

            // Cadeia de fallback para imagem revisada (v2.9.7):
            // 1. og:image do artigo
            // 2. Buscar imagem na web por marca/modelo encontrados no Título
            // 3. Buscar imagem na web por marca/modelo encontrados no Resumo/Descrição
            // 4. Buscar imagem genérica de moto baseada no título
            // 5. Imagem aleatória de stock (Último recurso)
            let articleImage = meta.image;
            let imageSource = '🖼️';

            if (!articleImage) {
                // Tenta extrair do título
                const titleKeywords = extractMotoKeywords(item.title);
                if (titleKeywords) {
                    process.stdout.write(`🔎[Title:${titleKeywords}] `);
                    articleImage = await searchImageOnWeb(titleKeywords);
                    imageSource = '🔍';
                }
            }

            if (!articleImage) {
                // Tenta extrair da descrição/resumo
                const descKeywords = extractMotoKeywords(articleSummary);
                if (descKeywords) {
                    process.stdout.write(`🔎[Desc:${descKeywords}] `);
                    articleImage = await searchImageOnWeb(descKeywords);
                    imageSource = '🔎';
                }
            }

            if (!articleImage) {
                // Busca genérica por termos do título
                const genericTerms = item.title.split(' ').slice(0, 4).join(' ');
                process.stdout.write(`🌐[Generic:${genericTerms}] `);
                articleImage = await searchImageOnWeb(genericTerms);
                imageSource = '🌐';
            }

            if (!articleImage) {
                // Fallback para banco interno caso falhe a busca web
                articleImage = randomImage();
                imageSource = '📷';
            }

            // TRAVA DE SEGURANÇA: Nenhuma notícia sem imagem é publicada
            if (!articleImage || articleImage.length < 10) {
                console.log('→ 🚫 [ERROR: No Image Found] skipping...');
                errors++;
                continue;
            }

            const result = await supabaseInsert('news', {
                title: item.title,
                summary: articleSummary,
                image: articleImage,
                source: item.source,
                url: item.url,
                created_at: new Date().toISOString(),
                author: 'ai-agent',
                published: true
            }, token);

            console.log(`→ ✅ ID: ${result.id} ${imageSource}`);
            published++;
            await sleep(500);
        } catch (err) {
            console.log(`→ ❌ ${err.message}`);
            errors++;
        }
    }

    // 4. Resumo
    console.log('\n  ═══════════════════════════════════════════');
    console.log('   📊 RESUMO');
    console.log('  ═══════════════════════════════════════════');
    console.log(`   ✅ Publicadas:  ${published}`);
    console.log(`   ⏭️  Duplicadas:  ${skipped}`);
    console.log(`   ❌ Erros:       ${errors}`);
    console.log('  ═══════════════════════════════════════════\n');

    if (!opts.dryRun && published > 0) {
        console.log('  🎉 Abra o app para ver as notícias no feed!\n');
    }
}

main().catch(err => {
    console.error('💥 Erro fatal:', err);
    process.exit(1);
});
