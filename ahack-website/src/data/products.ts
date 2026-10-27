
export type Product = {
    id: number
    category_id: number | null
    name: string
    slug: string
    description: string | null
    price: number
    stock_quantity: number
    image_url: string | null
    is_published: boolean
    created_at: string
    updated_at: string

    // Optional display fields used by the storefront
    category?: string
    image?: string | null
}

export type Products = Product

export type Category = {
    id: number
    name: string
    slug: string
}
