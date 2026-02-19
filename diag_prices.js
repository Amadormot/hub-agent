async function diagnostic() {
    const query = encodeURIComponent('Capacete LS2 Rapid' + ' site:mercadolivre.com.br product');
    const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
    });
    const html = await res.text();

    // Bing often uses metadata in <a class="iusc" m="{...}">
    const matches = [...html.matchAll(/m=\"({[^\"]+})\"/gi)];
    console.log('Matches found:', matches.length);
    if (matches.length > 0) {
        matches.slice(0, 10).forEach((m, i) => {
            const jsonStr = m[1].replace(/&quot;/g, '"');
            try {
                const data = JSON.parse(jsonStr);
                console.log(`\n--- Match ${i + 1} ---`);
                console.log(`Title: ${data.t}`);
                console.log(`Price Info (Trying to find in data):`, data.purl.includes('price') || JSON.stringify(data).includes('R$'));
                console.log(`Full JSON (Keys):`, Object.keys(data));
                console.log(`Desc: ${data.desc}`);
            } catch (e) { }
        });
    }
}
diagnostic();
