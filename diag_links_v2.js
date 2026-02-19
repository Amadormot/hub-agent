async function diagnostic() {
    const domain = 'mercadolivre.com.br';
    const keywords = 'Capacete LS2 Rapid';
    const query = encodeURIComponent(`site:${domain} ${keywords}`);
    const url = `https://www.bing.com/search?q=${query}`;

    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();

    const links = html.match(/https?:\/\/[^"'\s<>]+/gi) || [];
    const mlLinks = links.filter(l => l.includes('mercadolivre.com.br'));

    console.log('Total links:', links.length);
    console.log('ML links:', mlLinks.length);
    mlLinks.forEach(l => console.log('ML Find:', l));
}
diagnostic();
