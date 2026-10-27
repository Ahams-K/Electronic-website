
import { supabase } from './supabase'
import type { Product } from '../data/products'

export async function getPublishedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? []).map((product) => ({
        ...product,
        price: Number(product.price),
    })) as Product[]
}
