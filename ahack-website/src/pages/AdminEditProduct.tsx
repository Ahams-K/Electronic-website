
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminHeader from '../components/AdminHeader'
import { supabase } from '../lib/supabase'
import { getCategories } from '../lib/categories'
import type { Category } from '../data/products'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]

export default function AdminEditProduct() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [categories, setCategories] = useState<Category[]>([])
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [stockQuantity, setStockQuantity] = useState('0')
    const [categoryId, setCategoryId] = useState('')
    const [currentImageUrl, setCurrentImageUrl] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [removeImage, setRemoveImage] = useState(false)
    const [imagePreview, setImagePreview] = useState('')
    const [isPublished, setIsPublished] = useState(false)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        let active = true

        async function loadProduct() {
            try {
                const { data: sessionData, error: sessionError } =
                    await supabase.auth.getSession()

                const user = sessionData.session?.user

                if (sessionError || !user) {
                    navigate('/admin/login', { replace: true })
                    return
                }

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

                const [productResult, loadedCategories] = await Promise.all([
                    supabase.from('products').select('*').eq('id', id).maybeSingle(),
                    getCategories(),
                ])

                if (productResult.error) {
                    throw new Error(productResult.error.message)
                }

                if (!productResult.data) {
                    throw new Error('Product not found.')
                }

                if (!active) return

                const product = productResult.data

                setName(product.name)
                setSlug(product.slug)
                setDescription(product.description ?? '')
                setPrice(String(product.price))
                setStockQuantity(String(product.stock_quantity))
                setCategoryId(
                    product.category_id ? String(product.category_id) : '',
                )
                setCurrentImageUrl(product.image_url ?? '')
                setIsPublished(product.is_published)
                setCategories(loadedCategories)
            } catch (caughtError) {
                if (active) {
                    setError(
                        caughtError instanceof Error
                            ? caughtError.message
                            : 'Unable to load this product.',
                    )
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        if (!id) {
            setError('Invalid product ID.')
            setLoading(false)
        } else {
            void loadProduct()
        }

        return () => {
            active = false
        }
    }, [id, navigate])

    useEffect(() => {
        if (!imageFile) {
            setImagePreview('')
            return
        }

        const objectUrl = URL.createObjectURL(imageFile)
        setImagePreview(objectUrl)

        return () => URL.revokeObjectURL(objectUrl)
    }, [imageFile])

    function createSlug(value: string) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
    }

    function handleImageChange(file: File | null) {
        setError('')

        if (!file) return

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError('Choose a JPG, PNG, WebP or GIF image.')
            return
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError('The image must be 5 MB or smaller.')
            return
        }

        setImageFile(file)
        setRemoveImage(false)
    }

    function getStoragePath(publicUrl: string): string | null {
        try {
            const url = new URL(publicUrl)
            const marker = '/storage/v1/object/public/product-images/'

            const markerIndex = url.pathname.indexOf(marker)

            if (markerIndex === -1) return null

            return decodeURIComponent(
                url.pathname.slice(markerIndex + marker.length),
            )
        } catch {
            return null
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setSuccess(false)

        const parsedPrice = Number(price)
        const parsedStock = Number(stockQuantity)

        if (!name.trim() || !slug.trim()) {
            setError('Enter a product name and URL slug.')
            return
        }

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            setError('Enter a valid price of €0 or more.')
            return
        }

        if (
            stockQuantity.trim() === '' ||
            !Number.isSafeInteger(parsedStock) ||
            parsedStock < 0
        ) {
            setError('Stock must be a whole number of 0 or more.')
            return
        }

        setSaving(true)

        let newlyUploadedPath: string | null = null

        try {
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession()

            const user = sessionData.session?.user

            if (sessionError || !user) {
                navigate('/admin/login', { replace: true })
                return
            }

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

            let nextImageUrl = currentImageUrl || null

            if (removeImage) {
                nextImageUrl = null
            }

            if (imageFile) {
                setUploading(true)

                const extension =
                    imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'

                const filePath = `products/${crypto.randomUUID()}.${extension}`

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, imageFile, {
                        cacheControl: '3600',
                        contentType: imageFile.type,
                        upsert: false,
                    })

                if (uploadError) {
                    throw new Error(`Image upload failed: ${uploadError.message}`)
                }

                newlyUploadedPath = filePath

                const { data: publicUrlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath)

                nextImageUrl = publicUrlData.publicUrl
            }

            const { error: updateError } = await supabase
                .from('products')
                .update({
                    name: name.trim(),
                    slug: slug.trim(),
                    description: description.trim() || null,
                    price: parsedPrice,
                    stock_quantity: parsedStock,
                    category_id: categoryId ? Number(categoryId) : null,
                    image_url: nextImageUrl,
                    is_published: isPublished,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)

            if (updateError) {
                throw new Error(
                    updateError.code === '23505'
                        ? 'That URL slug is already being used by another product.'
                        : updateError.message,
                )
            }

            // The database now points to the new image (or no image).
            // Remove the old file only after the database update succeeds.
            const oldImagePath = getStoragePath(currentImageUrl)

            const imageWasReplaced =
                Boolean(imageFile) || removeImage

            if (
                imageWasReplaced &&
                oldImagePath &&
                oldImagePath !== newlyUploadedPath
            ) {
                const { error: removalError } = await supabase.storage
                    .from('product-images')
                    .remove([oldImagePath])

                if (removalError) {
                    console.error('Could not remove the previous image:', removalError)
                }
            }

            setCurrentImageUrl(nextImageUrl ?? '')
            setImageFile(null)
            setRemoveImage(false)
            setSuccess(true)
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Something went wrong while updating the product.',
            )

            // Clean up a newly uploaded file if saving the product failed.
            if (newlyUploadedPath) {
                const { error: cleanupError } = await supabase.storage
                    .from('product-images')
                    .remove([newlyUploadedPath])

                if (cleanupError) {
                    console.error('Could not clean up the uploaded image:', cleanupError)
                }
            }
        } finally {
            setUploading(false)
            setSaving(false)
        }
    }

    const displayedImage = imagePreview
        ? imagePreview
        : !removeImage
            ? currentImageUrl
            : ''

    return (
        <>
            <AdminHeader />

            <main className="shop-page admin-products-page">
                <div className="admin-page-heading">
                    <p className="eyebrow">CONTROL PANEL / INVENTORY</p>
                    <h1>Edit product<span>.</span></h1>
                    <p>Update your product details and image.</p>
                </div>

                {loading ? (
                    <p>Loading product...</p>
                ) : success ? (
                    <section className="admin-create-success">
                        <p className="eyebrow">CHANGES SAVED</p>
                        <h2>Product updated<span>.</span></h2>
                        <p>Your product details have been saved successfully.</p>

                        <div className="admin-success-actions">
                            <button
                                className="primary-button"
                                type="button"
                                onClick={() => navigate('/admin')}
                            >
                                Return to dashboard ↗
                            </button>

                            <button
                                className="admin-secondary-button"
                                type="button"
                                onClick={() => {
                                    setSuccess(false)
                                    setError('')
                                }}
                            >
                                Continue editing
                            </button>
                        </div>
                    </section>
                ) : (
                    <form className="admin-product-form" onSubmit={handleSubmit}>
                        <div className="admin-form-field">
                            <label htmlFor="edit-name">Product name *</label>
                            <input
                                id="edit-name"
                                value={name}
                                onChange={(event) => {
                                    const value = event.target.value
                                    setName(value)
                                    setSlug(createSlug(value))
                                }}
                                required
                            />
                        </div>

                        <div className="admin-form-field">
                            <label htmlFor="edit-slug">URL slug *</label>
                            <input
                                id="edit-slug"
                                value={slug}
                                onChange={(event) => setSlug(createSlug(event.target.value))}
                                required
                            />
                            <small>Must be unique. Used in the product URL.</small>
                        </div>

                        <div className="admin-form-field">
                            <label htmlFor="edit-description">Description</label>
                            <textarea
                                id="edit-description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={5}
                            />
                        </div>

                        <div className="admin-form-grid">
                            <div className="admin-form-field">
                                <label htmlFor="edit-price">Price (€) *</label>
                                <input
                                    id="edit-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(event) => setPrice(event.target.value)}
                                    required
                                />
                            </div>

                            <div className="admin-form-field">
                                <label htmlFor="edit-stock">Stock quantity *</label>
                                <input
                                    id="edit-stock"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={stockQuantity}
                                    onChange={(event) => setStockQuantity(event.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="admin-form-field">
                            <label htmlFor="edit-category">Category</label>
                            <select
                                id="edit-category"
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                            >
                                <option value="">No category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-form-field">
                            <label htmlFor="edit-image">Product image</label>
                            <input
                                id="edit-image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={(event) =>
                                    handleImageChange(event.target.files?.[0] ?? null)
                                }
                            />
                            <small>
                                Choose a replacement image, or keep the existing one.
                                JPG, PNG, WebP or GIF, maximum 5 MB.
                            </small>

                            {displayedImage && (
                                <div className="admin-upload-preview">
                                    <img src={displayedImage} alt="Product image preview" />
                                </div>
                            )}

                            {(currentImageUrl || imageFile) && !removeImage && (
                                <button
                                    className="admin-secondary-button"
                                    type="button"
                                    onClick={() => {
                                        setImageFile(null)
                                        setRemoveImage(true)
                                        setError('')
                                    }}
                                >
                                    Remove product image
                                </button>
                            )}

                            {removeImage && (
                                <div className="admin-image-removed">
                                    <p>The image will be removed when you save.</p>
                                    <button
                                        className="admin-secondary-button"
                                        type="button"
                                        onClick={() => {
                                            setRemoveImage(false)
                                            setError('')
                                        }}
                                    >
                                        Keep existing image
                                    </button>
                                </div>
                            )}
                        </div>

                        <label className="admin-publish-toggle">
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(event) => setIsPublished(event.target.checked)}
                            />
                            Publish this product in the public store
                        </label>

                        {error && (
                            <p className="admin-error" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="admin-success-actions">
                            <button
                                className="primary-button"
                                type="submit"
                                disabled={saving || uploading}
                            >
                                {uploading
                                    ? 'Uploading image...'
                                    : saving
                                        ? 'Saving changes...'
                                        : 'Save changes ↗'}
                            </button>

                            <Link className="admin-secondary-button" to="/admin">
                                Cancel
                            </Link>
                        </div>
                    </form>
                )}
            </main>
        </>
    )
}
