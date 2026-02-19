async function diagnostic() {
    const domain = 'mercadolivre.com.br';
    const keywords = 'Capacete LS2 Rapid';
    const query = encodeURIComponent(`Mercado Livre ${keywords}`); // Sem site:
    const url = `https://www.bing.com/search?q=${query}`;

    console.log('Fetching:', url);
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();

    const anyMLLinks = html.match(/https?:\/\/(produto|articulo|www)\.mercadolivre\.com\.br\/[^"'\s<>]+/gi) || [];
    console.log('ML links found:', anyMLLinks.length);
    anyMLLinks.slice(0, 10).forEach(l => console.log('ML Find:', l));

    if (anyMLLinks.length === 0) {
        console.log('No ML links found. Title from HTML:', html.match(/<title>([^<]+)<\/title>/i)?.[1]);
    }
}
diagnostic();
