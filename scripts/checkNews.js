const SUPABASE_URL = 'https://nwueiinchrvlqfxuxbxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dWVpaW5jaHJ2bHFmeHV4YnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODQxMDAsImV4cCI6MjA4Njc2MDEwMH0.uBCW_BO8O7luMsGOX-w2Ogso2xzc59mV4NrTIAsVudo';

async function checkNews() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/news?select=*&order=created_at.desc&limit=5`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

checkNews().catch(console.error);
