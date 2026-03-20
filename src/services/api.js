import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydhmwqdeofhdxkdfytou.supabase.co'
const supabaseKey = 'sb_publishable_2o3mZ83L2KyKMogS517TUg_ADsQz-UV'

// iOS Safari em modo privado bloqueia localStorage — usa memória como fallback
let storage;
try {
  localStorage.setItem('_sb_test', '1');
  localStorage.removeItem('_sb_test');
  storage = localStorage;
} catch {
  const mem = {};
  storage = {
    getItem: (k) => mem[k] ?? null,
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  };
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { storage, persistSession: true, detectSessionInUrl: false },
})
