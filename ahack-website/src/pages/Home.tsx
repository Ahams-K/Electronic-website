
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getPublishedProducts } from '../lib/products'
import { getCategories } from '../lib/categories'
import type { Product } from '../data/products'
import type { Category } from '../lib/categories'

const categoryImages: Record<string, string> = {
    headphones:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85',
    speakers:
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=85',
    smartphones:
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=85',
}

const categorySubtitles: Record<string, string> = {
    headphones: 'Find your sound.',
    speakers: 'Bring sound to life.',
    smartphones: 'Stay one step ahead.',
}

function Home() {
    const [categories, setCategories] = useState<Category[]>([])
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [categoryError, setCategoryError] = useState('')
    const [productError, setProductError] = useState('')

    useEffect(() => {
        let cancelled = false

        async function loadCategories() {
            try {
                const result = await getCategories()
                if (!cancelled) setCategories(result)
            } catch (err) {
                if (!cancelled) {
                    setCategoryError(
                        err instanceof Error ? err.message : 'Could not load categories.',
                    )
                }
            } finally {
                if (!cancelled) setLoadingCategories(false)
            }
        }

        async function loadFeaturedProducts() {
            try {
                const result = await getPublishedProducts()
                if (!cancelled) setFeaturedProducts(result.slice(0, 3))
            } catch (err) {
                if (!cancelled) {
                    setProductError(
                        err instanceof Error ? err.message : 'Could not load products.',
                    )
                }
            } finally {
                if (!cancelled) setLoadingProducts(false)
            }
        }

        loadCategories()
        loadFeaturedProducts()

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <>
            <section className="hero" id="home">
                <div className="hero-content">
                    <p className="eyebrow">TECHNOLOGY, REDEFINED</p>
                    <h1>
                        Upgrade your
                        <br />
                        everyday<span>.</span>
                    </h1>
                    <p className="hero-description">
                        Discover electronics designed to elevate how you
                        listen, work, play, and live.
                    </p>
                    <Link className="primary-button" to="/shop">
                        Explore products <span>↗</span>
                    </Link>
                </div>

                <div className="hero-visual">
                    <div className="hero-circle">
                        <span className="hero-mark">A.</span>
                    </div>
                    <p className="visual-caption">BUILT FOR YOUR WORLD.</p>
                </div>
            </section>

            <section className="products-section">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">OUR COLLECTION</p>
                        <h2>Explore the essentials.</h2>
                    </div>
                    <Link className="text-link" to="/shop">
                        View all products ↗
                    </Link>
                </div>

                {loadingCategories ? (
                    <p>Loading categories...</p>
                ) : categoryError ? (
                    <p role="alert">Could not load categories: {categoryError}</p>
                ) : categories.length === 0 ? (
                    <p>No categories have been added yet.</p>
                ) : (
                    <div className="category-grid">
                        {categories.map((category, index) => (
                            <Link
                                className="category-card"
                                to={`/shop/${category.slug}`}
                                key={category.id}
                            >
                                <div className="category-image">
                                    {categoryImages[category.slug] ? (
                                        <img
                                            src={categoryImages[category.slug]}
                                            alt={category.name}
                                        />
                                    ) : (
                                        <div className="product-image-placeholder">
                                            {category.name}
                                        </div>
                                    )}
                                    <span className="category-number">
                                        {String(index + 1).padStart(2, '0')} /{' '}
                                        {category.slug.toUpperCase()}
                                    </span>
                                </div>

                                <div className="category-info">
                                    <div>
                                        <h3>{category.name}</h3>
                                        <p>
                                            {categorySubtitles[category.slug] ??
                                                'Explore the collection.'}
                                        </p>
                                    </div>
                                    <span className="category-arrow" aria-hidden="true">
                                        ↗
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="featured-section">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">HANDPICKED FOR YOU</p>
                        <h2>Featured products.</h2>
                    </div>
                    <Link className="text-link" to="/shop">
                        Explore the shop ↗
                    </Link>
                </div>

                {loadingProducts ? (
                    <p>Loading featured products...</p>
                ) : productError ? (
                    <p role="alert">Could not load products: {productError}</p>
                ) : featuredProducts.length === 0 ? (
                    <p>Our featured products are coming soon.</p>
                ) : (
                    <div className="product-grid">
                        {featuredProducts.map((product) => (
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
                )}
            </section>

            <section className="about-section" id="about">
                <p className="eyebrow">THE AHACK STANDARD</p>
                <h2>Better technology.<br />Everyday life.</h2>
                <p>
                    Discover the electronics that fit your world, from personal
                    audio to the devices you rely on every day.
                </p>
                <Link className="primary-button" to="/shop">
                    Discover AHACK <span>↗</span>
                </Link>
            </section>
        </>
    )
}

export default Home
