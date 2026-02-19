async function diagnostic() {
    const keywords = 'Capacete LS2 Rapid';
    const query = encodeURIComponent(keywords + ' moto product');
    const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
    });
    const html = await res.text();

    // Look for the full JSON block in the <img> tag data-src or in the <a class="iusc">
    // Usually it looks like: {"murl":"img_url", "purl":"page_url", ...}
    const matches = [...html.matchAll(/"murl":"(https?:\/\/[^"]+)".*?"purl":"(https?:\/\/[^"]+)"/gi)];
    console.log('JSON Matches found:', matches.length);

    matches.slice(0, 5).forEach((m, i) => {
        console.log(`\nMatch ${i + 1}:`);
        console.log(`Image (murl): ${m[1].substring(0, 80)}...`);
        console.log(`Page (purl): ${m[2]}`);
    });
}
diagnostic();
