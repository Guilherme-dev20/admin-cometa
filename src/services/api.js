import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydhmwqdeofhdxkdfytou.supabase.co'
const supabaseKey = 'sb_publishable_2o3mZ83L2KyKMogS517TUg_ADsQz-UV'

export const supabase = createClient(supabaseUrl, supabaseKey)
