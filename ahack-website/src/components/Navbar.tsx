
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function Navbar() {
    const { cartCount } = useCart()

    return (
        <header className="navbar">
            <Link className="logo" to="/">
                AHACK<span>.</span>
            </Link>

            <nav className="nav-links" aria-label="Main navigation">
                <NavLink to="/" end>
                    Home
                </NavLink>

                <NavLink to="/shop">
                    Products
                </NavLink>

                <NavLink to="/about">
                    About
                </NavLink>

                <NavLink to="/contact">
                    Contact
                </NavLink>
            </nav>

            <div className="navbar-actions">
                <Link className="cart-button" to="/shop">
                    Shop <span>↗</span>
                </Link>

                <Link
                    to="/cart"
                    className="navbar-cart"
                    aria-label={`Shopping cart, ${cartCount} items`}
                >
                    <span aria-hidden="true">🛒</span>
                    <span>Cart</span>

                    {cartCount > 0 && (
                        <span className="cart-count">{cartCount}</span>
                    )}
                </Link>
            </div>
        </header>
    )
}

export default Navbar
