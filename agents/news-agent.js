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
 * Fonte 1: Google News RSS (público, sem API key)
 */
async function fetchGoogleNews() {
    const keywords = [
        'motocicleta brasil lançamento',
        'moto nova honda yamaha kawasaki',
        'motociclismo evento encontro brasil',
        'moto adventure estrada viagem',
        'capacete moto equipamento segurança',
        'motos brasil notícias',
        'lançamento moto brasil'
    ];

    // Data de hoje AAAA-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];

    // Adiciona after:AAAA-MM-DD para forçar notícias recentes
    const query = `${encodeURIComponent(keyword)} after:${today}`;
    const url = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'MotoHubBrasil/1.0' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        return parseRSS(xml, 'Google News');
    } catch (err) {
        console.log(`  ⚠️  Google News: ${err.message}`);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════

/**
 * Valida se a URL é de uma fonte brasileira confiável
 */
function isBrazilianSource(url) {
    if (!url) return false;

    // Lista de domínios brasileiros de renome sobre motos
    const brazilianDomains = [
        'duasrodas.com.br',
        'moto.com.br',
        'motociclismoonline.com.br',
        'motoadventure.com.br',
        'webmotors.com.br',
        'motorcycle.com.br',
        'motorede.com.br',
        'motociclismo.com.br',
        'mundomotociclista.com.br',
        'portaldotransito.com.br',
        'revistamoto.com.br',
        'g1.globo.com',
        'uol.com.br',
        'estadao.com.br',
        'folha.uol.com.br'
    ];

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // Verifica se o hostname contém algum dos domínios brasileiros
        return brazilianDomains.some(domain => hostname.includes(domain));
    } catch {
        return false;
    }
}

function parseRSS(xml, source) {
    const items = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = regex.exec(xml)) !== null) {
        const block = m[1];
        const title = extractTag(block, 'title');
        const link = extractTag(block, 'link');
        const desc = extractTag(block, 'description');
        const pubDate = extractTag(block, 'pubDate');

        // Filtrar apenas fontes brasileiras
        if (title && title.length > 10 && isBrazilianSource(link)) {
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

function extractTag(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    return m ? (m[1] || m[2] || '').trim() : '';
}

function cleanText(s) {
    return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

function isToday(dateObj) {
    if (!dateObj) return false;
    const d = new Date(dateObj);
    const now = new Date();
    return d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
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
    console.log('   🏍️  MOTO HUB BRASIL — AI NEWS AGENT');
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
    const todayStr = new Date().toLocaleDateString('pt-BR');
    console.log(`🔍 Pesquisando notícias de motos do dia [${todayStr}]...\n`);

    const [google] = await Promise.all([
        fetchGoogleNews()
    ]);

    console.log(`   📰 Google News: ${google.length} artigos encontrados (apenas fontes brasileiras)\n`);

    // Filtrar estritamente por hoje
    const allNews = dedup([...google]).filter(n => isToday(n.date));

    console.log(`   ✅ Total de HOJE e Únicas: ${allNews.length}\n`);

    if (allNews.length === 0) {
        console.log('❌ Nenhuma notícia encontrada para hoje.');
        process.exit(0);
    }

    // 3. Publicar
    let published = 0, skipped = 0, errors = 0;
    console.log('📤 Publicando...\n');

    for (const item of allNews.slice(0, opts.count)) {
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

            const result = await supabaseInsert('news', {
                title: item.title,
                summary: item.summary,
                image: item.image,
                source: item.source,
                url: item.url,
                created_at: new Date().toISOString(), // Garante timestamp atual
                author: 'ai-agent',
                published: true
            }, token);

            console.log(`→ ✅ ID: ${result.id}`);
            published++;
            await sleep(300);
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
