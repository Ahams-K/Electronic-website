
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return Response.json(
            { success: false, error: 'Method not allowed.' },
            { status: 405, headers: corsHeaders },
        )
    }

    try {
        const body = await req.json()

        const name = String(body.name ?? '').trim()
        const email = String(body.email ?? '').trim()
        const subject = String(body.subject ?? '').trim()
        const message = String(body.message ?? '').trim()
        const website = String(body.website ?? '').trim()
        const turnstileToken = String(body.turnstileToken ?? '')

        // Spam-trap: quietly accept submissions that fill this field.
        if (website) {
            return Response.json(
                { success: true },
                { headers: corsHeaders },
            )
        }

        // Validate the submitted form fields.
        if (
            !name || name.length > 100 ||
            !email || email.length > 254 ||
            !subject || subject.length > 150 ||
            !message || message.length > 5000
        ) {
            return Response.json(
                { success: false, error: 'Please check your form fields.' },
                { status: 400, headers: corsHeaders },
            )
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!emailPattern.test(email)) {
            return Response.json(
                { success: false, error: 'Please enter a valid email address.' },
                { status: 400, headers: corsHeaders },
            )
        }

        // Require a Turnstile token from the frontend.
        if (!turnstileToken) {
            return Response.json(
                {
                    success: false,
                    error: 'Please complete the security check and try again.',
                },
                { status: 400, headers: corsHeaders },
            )
        }

        // Read the secret securely from Supabase Edge Function secrets.
        const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')

        if (!turnstileSecret) {
            console.error('Turnstile secret is not configured.')

            return Response.json(
                {
                    success: false,
                    error: 'Security verification is temporarily unavailable.',
                },
                { status: 500, headers: corsHeaders },
            )
        }

        // Verify the token with Cloudflare on the server.
        const verificationResponse = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    secret: turnstileSecret,
                    response: turnstileToken,
                }),
            },
        )

        if (!verificationResponse.ok) {
            console.error(
                'Cloudflare verification request failed:',
                verificationResponse.status,
            )

            return Response.json(
                {
                    success: false,
                    error: 'Security verification failed. Please try again.',
                },
                { status: 502, headers: corsHeaders },
            )
        }

        const verification = await verificationResponse.json()

        if (verification.success !== true) {
            console.warn(
                'Turnstile verification rejected:',
                verification['error-codes'] ?? [],
            )

            return Response.json(
                {
                    success: false,
                    error: 'Security verification failed. Please try again.',
                },
                { status: 400, headers: corsHeaders },
            )
        }

        // Only send email after successful server-side verification.
        const apiKey = Deno.env.get('RESEND_API_KEY')
        const recipient = Deno.env.get('CONTACT_TO_EMAIL')
        const sender = Deno.env.get('CONTACT_FROM_EMAIL')

        if (!apiKey || !recipient || !sender) {
            console.error('Contact function email secrets are not configured.')

            return Response.json(
                {
                    success: false,
                    error: 'Email service is not configured yet.',
                },
                { status: 500, headers: corsHeaders },
            )
        }

        const resendResponse = await fetch(
            'https://api.resend.com/emails',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: sender,
                    to: [recipient],
                    reply_to: email,
                    subject: `[AHACK Contact] ${subject}`,
                    text: [
                        'New message from the AHACK contact form',
                        '',
                        `Name: ${name}`,
                        `Email: ${email}`,
                        `Subject: ${subject}`,
                        '',
                        'Message:',
                        message,
                    ].join('\n'),
                }),
            },
        )

        if (!resendResponse.ok) {
            const errorDetails = await resendResponse.text()
            console.error('Resend request failed:', errorDetails)

            return Response.json(
                {
                    success: false,
                    error: 'Email delivery failed. Please try again later.',
                },
                { status: 502, headers: corsHeaders },
            )
        }

        return Response.json(
            { success: true },
            { headers: corsHeaders },
        )
    } catch (error) {
        console.error('Contact function error:', error)

        return Response.json(
            {
                success: false,
                error: 'Unable to process your message.',
            },
            { status: 500, headers: corsHeaders },
        )
    }
})
