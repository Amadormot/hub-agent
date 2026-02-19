async function diagnostic() {
    const query = encodeURIComponent('Capacete LS2 Rapid' + ' moto product');
    const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
    });
    const html = await res.text();

    // Bing often uses metadata in <a class="iusc" m="{...}">
    const matches = [...html.matchAll(/m=\"({[^\"]+})\"/gi)];
    console.log('Matches with m attribute:', matches.length);
    if (matches.length > 0) {
        matches.slice(0, 5).forEach((m, i) => {
            const jsonStr = m[1].replace(/&quot;/g, '"');
            try {
                const data = JSON.parse(jsonStr);
                console.log(`\nMatch ${i + 1}:`);
                console.log(`purl: ${data.purl}`);
                console.log(`murl: ${data.murl}`);
            } catch (e) {
                console.log(`Error parsing match ${i + 1}:`, e.message);
            }
        });
    }
}
diagnostic();
