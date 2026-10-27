
import { supabase } from './supabase'

export async function testSupabaseConnection() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(5)

    if (error) {
        console.error('Supabase connection failed:', error.message)
        return
    }

    console.log('Supabase connected! Products:', data)
}
