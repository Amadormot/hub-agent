async function diagnostic() {
    const keywords = ['Intercomunicador Ejeas V6 Pro', 'Capacete LS2 Rapid', 'Jaqueta Alpinestars'];
    for (const kw of keywords) {
        console.log(`\n--- Testing: ${kw} ---`);
        const query = encodeURIComponent(kw + ' site:amazon.com.br');
        const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
        });
        const html = await res.text();

        const matches = [...html.matchAll(/m=\"({[^\"]+})\"/gi)];
        console.log(`Found ${matches.length} potential patterns.`);

        for (const m of matches) {
            const jsonStr = m[1].replace(/&quot;/g, '"');
            try {
                const data = JSON.parse(jsonStr);
                const urls = [data.purl, ...data.murl.split('¿¿')];
                for (const u of urls) {
                    if (u && u.includes('amazon.com.br')) {
                        console.log('Amazon URL Match:', u);
                    }
                }
            } catch (e) { }
        }
    }
}
diagnostic();
