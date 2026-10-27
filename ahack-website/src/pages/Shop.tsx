import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getPublishedProducts } from '../lib/products'
import { getCategories } from '../lib/categories'
import type { Product } from '../data/products'
import type { Category } from '../lib/categories'

export default function Shop() {
    const { category: categorySlug } = useParams()

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [sortBy, setSortBy] = useState('newest')
    const [maxPrice, setMaxPrice] = useState('')
    const [inStockOnly, setInStockOnly] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function loadShop() {
            setLoading(true)
            setError('')

            try {
                const [productResults, categoryResults] =
                    await Promise.all([
                        getPublishedProducts(),
                        getCategories(),
                    ])

                if (!cancelled) {
                    setProducts(productResults)
                    setCategories(categoryResults)
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Could not load the shop.',
                    )
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadShop()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        setSelectedCategory(categorySlug ?? 'all')
    }, [categorySlug])

    const categoryExists =
        !categorySlug ||
        categories.some((category) => category.slug === categorySlug)

    const filteredProducts = useMemo(() => {
        let result = products.filter((product) => {
            const matchesSearch =
                `${product.name} ${product.description ?? ''}`
                    .toLowerCase()
                    .includes(search.trim().toLowerCase())

            const category = categories.find(
                (item) => item.id === product.category_id,
            )

            const matchesCategory =
                selectedCategory === 'all' ||
                category?.slug === selectedCategory

            const matchesPrice =
                maxPrice.trim() === '' ||
                product.price <= Number(maxPrice)

            const matchesStock =
                !inStockOnly || product.stock_quantity > 0

            return (
                matchesSearch &&
                matchesCategory &&
                matchesPrice &&
                matchesStock
            )
        })

        result = [...result]

        if (sortBy === 'price-low') {
            result.sort((a, b) => a.price - b.price)
        } else if (sortBy === 'price-high') {
            result.sort((a, b) => b.price - a.price)
        } else if (sortBy === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name))
        } else {
            result.sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            )
        }

        return result
    }, [
        products,
        categories,
        search,
        selectedCategory,
        sortBy,
        maxPrice,
        inStockOnly,
    ])

    const currentCategory = categories.find(
        (category) => category.slug === selectedCategory,
    )

    function clearFilters() {
        setSearch('')
        setSelectedCategory(categorySlug ?? 'all')
        setSortBy('newest')
        setMaxPrice('')
        setInStockOnly(false)
    }

    return (
        <main className="shop-page">
            <div className="section-heading">
                <p className="eyebrow">THE AHACK COLLECTION</p>
                <h1>
                    {currentCategory?.name ??
                        (categorySlug ? 'Category not found' : 'All Products')}
                </h1>
                <p>Find the right technology for your everyday life.</p>
            </div>

            <div className="shop-toolbar">
                <input
                    type="search"
                    className="shop-search"
                    placeholder="Search products..."
                    aria-label="Search products"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <select
                    className="shop-select"
                    aria-label="Filter by category"
                    value={selectedCategory}
                    onChange={(event) =>
                        setSelectedCategory(event.target.value)
                    }
                >
                    <option value="all">All categories</option>
                    {categories.map((item) => (
                        <option key={item.id} value={item.slug}>
                            {item.name}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    className="shop-select"
                    aria-label="Maximum price in euros"
                    placeholder="Max price (€)"
                    min="0"
                    step="0.01"
                    value={maxPrice}
                    onChange={(event) => {
                        const value = event.target.value
                        if (value === '' || Number(value) >= 0) {
                            setMaxPrice(value)
                        }
                    }}
                />

                <select
                    className="shop-select"
                    aria-label="Sort products"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                >
                    <option value="newest">Newest first</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                    <option value="name">Name: A–Z</option>
                </select>

                <label className="shop-stock-filter">
                    <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(event) =>
                            setInStockOnly(event.target.checked)
                        }
                    />
                    In stock only
                </label>

                <button
                    type="button"
                    className="shop-clear-filters"
                    onClick={clearFilters}
                >
                    Clear filters
                </button>
            </div>

            {loading ? (
                <p>Loading products...</p>
            ) : error ? (
                <p role="alert">Could not load the shop: {error}</p>
            ) : !categoryExists ? (
                <p>That category doesn't exist.</p>
            ) : filteredProducts.length === 0 ? (
                <p>No products match your filters. Try changing them or clearing your filters.</p>
            ) : (
                <>
                    <p className="shop-result-count">
                        {filteredProducts.length}{' '}
                        {filteredProducts.length === 1 ? 'product' : 'products'}
                    </p>

                    <div className="product-grid">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={{
                                    ...product,
                                    id: product.id,
                                    category:
                                        categories.find(
                                            (item) => item.id === product.category_id,
                                        )?.name ?? 'Technology',
                                    image: product.image_url || '',
                                    description: product.description || '',
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </main>
    )
}