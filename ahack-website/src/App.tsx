
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminProducts from './pages/AdminProducts'
import AdminEditProduct from './pages/AdminEditProduct'
import About from './pages/About'
import './App.css'
import Contact from "./pages/Contact.tsx";

function App() {
    const location = useLocation()
    const isAdminRoute = location.pathname.startsWith('/admin')

    return (
        <div className="store">
            {!isAdminRoute && <Navbar />}

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:category" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products/new" element={<AdminProducts />} />
                <Route path="/admin/products/:id/edit" element={<AdminEditProduct />} />

                <Route
                    path="*"
                    element={
                        <main className="shop-page empty-state">
                            <p className="eyebrow">404 / PAGE NOT FOUND</p>
                            <h1>This page doesn't exist.</h1>
                            <Link className="primary-button" to="/">
                                Back home ↗
                            </Link>
                        </main>
                    }
                />
            </Routes>

            {!isAdminRoute && (
                <footer id="footer">
                    <Link className="logo" to="/">
                        AHACK<span>.</span>
                    </Link>

                    <p>Technology for everyday life.</p>

                    <Link className="text-link" to="/admin/login">
                        Admin login
                    </Link>
                </footer>
            )}
        </div>
    )
}

export default App
