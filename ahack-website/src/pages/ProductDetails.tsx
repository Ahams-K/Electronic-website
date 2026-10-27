
import { useCart } from '../context/CartContext'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublishedProducts } from '../lib/products'
import type { Product } from '../data/products'

export default function ProductDetails() {
    const { id } = useParams()
    const { addToCart } = useCart()

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [addedToCart, setAddedToCart] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function loadProduct() {
            setLoading(true)
            setError('')

            try {
                const products = await getPublishedProducts()

                const foundProduct = products.find(
                    (item) => String(item.id) === id,
                )

                if (!cancelled) {
                    setProduct(foundProduct ?? null)
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Could not load this product.',
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadProduct()

        return () => {
            cancelled = true
        }
    }, [id])

    if (loading) {
        return (
            <main className="shop-page">
                <p>Loading product...</p>
            </main>
        )
    }

    if (error) {
        return (
            <main className="shop-page">
                <p role="alert">Could not load product: {error}</p>
                <Link to="/shop">Back to shop</Link>
            </main>
        )
    }

    if (!product) {
        return (
            <main className="shop-page">
                <h1>Product not found</h1>
                <p>This product may be unavailable or unpublished.</p>
                <Link to="/shop">Back to shop</Link>
            </main>
        )
    }

    const isOutOfStock = product.stock_quantity <= 0

    return (
        <main className="product-details-page">
            <Link className="text-link" to="/shop">
                ← Back to shop
            </Link>

            <div className="product-details-layout">
                <div className="product-details-image">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                        />
                    ) : (
                        <div className="product-image-placeholder">
                            Image coming soon
                        </div>
                    )}
                </div>

                <div className="product-details-info">
                    <p className="eyebrow">THE AHACK COLLECTION</p>
                    <h1>{product.name}</h1>

                    <p className="product-details-price">
                        €{product.price.toFixed(2)}
                    </p>

                    <p className="product-details-description">
                        {product.description || 'More details coming soon.'}
                    </p>

                    <p
                        className={`product-stock ${
                            isOutOfStock ? 'out-of-stock-text' : 'in-stock-text'
                        }`}
                        role="status"
                    >
                        {isOutOfStock
                            ? 'Currently out of stock'
                            : `In stock — ${product.stock_quantity} available`}
                    </p>

                    <button
                        className="primary-button"
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                            addToCart({
                                id: String(product.id),
                                name: product.name,
                                price: product.price,
                                image: product.image_url || '',
                                description: product.description || '',
                                category: 'Technology',
                                stock_quantity: product.stock_quantity,
                            })

                            setAddedToCart(true)
                        }}
                    >
                        {isOutOfStock ? 'Out of stock' : 'Add to cart'}
                        {!isOutOfStock && <span> ↗</span>}
                    </button>

                    {addedToCart && !isOutOfStock && (
                        <p className="cart-success-message" role="status">
                            Added to cart.{' '}
                            <Link to="/cart">View cart</Link>
                        </p>
                    )}
                </div>
            </div>
        </main>
    )
}
