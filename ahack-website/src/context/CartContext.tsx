
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react'
import type { ReactNode } from 'react'

export type CartProduct = {
    id: string
    name: string
    price: number
    image: string
    description: string
    category: string
    stock_quantity?: number
}

export type CartItem = {
    product: CartProduct
    quantity: number
}

type CartContextType = {
    items: CartItem[]
    addToCart: (product: CartProduct) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    cartCount: number
    subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'ahack-cart'

function readCart(): CartItem[] {
    try {
        const savedCart = localStorage.getItem(STORAGE_KEY)
        return savedCart ? JSON.parse(savedCart) as CartItem[] : []
    } catch {
        return []
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(readCart)

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }, [items])

    function addToCart(product: CartProduct) {
        // Block adding products that explicitly have no stock.
        if (
            typeof product.stock_quantity === 'number' &&
            product.stock_quantity <= 0
        ) {
            return
        }

        setItems((currentItems) => {
            const existingItem = currentItems.find(
                (item) => item.product.id === product.id,
            )

            const currentQuantity = existingItem?.quantity ?? 0

            // Enforce the stock limit when stock information is available.
            if (
                typeof product.stock_quantity === 'number' &&
                currentQuantity >= product.stock_quantity
            ) {
                return currentItems
            }

            if (existingItem) {
                return currentItems.map((item) =>
                    item.product.id === product.id
                        ? {
                            ...item,
                            product: {
                                ...item.product,
                                ...product,
                            },
                            quantity: item.quantity + 1,
                        }
                        : item,
                )
            }

            return [...currentItems, { product, quantity: 1 }]
        })
    }

    function removeFromCart(productId: string) {
        setItems((currentItems) =>
            currentItems.filter((item) => item.product.id !== productId),
        )
    }

    function updateQuantity(productId: string, quantity: number) {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }

        setItems((currentItems) =>
            currentItems.map((item) => {
                if (item.product.id !== productId) {
                    return item
                }

                const stock = item.product.stock_quantity
                const safeQuantity =
                    typeof stock === 'number'
                        ? Math.min(quantity, stock)
                        : quantity

                return { ...item, quantity: safeQuantity }
            }),
        )
    }

    function clearCart() {
        setItems([])
    }

    const cartCount = items.reduce(
        (total, item) => total + item.quantity,
        0,
    )

    const subtotal = items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
    )

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                subtotal,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)

    if (!context) {
        throw new Error('useCart must be used inside a CartProvider.')
    }

    return context
}
