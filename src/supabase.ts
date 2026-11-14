import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mklvpkchmkazphdzdhzu.supabase.co';
const supabaseKey = 'sb_publishable_79D4XuzkNPuQZno_0LgyCA_NNCs03rX';

export const supabase = createClient(supabaseUrl, supabaseKey);