
import { supabase } from './supabase'

export type Category = {
    id: number
    name: string
    slug: string
    created_at: string
}

export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data ?? []
}
