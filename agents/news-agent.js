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
        'capacete moto equipamento segurança'
    ];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

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

/**
 * Fonte 2: Reddit (API pública)
 */
async function fetchRedditNews() {
    try {
        const res = await fetch(
            'https://www.reddit.com/r/motorcycles/hot.json?limit=10',
            { headers: { 'User-Agent': 'MotoHubBrasil/1.0' } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const posts = data?.data?.children || [];

        return posts
            .filter(p => p.data.title && !p.data.over_18 && p.data.score > 10)
            .slice(0, 5)
            .map(p => ({
                title: p.data.title.slice(0, 150),
                summary: (p.data.selftext || `Popular no r/motorcycles com ${p.data.score} upvotes.`).slice(0, 300),
                source: 'Reddit',
                url: `https://reddit.com${p.data.permalink}`,
                image: (p.data.thumbnail?.startsWith('http') ? p.data.thumbnail : null) || randomImage()
            }));
    } catch (err) {
        console.log(`  ⚠️  Reddit: ${err.message}`);
        return [];
    }
}

/**
 * Fonte 3: Banco de notícias curadas (sempre disponível)
 */
function getCuratedNews() {
    const now = new Date();
    const month = now.toLocaleDateString('pt-BR', { month: 'long' });
    const year = now.getFullYear();

    const bank = [
        {
            title: `Honda CG 160 continua liderando vendas em ${month} ${year}`,
            summary: `A Honda CG 160 mantém a posição de motocicleta mais vendida do Brasil em ${month}. Referência em custo-benefício, o modelo é a escolha número um do motociclista brasileiro para o dia a dia.`,
            source: 'MotoHubBR',
            url: 'https://www.honda.com.br/motos'
        },
        {
            title: 'Guia completo: como pilotar moto na chuva com segurança',
            summary: 'Pneus adequados, frenagem suave e distância do veículo da frente são fundamentais. Especialistas compartilham dicas cruciais para motociclistas enfrentarem dias chuvosos com segurança.',
            source: 'SegurançaBR',
            url: '#'
        },
        {
            title: 'BMW R 1300 GS chega ao Brasil com tecnologia inédita',
            summary: 'A nova BMW R 1300 GS desembarca no mercado brasileiro com motor boxer aprimorado de 145cv, suspensão semi-ativa e sistema de radar adaptativo. É a trail mais avançada da marca.',
            source: 'Duas Rodas',
            url: 'https://www.bmw-motorrad.com.br'
        },
        {
            title: 'Yamaha MT-07: a naked que conquistou o Brasil',
            summary: 'Com motor bicilíndrico de 689cc e preço competitivo, a Yamaha MT-07 se consolidou como uma das motos mais desejadas do mercado brasileiro. Conheça os detalhos do modelo.',
            source: 'MotoMundo',
            url: 'https://www.yamaha-motor.com.br'
        },
        {
            title: 'Triumph Speed 400 supera expectativas de vendas no Brasil',
            summary: 'A Triumph Speed 400 conquistou os motociclistas brasileiros com design retrô moderno e motor de 400cc. Vendas superaram a meta da fabricante em mais de 40% nos primeiros meses.',
            source: 'DuasRodas',
            url: 'https://www.triumph.com.br'
        },
        {
            title: 'Kawasaki Ninja 400: edição especial exclusiva para o Brasil',
            summary: 'A Kawasaki apresentou a edição especial da Ninja 400 com grafismo exclusivo em verde e preto para o mercado brasileiro. Acessórios de proteção já vêm inclusos no pacote.',
            source: 'MotoSport',
            url: 'https://www.kawasaki.com.br'
        },
        {
            title: 'Suzuki V-Strom 800DE: a adventure urbana chegou',
            summary: 'A Suzuki expandiu a família V-Strom com a 800 DE, otimizada para uso urbano e viagens curtas. Suspensão recalibrada e posição de pilotagem mais baixa miram novos públicos.',
            source: 'MotoHubBR',
            url: 'https://www.suzukimotos.com.br'
        },
        {
            title: 'Como escolher o capacete ideal: guia definitivo',
            summary: 'Certificação, tipo de viseira, ventilação, peso e conforto térmico. Confira nosso guia completo para acertar na escolha do seu próximo capacete e pilotar com máxima segurança.',
            source: 'EquipamentosBR',
            url: '#'
        },
        {
            title: `Melhores rotas de moto no Brasil para ${month}`,
            summary: `Com a chegada de ${month}, as rotas pelo Brasil ficam ainda mais atraentes. Serra do Rio do Rastro, Serra Gaúcha e Estrada da Graciosa são destaques para motociclistas aventureiros.`,
            source: 'RotasBR',
            url: '#'
        },
        {
            title: 'Encontro Nacional de Motociclistas bate recorde de público',
            summary: 'Mais de 15 mil motociclistas de todo o Brasil participaram do maior encontro do país, com test-rides de lançamentos, palestras sobre segurança e shows ao vivo.',
            source: 'MotoEventos',
            url: '#'
        },
        {
            title: 'Honda ADV 350 desembarca no mercado brasileiro',
            summary: 'O scooter aventureiro Honda ADV 350 chega ao Brasil com motor 330cc, ABS de dois canais e design robusto. Ideal para quem busca versatilidade no trânsito urbano e na estrada.',
            source: 'MotoMundo',
            url: 'https://www.honda.com.br/motos'
        },
        {
            title: 'Ducati Multistrada V4 Rally: aventura sem limites',
            summary: 'A Ducati apresentou a Multistrada V4 Rally com tanque de 30 litros e suspensão de longo curso. Projetada para viagens transcontinentais, é a big trail definitiva italiana.',
            source: 'DuasRodas',
            url: 'https://www.ducati.com/br'
        },
    ];

    // Embaralha e retorna 3 aleatórias
    return shuffle(bank).slice(0, 3).map(n => ({ ...n, image: randomImage() }));
}

// ═══════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════

function parseRSS(xml, source) {
    const items = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = regex.exec(xml)) !== null && items.length < 8) {
        const block = m[1];
        const title = extractTag(block, 'title');
        const link = extractTag(block, 'link');
        const desc = extractTag(block, 'description');
        if (title && title.length > 10) {
            items.push({
                title: cleanText(title).slice(0, 150),
                summary: cleanText(desc || `Notícia via ${source}`).slice(0, 300),
                source,
                url: link || '#',
                image: randomImage()
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
        count: parseInt(get('--count') || '3'),
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
    console.log('🔍 Pesquisando notícias de motos...\n');

    const [google, reddit, curated] = await Promise.all([
        fetchGoogleNews(),
        fetchRedditNews(),
        Promise.resolve(getCuratedNews())
    ]);

    console.log(`   📰 Google News: ${google.length} artigos`);
    console.log(`   📰 Reddit:      ${reddit.length} posts`);
    console.log(`   📰 Curadas:     ${curated.length} artigos\n`);

    const allNews = dedup([...google, ...reddit, ...curated]);
    console.log(`   ✅ Total únicas: ${allNews.length}\n`);

    if (allNews.length === 0) {
        console.log('❌ Nenhuma notícia encontrada.');
        process.exit(0);
    }

    // 3. Publicar
    let published = 0, skipped = 0, errors = 0;
    console.log('📤 Publicando...\n');

    for (const item of allNews.slice(0, opts.count)) {
        const shortTitle = item.title.length > 60 ? item.title.slice(0, 57) + '...' : item.title;
        process.stdout.write(`   📰 "${shortTitle}" `);

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
