
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function Navbar() {
    const { cartCount } = useCart()
    const [menuOpen, setMenuOpen] = useState(false)

    function closeMenu() {
        setMenuOpen(false)
    }

    return (
        <header className="navbar">
            <Link className="logo" to="/" onClick={closeMenu}>
                AHACK<span>.</span>
            </Link>

            <nav
                id="main-navigation"
                className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}
                aria-label="Main navigation"
            >
                <NavLink to="/" end onClick={closeMenu}>
                    Home
                </NavLink>

                <NavLink to="/shop" onClick={closeMenu}>
                    Products
                </NavLink>

                <NavLink to="/about" onClick={closeMenu}>
                    About
                </NavLink>

                <NavLink to="/contact" onClick={closeMenu}>
                    Contact
                </NavLink>

                <div className="mobile-nav-actions">
                    <Link
                        className="cart-button"
                        to="/shop"
                        onClick={closeMenu}
                    >
                        Shop <span aria-hidden="true">↗</span>
                    </Link>

                    <Link
                        to="/cart"
                        className="navbar-cart"
                        onClick={closeMenu}
                        aria-label={`Shopping cart, ${cartCount} items`}
                    >
                        <span aria-hidden="true">🛒</span>
                        <span>Cart</span>

                        {cartCount > 0 && (
                            <span className="cart-count">{cartCount}</span>
                        )}
                    </Link>
                </div>
            </nav>

            <div className="navbar-actions">
                <Link className="cart-button" to="/shop">
                    Shop <span aria-hidden="true">↗</span>
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

            <button
                type="button"
                className={`mobile-menu-toggle ${menuOpen ? 'is-open' : ''}`}
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                aria-controls="main-navigation"
                onClick={() => setMenuOpen((open) => !open)}
            >
                <span />
                <span />
                <span />
            </button>
        </header>
    )
}

export default Navbar
