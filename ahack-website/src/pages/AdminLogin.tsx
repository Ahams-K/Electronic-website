
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                })

            if (loginError) {
                setError(
                    loginError.message === 'Invalid login credentials'
                        ? 'Incorrect email or password. Please try again.'
                        : loginError.message,
                )
                return
            }

            const { data: adminRecord, error: adminError } = await supabase
                .from('admin_users')
                .select('user_id')
                .eq('user_id', data.user.id)
                .maybeSingle()

            if (adminError || !adminRecord) {
                await supabase.auth.signOut()
                setError('This account is not authorised to access the admin area.')
                return
            }

            navigate('/admin', { replace: true })
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="shop-page admin-login-page">
            <div className="admin-login-card">
                <Link className="logo admin-login-logo" to="/">
                    AHACK<span>.</span>
                </Link>

                <p className="eyebrow">CONTROL PANEL / SECURE ACCESS</p>

                <h1>
                    Welcome back<span>.</span>
                </h1>

                <p className="admin-login-description">
                    Sign in to manage your products and store.
                </p>

                <form onSubmit={handleLogin}>
                    <label htmlFor="admin-email">Email address</label>
                    <input
                        id="admin-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={loading}
                    />

                    <label htmlFor="admin-password">Password</label>
                    <input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={loading}
                    />

                    {error && (
                        <p role="alert" className="admin-error">
                            {error}
                        </p>
                    )}

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign in ↗'}
                    </button>
                </form>

                <Link className="text-link admin-login-back" to="/">
                    ← Back to AHACK store
                </Link>
            </div>
        </main>
    )
}
