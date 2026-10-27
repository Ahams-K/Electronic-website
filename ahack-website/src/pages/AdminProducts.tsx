
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminHeader from '../components/AdminHeader'
import { supabase } from '../lib/supabase'
import { getCategories } from '../lib/categories'
import type { Category } from '../data/products'

export default function AdminProducts() {
    const navigate = useNavigate()

    const [categories, setCategories] = useState<Category[]>([])
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [stockQuantity, setStockQuantity] = useState('0')
    const [categoryId, setCategoryId] = useState('')
    const [isPublished, setIsPublished] = useState(false)

    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState('')
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        let active = true

        async function initialise() {
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

                const loadedCategories = await getCategories()

                if (active) {
                    setCategories(loadedCategories)
                }
            } catch {
                if (active) {
                    setError('Unable to load categories. Please refresh the page.')
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        void initialise()

        return () => {
            active = false
        }
    }, [navigate])

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

        if (!file) {
            setImageFile(null)
            return
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

        if (!allowedTypes.includes(file.type)) {
            setError('Choose a JPG, PNG, WebP or GIF image.')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('The image must be 5 MB or smaller.')
            return
        }

        setImageFile(file)
    }

    async function uploadImage(file: File): Promise<string> {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`
        const filePath = `products/${uniqueFileName}`

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
            throw new Error(`Image upload failed: ${uploadError.message}`)
        }

        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

        return data.publicUrl
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')
        setSaving(true)

        let uploadedImagePath: string | null = null

        try {
            const parsedPrice = Number(price)
            const parsedStock = Number(stockQuantity)

            if (!name.trim() || !slug.trim()) {
                throw new Error('Enter a product name and URL slug.')
            }

            if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
                throw new Error('Enter a valid price of €0 or more.')
            }

            if (
                stockQuantity.trim() === '' ||
                !Number.isSafeInteger(parsedStock) ||
                parsedStock < 0
            ) {
                throw new Error('Stock must be a whole number of 0 or more.')
            }

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


            let imageUrl: string | null = null

            if (imageFile) {
                setUploading(true)
                imageUrl = await uploadImage(imageFile)

                // Save the storage path so cleanup still works if
                // creating the product in the database fails.
                const publicUrl = new URL(imageUrl)
                const marker = '/product-images/'

                const markerIndex = publicUrl.pathname.indexOf(marker)

                if (markerIndex === -1) {
                    throw new Error('Could not determine the uploaded image path.')
                }

                uploadedImagePath = decodeURIComponent(
                    publicUrl.pathname.slice(markerIndex + marker.length),
                )
            }

            const { error: insertError } = await supabase
                .from('products')
                .insert({
                    name: name.trim(),
                    slug: slug.trim(),
                    description: description.trim() || null,
                    price: parsedPrice,
                    stock_quantity: parsedStock,
                    category_id: categoryId ? Number(categoryId) : null,
                    image_url: imageUrl,
                    is_published: isPublished,
                })

            if (insertError) {
                throw new Error(
                    insertError.code === '23505'
                        ? 'That URL slug is already being used. Choose another.'
                        : `Could not create product: ${insertError.message}`,
                )
            }

            setSuccess(true)
            setName('')
            setSlug('')
            setDescription('')
            setPrice('')
            setStockQuantity('0')
            setCategoryId('')
            setIsPublished(false)
            setImageFile(null)
        } catch (caughtError) {
            const message =
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Something went wrong while creating the product.'

            setError(message)

            // Remove the newly uploaded image if saving the product failed.
            if (uploadedImagePath) {
                const { error: cleanupError } = await supabase.storage
                    .from('product-images')
                    .remove([uploadedImagePath])

                if (cleanupError) {
                    console.error('Could not clean up the uploaded image:', cleanupError)
                }
            }
        } finally {
            setUploading(false)
            setSaving(false)
        }
    }

    return (
        <>
            <AdminHeader />

            <main className="shop-page admin-products-page">
                <div className="admin-page-heading">
                    <p className="eyebrow">CONTROL PANEL / INVENTORY</p>
                    <h1>Add product<span>.</span></h1>
                    <p>Add a product to your AHACK catalogue.</p>
                </div>

                {loading ? (
                    <p>Loading categories...</p>
                ) : success ? (
                    <section className="admin-create-success">
                        <p className="eyebrow">PRODUCT CREATED</p>
                        <h2>Looking good<span>.</span></h2>
                        <p>Your product has been saved successfully.</p>

                        <div className="admin-success-actions">
                            <button
                                className="primary-button"
                                type="button"
                                onClick={() => {
                                    setSuccess(false)
                                    setError('')
                                }}
                            >
                                Add another product
                            </button>

                            <button
                                className="admin-secondary-button"
                                type="button"
                                onClick={() => navigate('/admin')}
                            >
                                Return to dashboard
                            </button>
                        </div>
                    </section>
                ) : (
                    <form className="admin-product-form" onSubmit={handleSubmit}>
                        <div className="admin-form-field">
                            <label htmlFor="product-name">Product name *</label>
                            <input
                                id="product-name"
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
                            <label htmlFor="product-slug">URL slug *</label>
                            <input
                                id="product-slug"
                                value={slug}
                                onChange={(event) => setSlug(createSlug(event.target.value))}
                                required
                            />
                            <small>Must be unique. Used in the product URL.</small>
                        </div>

                        <div className="admin-form-field">
                            <label htmlFor="product-description">Description</label>
                            <textarea
                                id="product-description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={5}
                            />
                        </div>

                        <div className="admin-form-grid">
                            <div className="admin-form-field">
                                <label htmlFor="product-price">Price (€) *</label>
                                <input
                                    id="product-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(event) => setPrice(event.target.value)}
                                    required
                                />
                            </div>

                            <div className="admin-form-field">
                                <label htmlFor="product-stock">Stock quantity *</label>
                                <input
                                    id="product-stock"
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
                            <label htmlFor="product-category">Category</label>
                            <select
                                id="product-category"
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
                            <label htmlFor="product-image">Product image</label>
                            <input
                                id="product-image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={(event) =>
                                    handleImageChange(event.target.files?.[0] ?? null)
                                }
                            />
                            <small>JPG, PNG, WebP or GIF. Maximum size: 5 MB.</small>

                            {imagePreview && (
                                <div className="admin-upload-preview">
                                    <img src={imagePreview} alt="Selected product preview" />
                                    <button
                                        type="button"
                                        className="admin-secondary-button"
                                        onClick={() => setImageFile(null)}
                                    >
                                        Remove image
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
                                        ? 'Saving product...'
                                        : 'Create product ↗'}
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
