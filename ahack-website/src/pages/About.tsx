import { Link } from 'react-router-dom'

function About() {
    return (
        <main className="about-page">
            <section className="about-hero">
                <p className="eyebrow">ABOUT AHACK / OUR STORY</p>

                <h1>
                    Technology should
                    <br />
                    work for <span>you.</span>
                </h1>

                <p className="about-intro">
                    At AHACK, we believe great technology isn't just about
                    specifications. It's about how the right products make
                    everyday life better.
                </p>
            </section>

            <section className="about-story">
                <div className="about-section-label">
                    <span>01</span>
                    <p>WHO WE ARE</p>
                </div>

                <div className="about-story-content">
                    <h2>A better way to discover technology.</h2>

                    <p>
                        AHACK is an electronics brand built around a simple
                        idea: finding the right technology should feel
                        straightforward. Whether you're looking for headphones,
                        speakers, or a new smartphone, we want to make exploring
                        your options easier.
                    </p>

                    <p>
                        We bring different categories of everyday electronics
                        together in one place, so you can focus on finding
                        products that fit your needs, interests, and lifestyle.
                    </p>
                </div>
            </section>

            <section className="about-values">
                <div className="about-section-label">
                    <span>02</span>
                    <p>WHAT MATTERS TO US</p>
                </div>

                <div className="about-values-grid">
                    <article className="about-value-card">
                        <span className="about-value-number">01 /</span>
                        <h3>Quality</h3>
                        <p>
                            Technology should earn its place in your everyday
                            life through the experience it delivers.
                        </p>
                    </article>

                    <article className="about-value-card">
                        <span className="about-value-number">02 /</span>
                        <h3>Simplicity</h3>
                        <p>
                            Discovering your next device should be clear,
                            convenient, and easy to navigate.
                        </p>
                    </article>

                    <article className="about-value-card">
                        <span className="about-value-number">03 /</span>
                        <h3>Everyday usefulness</h3>
                        <p>
                            We focus on technology that helps you listen,
                            communicate, work, and enjoy your time.
                        </p>
                    </article>
                </div>
            </section>

            <section className="about-cta">
                <p className="eyebrow">YOUR NEXT UPGRADE STARTS HERE</p>
                <h2>Find the tech that fits your world.</h2>
                <p>
                    Explore our collection and discover what works for you.
                </p>

                <Link className="primary-button" to="/shop">
                    Explore the shop <span>↗</span>
                </Link>
            </section>
        </main>
    )
}

export default About