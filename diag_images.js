const keywords = 'Capacete LS2 Rapid';
const query = encodeURIComponent(keywords + ' white background');
const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

async function test() {
    console.log('Testing URL:', url);
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    console.log('HTML Byte Length:', html.length);

    // Find murl matches
    const matches = [...html.matchAll(/"murl":"(https?:\/\/[^"]+)"/gi)];
    console.log('Found murl matches:', matches.length);
    if (matches.length > 0) {
        console.log('First 3 matches:');
        matches.slice(0, 3).forEach((m, i) => console.log(`${i + 1}: ${m[1].substring(0, 100)}`));
    } else {
        console.log('No murl matches found. Sample HTML snippet:');
        console.log(html.substring(0, 1000));
    }
}

test();
