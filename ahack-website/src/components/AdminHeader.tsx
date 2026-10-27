
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminHeader() {
    const navigate = useNavigate()
    const [signingOut, setSigningOut] = useState(false)
    const [error, setError] = useState('')

    async function handleSignOut() {
        setSigningOut(true)
        setError('')

        const { error: signOutError } = await supabase.auth.signOut()

        setSigningOut(false)

        if (signOutError) {
            setError(signOutError.message)
            return
        }

        navigate('/admin/login', { replace: true })
    }

    return (
        <header className="admin-header">
            <Link className="logo" to="/admin">
                AHACK<span>.</span>
                <small> CONTROL PANEL</small>
            </Link>

            <nav className="admin-nav" aria-label="Admin navigation">
                <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) =>
                        isActive ? 'admin-nav-link active' : 'admin-nav-link'
                    }
                >
                    Dashboard
                </NavLink>

                <NavLink
                    to="/admin/products/new"
                    className={({ isActive }) =>
                        isActive ? 'admin-nav-link active' : 'admin-nav-link'
                    }
                >
                    + Add product
                </NavLink>

                <button
                    className="admin-secondary-button"
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                >
                    {signingOut ? 'Signing out...' : 'Sign out'}
                </button>
            </nav>

            {error && (
                <p className="admin-header-error" role="alert">
                    {error}
                </p>
            )}
        </header>
    )
}
