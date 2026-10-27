
import { Link } from 'react-router-dom'
import type { Products } from '../data/products.ts'

type ProductCardProps = {
    product: Products
}

function ProductCard({ product }: ProductCardProps) {
    const stockQuantity = product.stock_quantity ?? 0
    const isOutOfStock = stockQuantity <= 0

    return (
        <article className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
            <Link
                className="product-image"
                to={`/product/${product.id}`}
                aria-label={`View ${product.name}`}
            >
                {product.image ? (
                    <img src={product.image} alt={product.name} />
                ) : (
                    <div className="product-image-placeholder">
                        Image coming soon
                    </div>
                )}

                {isOutOfStock && (
                    <span className="product-stock-badge">
                        Out of stock
                    </span>
                )}

                <span className="product-view">View product ↗</span>
            </Link>

            <div className="product-card-info">
                <p className="product-category">{product.category}</p>

                <Link
                    className="product-name"
                    to={`/product/${product.id}`}
                >
                    {product.name}
                </Link>

                <div className="product-card-bottom">
                    <span className="product-price">
                        €{product.price.toFixed(2)}
                    </span>

                    <Link
                        className="product-arrow"
                        to={`/product/${product.id}`}
                        aria-label={`View ${product.name}`}
                    >
                        ↗
                    </Link>
                </div>
            </div>
        </article>
    )
}

export default ProductCard
