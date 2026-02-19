async function diagnostic() {
    const domain = 'mercadolivre.com.br';
    const keywords = 'Moleton Yamaha Racing';
    const query = encodeURIComponent(`site:${domain} ${keywords}`);
    const url = `https://www.bing.com/search?q=${query}`;

    console.log('Fetching:', url);
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    console.log('HTML Length:', html.length);

    // Look for any mercado livre links
    const anyMLLinks = html.match(/https?:\/\/[^"'\s<>]+mercadolivre\.com\.br\/[^"'\s<>]+/gi);
    console.log('Total ML links found:', anyMLLinks ? anyMLLinks.length : 0);
    if (anyMLLinks) {
        console.log('First 5 links found:');
        anyMLLinks.slice(0, 5).forEach(l => console.log(l));
    } else {
        console.log('Snippet of HTML:');
        console.log(html.substring(0, 1000));
    }
}
diagnostic();
