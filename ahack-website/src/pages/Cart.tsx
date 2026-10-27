
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

type StockInfo = {
    stock_quantity: number
    is_published: boolean
}

export default function Cart() {
    const {
        items,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
    } = useCart()

    const [stock, setStock] = useState<Record<string, StockInfo>>({})
    const [checkingStock, setCheckingStock] = useState(true)
    const [stockError, setStockError] = useState('')

    const checkStock = useCallback(async () => {
        if (items.length === 0) {
            setStock({})
            setCheckingStock(false)
            setStockError('')
            return
        }

        setCheckingStock(true)
        setStockError('')

        const ids = items.map(({ product }) => Number(product.id))

        const { data, error } = await supabase
            .from('products')
            .select('id, stock_quantity, is_published')
            .in('id', ids)

        if (error) {
            setStockError('We could not verify current stock. Please try again.')
            setCheckingStock(false)
            return
        }

        const latestStock: Record<string, StockInfo> = {}

        for (const product of data ?? []) {
            latestStock[String(product.id)] = {
                stock_quantity: product.stock_quantity,
                is_published: product.is_published,
            }
        }

        setStock(latestStock)

        // Clamp quantities to current stock, or remove products that are
        // unpublished, deleted, or no longer available.
        for (const item of items) {
            const latest = latestStock[item.product.id]

            if (!latest || !latest.is_published || latest.stock_quantity <= 0) {
                removeFromCart(item.product.id)
            } else if (item.quantity > latest.stock_quantity) {
                updateQuantity(item.product.id, latest.stock_quantity)
            }
        }

        setCheckingStock(false)
    }, [items, removeFromCart, updateQuantity])

    useEffect(() => {
        void checkStock()
    }, [checkStock])

    return (
        <main className="shop-page cart-page">
            <div className="section-heading">
                <p className="eyebrow">YOUR SELECTION</p>
                <h1>Your cart<span>.</span></h1>
                <p>
                    {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
                </p>
            </div>

            {checkingStock && <p>Checking current stock...</p>}

            {stockError && (
                <div role="alert">
                    <p>{stockError}</p>
                    <button
                        className="cart-clear"
                        type="button"
                        onClick={() => void checkStock()}
                    >
                        Retry stock check
                    </button>
                </div>
            )}

            {!checkingStock && !stockError && items.length > 0 && (
                <p className="cart-stock-notice" role="status">
                    Stock checked against the latest product inventory.
                </p>
            )}

            {items.length === 0 ? (
                <div className="cart-empty">
                    <h2>Your cart is empty.</h2>
                    <p>Find something worth adding to your setup.</p>
                    <Link className="primary-button" to="/shop">
                        Explore products ↗
                    </Link>
                </div>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items">
                        {items.map(({ product, quantity }) => {
                            const latest = stock[product.id]

                            return (
                                <article className="cart-item" key={product.id}>
                                    <div className="cart-item-image">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} />
                                        ) : (
                                            <div className="product-image-placeholder">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    <div className="cart-item-info">
                                        <h2>{product.name}</h2>
                                        <p>€{product.price.toFixed(2)} each</p>

                                        {latest && (
                                            <p className="product-stock">
                                                {latest.stock_quantity <= 0
                                                    ? 'Out of stock'
                                                    : `${latest.stock_quantity} available`}
                                            </p>
                                        )}

                                        <div className="cart-quantity">
                                            <button
                                                type="button"
                                                aria-label={`Decrease quantity of ${product.name}`}
                                                onClick={() =>
                                                    updateQuantity(product.id, quantity - 1)
                                                }
                                            >
                                                −
                                            </button>

                                            <span>{quantity}</span>

                                            <button
                                                type="button"
                                                aria-label={`Increase quantity of ${product.name}`}
                                                disabled={
                                                    !latest ||
                                                    quantity >= latest.stock_quantity ||
                                                    !latest.is_published ||
                                                    checkingStock ||
                                                    Boolean(stockError)
                                                }
                                                onClick={() =>
                                                    updateQuantity(product.id, quantity + 1)
                                                }
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            className="cart-remove"
                                            type="button"
                                            onClick={() => removeFromCart(product.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <p className="cart-item-total">
                                        €{(product.price * quantity).toFixed(2)}
                                    </p>
                                </article>
                            )
                        })}
                    </div>

                    <aside className="cart-summary">
                        <p className="eyebrow">ORDER SUMMARY</p>

                        <div className="cart-summary-row">
                            <span>Subtotal</span>
                            <strong>€{subtotal.toFixed(2)}</strong>
                        </div>

                        <p className="cart-note">
                            Shipping and any applicable taxes will be calculated at checkout.
                        </p>

                        <button
                            className="cart-clear"
                            type="button"
                            onClick={clearCart}
                        >
                            Clear cart
                        </button>

                        <button
                            className="primary-button cart-checkout"
                            type="button"
                            disabled
                        >
                            Checkout coming soon
                        </button>

                        <Link className="text-link" to="/shop">
                            ← Continue shopping
                        </Link>
                    </aside>
                </div>
            )}
        </main>
    )
}
