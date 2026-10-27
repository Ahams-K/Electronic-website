
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminHeader from '../components/AdminHeader'
import { supabase } from '../lib/supabase'
import type { Product } from '../data/products'

export default function AdminDashboard() {
    const navigate = useNavigate()

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingId, setUpdatingId] = useState<number | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const loadProducts = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession()

            if (sessionError || !sessionData.session?.user) {
                navigate('/admin/login', { replace: true })
                return
            }

            const user = sessionData.session.user

            const { data: adminRecord, error: adminError } = await supabase
                .from('admin_users')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (adminError || !adminRecord) {
                await supabase.auth.signOut()
                navigate('/admin/login', { replace: true })
                return
            }

            const { data, error: productsError } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })

            if (productsError) {
                setError(productsError.message)
                return
            }

            setProducts((data ?? []) as Product[])
        } catch {
            setError('Unable to load products. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        void loadProducts()
    }, [loadProducts])

    async function updateProduct(
        product: Product,
        changes: Partial<Pick<Product, 'is_published' | 'stock_quantity'>>,
    ) {
        setUpdatingId(product.id)
        setError('')

        try {
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    ...changes,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', product.id)

            if (updateError) {
                setError(`Could not update "${product.name}": ${updateError.message}`)
                return
            }

            setProducts((currentProducts) =>
                currentProducts.map((item) =>
                    item.id === product.id ? { ...item, ...changes } : item,
                ),
            )
        } catch {
            setError(`Unable to update "${product.name}". Please try again.`)
        } finally {
            setUpdatingId(null)
        }
    }

    async function restockProduct(product: Product) {
        const answer = window.prompt(
            `Enter the new total stock quantity for "${product.name}".`,
            product.stock_quantity > 0 ? String(product.stock_quantity) : '10',
        )

        if (answer === null) return

        const quantity = Number(answer.trim())

        if (
            answer.trim() === '' ||
            !Number.isSafeInteger(quantity) ||
            quantity < 0
        ) {
            setError('Stock quantity must be a whole number of 0 or more.')
            return
        }

        await updateProduct(product, { stock_quantity: quantity })
    }

    async function deleteProduct(product: Product) {
        const confirmed = window.confirm(
            `Delete "${product.name}" permanently? This cannot be undone.`,
        )

        if (!confirmed) return

        setDeletingId(product.id)
        setError('')

        try {
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id)

            if (deleteError) {
                setError(`Could not delete "${product.name}": ${deleteError.message}`)
                return
            }

            setProducts((currentProducts) =>
                currentProducts.filter((item) => item.id !== product.id),
            )
        } catch {
            setError('Unable to delete this product. Please try again.')
        } finally {
            setDeletingId(null)
        }
    }

    const publishedCount = products.filter(
        (product) => product.is_published,
    ).length

    const draftCount = products.length - publishedCount

    const outOfStockCount = products.filter(
        (product) => product.stock_quantity === 0,
    ).length

    return (
        <>
            <AdminHeader />

            <main className="shop-page admin-dashboard">
                <div className="admin-page-heading">
                    <p className="eyebrow">AHACK / CONTROL PANEL</p>
                    <h1>Dashboard<span>.</span></h1>
                    <p>Manage your products, inventory and store visibility.</p>
                </div>

                <section className="admin-stats" aria-label="Store statistics">
                    <div className="admin-stat-card">
                        <span>Total products</span>
                        <strong>{products.length}</strong>
                    </div>

                    <div className="admin-stat-card">
                        <span>Published</span>
                        <strong>{publishedCount}</strong>
                    </div>

                    <div className="admin-stat-card">
                        <span>Drafts</span>
                        <strong>{draftCount}</strong>
                    </div>

                    <div className="admin-stat-card">
                        <span>Out of stock</span>
                        <strong>{outOfStockCount}</strong>
                    </div>
                </section>

                <div className="admin-dashboard-toolbar">
                    <div>
                        <h2>Your products</h2>
                        <p>Manage prices, stock, visibility and product details.</p>
                    </div>

                    <Link className="primary-button" to="/admin/products/new">
                        + Add product
                    </Link>
                </div>

                {error && (
                    <div className="admin-error" role="alert">
                        <p>{error}</p>
                        <button
                            className="admin-secondary-button"
                            type="button"
                            onClick={() => void loadProducts()}
                            disabled={loading}
                        >
                            Refresh products
                        </button>
                    </div>
                )}

                {loading ? (
                    <p className="admin-loading">Loading your products...</p>
                ) : products.length === 0 ? (
                    <section className="admin-empty-state">
                        <h2>No products yet.</h2>
                        <p>Add your first product to start building your store.</p>
                        <Link className="primary-button" to="/admin/products/new">
                            Add your first product ↗
                        </Link>
                    </section>
                ) : (
                    <div className="admin-products-list">
                        {products.map((product) => {
                            const isUpdating = updatingId === product.id
                            const isDeleting = deletingId === product.id
                            const isOutOfStock = product.stock_quantity === 0

                            return (
                                <article className="admin-product-row" key={product.id}>
                                    <div className="admin-product-main">
                                        {product.image_url ? (
                                            <img
                                                className="admin-product-thumbnail"
                                                src={product.image_url}
                                                alt={product.name}
                                            />
                                        ) : (
                                            <div className="admin-product-thumbnail admin-no-image">
                                                AHACK
                                            </div>
                                        )}

                                        <div className="admin-product-info">
                                            <h3>{product.name}</h3>

                                            <p className="admin-product-meta">
                                                Slug: {product.slug}
                                            </p>

                                            <p className="admin-product-meta">
                                                Stock quantity: {product.stock_quantity}
                                            </p>

                                            <p className="admin-product-price">
                                                €{Number(product.price).toFixed(2)}
                                            </p>

                                            <div className="admin-product-badges">
                        <span
                            className={
                                product.is_published
                                    ? 'admin-status admin-status-published'
                                    : 'admin-status admin-status-draft'
                            }
                        >
                          {product.is_published ? 'Published' : 'Draft'}
                        </span>

                                                <span
                                                    className={
                                                        isOutOfStock
                                                            ? 'admin-stock-status admin-stock-out'
                                                            : 'admin-stock-status admin-stock-available'
                                                    }
                                                >
                          {isOutOfStock ? 'Out of stock' : 'In stock'}
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-product-actions">
                                        <button
                                            className="admin-secondary-button"
                                            type="button"
                                            onClick={() =>
                                                navigate(`/admin/products/${product.id}/edit`)
                                            }
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="admin-secondary-button"
                                            type="button"
                                            onClick={() =>
                                                void updateProduct(product, {
                                                    is_published: !product.is_published,
                                                })
                                            }
                                            disabled={isUpdating || isDeleting}
                                        >
                                            {isUpdating
                                                ? 'Updating...'
                                                : product.is_published
                                                    ? 'Unpublish'
                                                    : 'Publish'}
                                        </button>

                                        {isOutOfStock ? (
                                            <button
                                                className="admin-stock-button"
                                                type="button"
                                                onClick={() => void restockProduct(product)}
                                                disabled={isUpdating || isDeleting}
                                            >
                                                {isUpdating ? 'Updating...' : 'Back in stock'}
                                            </button>
                                        ) : (
                                            <button
                                                className="admin-secondary-button"
                                                type="button"
                                                onClick={() =>
                                                    void updateProduct(product, { stock_quantity: 0 })
                                                }
                                                disabled={isUpdating || isDeleting}
                                            >
                                                {isUpdating ? 'Updating...' : 'Mark out of stock'}
                                            </button>
                                        )}

                                        <button
                                            className="admin-delete-button"
                                            type="button"
                                            onClick={() => void deleteProduct(product)}
                                            disabled={isUpdating || isDeleting}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </main>
        </>
    )
}
