import { Turnstile } from '@marsidev/react-turnstile'
import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type ContactFormData = {
    name: string
    email: string
    subject: string
    message: string
    website: string
}

const emptyForm: ContactFormData = {
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '',
}

function Contact() {
    const [form, setForm] = useState<ContactFormData>(emptyForm)
    const [sending, setSending] = useState(false)
    const [turnstileToken, setTurnstileToken] = useState('')
    const [status, setStatus] = useState<{
        type: 'success' | 'error'
        message: string
    } | null>(null)

    function updateField(field: keyof ContactFormData, value: string) {
        setForm((current) => ({ ...current, [field]: value }))
        setStatus(null)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatus(null)

        if (form.website.trim()) {
            setStatus({
                type: 'success',
                message: 'Thanks for contacting AHACK.',
            })
            setForm(emptyForm)
            setTurnstileToken('')
            return
        }

        if (!turnstileToken) {
            setStatus({
                type: 'error',
                message: 'Please complete the security check before sending.',
            })
            return
        }

        setSending(true)

        try {
            const { data, error } = await supabase.functions.invoke(
                'contact-us',
                {
                    body: {
                        name: form.name.trim(),
                        email: form.email.trim(),
                        subject: form.subject.trim(),
                        message: form.message.trim(),
                        website: form.website,
                        turnstileToken,
                    },
                },
            )

            if (error) throw error

            if (!data?.success) {
                throw new Error(
                    data?.error ||
                    'Your message could not be sent. Please try again.',
                )
            }

            setStatus({
                type: 'success',
                message: 'Message sent! Thank you for contacting AHACK.',
            })
            setForm(emptyForm)
            setTurnstileToken('')
        } catch (error) {
            console.error('Contact form error:', error)
            setStatus({
                type: 'error',
                message:
                    'We could not send your message right now. Please try again later.',
            })
            setTurnstileToken('')
        } finally {
            setSending(false)
        }
    }

    return (
        <main className="contact-page">
            <section className="contact-heading">
                <p className="eyebrow">AHACK / GET IN TOUCH</p>
                <h1>
                    Let's talk<span>.</span>
                </h1>
                <p>
                    Have a question about a product or need a hand
                    with something? Send us a message and we'll get
                    back to you.
                </p>
            </section>

            <section className="contact-layout">
                <aside className="contact-details">
                    <p className="eyebrow">WE'RE HERE TO HELP</p>
                    <h2>What's on your mind?</h2>
                    <p>
                        Whether it's a product question, an order
                        enquiry, or feedback about AHACK, we'd like
                        to hear from you.
                    </p>

                    <div className="contact-detail-item">
                        <span className="contact-detail-number">01</span>
                        <div>
                            <h3>Product questions</h3>
                            <p>Need help choosing the right tech?</p>
                        </div>
                    </div>

                    <div className="contact-detail-item">
                        <span className="contact-detail-number">02</span>
                        <div>
                            <h3>Order support</h3>
                            <p>Have a question about an order?</p>
                        </div>
                    </div>

                    <div className="contact-detail-item">
                        <span className="contact-detail-number">03</span>
                        <div>
                            <h3>Feedback &amp; ideas</h3>
                            <p>Tell us how we can do better.</p>
                        </div>
                    </div>
                </aside>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="contact-form-heading">
                        <h2>Send us a message</h2>
                        <p>Fields marked * are required.</p>
                    </div>

                    <div className="contact-form-row">
                        <label>
                            Name *
                            <input
                                name="name"
                                type="text"
                                autoComplete="name"
                                maxLength={100}
                                required
                                value={form.name}
                                onChange={(event) =>
                                    updateField('name', event.target.value)
                                }
                                placeholder="Your name"
                            />
                        </label>

                        <label>
                            Email address *
                            <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                maxLength={254}
                                required
                                value={form.email}
                                onChange={(event) =>
                                    updateField('email', event.target.value)
                                }
                                placeholder="you@example.com"
                            />
                        </label>
                    </div>

                    <label>
                        Subject *
                        <input
                            name="subject"
                            type="text"
                            maxLength={150}
                            required
                            value={form.subject}
                            onChange={(event) =>
                                updateField('subject', event.target.value)
                            }
                            placeholder="How can we help?"
                        />
                    </label>

                    <label>
                        Message *
                        <textarea
                            name="message"
                            rows={6}
                            maxLength={5000}
                            required
                            value={form.message}
                            onChange={(event) =>
                                updateField('message', event.target.value)
                            }
                            placeholder="Write your message here..."
                        />
                    </label>

                    <label className="contact-honeypot" aria-hidden="true">
                        Website
                        <input
                            name="website"
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            value={form.website}
                            onChange={(event) =>
                                updateField('website', event.target.value)
                            }
                        />
                    </label>

                    <div className="contact-turnstile">
                        <Turnstile
                            siteKey={
                                import.meta.env.VITE_TURNSTILE_SITE_KEY
                            }
                            onSuccess={(token) => setTurnstileToken(token)}
                            onExpire={() => setTurnstileToken('')}
                            onError={() => setTurnstileToken('')}
                        />
                    </div>

                    {status && (
                        <p
                            className={`contact-status contact-status-${status.type}`}
                            role="status"
                        >
                            {status.message}
                        </p>
                    )}

                    <button
                        className="primary-button contact-submit"
                        type="submit"
                        disabled={sending || !turnstileToken}
                    >
                        {sending ? 'Sending message...' : 'Send message'}
                        <span aria-hidden="true"> ↗</span>
                    </button>

                    <p className="contact-privacy-note">
                        Your details will only be used to respond
                        to your enquiry.
                    </p>
                </form>
            </section>
        </main>
    )
}

export default Contact
