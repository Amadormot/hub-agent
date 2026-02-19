async function diagnostic() {
    const products = [
        { name: 'Capacete LS2 Rapid', domain: 'mercadolivre.com.br' },
        { name: 'Intercomunicador Ejeas V6', domain: 'amazon.com.br' }
    ];

    for (const p of products) {
        const query = encodeURIComponent(`site:${p.domain} "${p.name}"`);
        const url = `https://www.bing.com/search?q=${query}`;

        console.log(`\nTesting ${p.name} on ${p.domain}...`);

        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
        });
        const html = await res.text();

        // Look for currency patterns
        const priceRegex = /R\$\s?(\d{1,3}(\.\d{3})*,\d{2})/g;
        const matches = [...html.matchAll(priceRegex)];

        if (matches.length > 0) {
            console.log(`Found ${matches.length} price matches:`);
            matches.slice(0, 5).forEach(m => console.log(`- ${m[0]}`));
        } else {
            console.log('No price found in snippet.');
            // Let's look for common price classes if possible
            if (html.includes('class="pd-price"')) console.log('Found pd-price class!');
        }
    }
}
diagnostic();
