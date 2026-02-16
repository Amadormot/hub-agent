import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // Re-enabled after fixing issues
        storageKey: 'moto_hub_auth_v2', // New key to avoid old conflicts
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
});
