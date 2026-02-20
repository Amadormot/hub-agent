const SUPABASE_URL = 'https://nwueiinchrvlqfxuxbxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dWVpaW5jaHJ2bHFmeHV4YnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODQxMDAsImV4cCI6MjA4Njc2MDEwMH0.uBCW_BO8O7luMsGOX-w2Ogso2xzc59mV4NrTIAsVudo';

async function cleanup() {
    console.log('🧹 Iniciando limpeza de produtos inválidos...');

    // 1. Deletar produtos com placeholder de preço
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?price=eq.VER PREÇO NA LOJA`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (res.ok) console.log('✅ Produtos sem preço deletados.');
    else console.error('❌ Erro ao deletar produtos sem preço:', await res.text());

    // 2. Deletar produtos irrelevantes detectados (Stitch)
    const resStitch = await fetch(`${SUPABASE_URL}/rest/v1/products?name=ilike.*Stitch*`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (resStitch.ok) console.log('✅ Produtos irrelevantes (Stitch) deletados.');

    // 3. Deletar produtos genericos de "Camiseta Moto Hub" se o mestre quiser (opcional)
    // No caso, vou focar no que ele reclamou explicitamente.
}

cleanup();
