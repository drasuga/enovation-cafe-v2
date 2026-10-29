export default function CafeLayout({ children }) {
  return (
    <div className="cafe-site">
      <header className="site-header">
        <a className="brand-lockup" href="/" aria-label="Café Terrasse — accueil">
          <span className="brand-mark" aria-hidden="true">e<span>.</span></span>
          <span className="brand-copy">
            <strong>Café Terrasse</strong>
            <small>ENOVATION FACTORY</small>
          </span>
        </a>

        <nav className="site-nav" aria-label="Navigation principale">
          <a className="nav-text-link" href="https://www.enovation-factory.com/cafe-bibliotheque/le-cafe-terrasse" target="_blank" rel="noreferrer">
            L’esprit du café <span aria-hidden="true">↗</span>
          </a>
          <a className="nav-cta" href="#menu">
            Notre menu <span aria-hidden="true">↘</span>
          </a>
        </nav>
      </header>

      <main className="site-main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> CAFÉ TERRASSE <span className="eyebrow-separator">/</span> YAOUNDÉ</p>
            <h1 id="hero-title">Une pause.<br /><em>Une idée.</em><br />Un bon café.</h1>
            <p className="hero-description">
              Le goût des bonnes choses, l’énergie des rencontres. Découvrez un café convivial où les saveurs locales et l’inspiration se retrouvent.
            </p>
            <a className="hero-link" href="#menu">Explorer la carte <span aria-hidden="true">↘</span></a>
            <div className="hero-note">
              <span className="note-line" />
              <span>Un lieu de rencontre, d’inspiration et de partage.</span>
            </div>
          </div>

          <div className="hero-visual" role="img" aria-label="Ambiance café et moments de pause">
            <img
              className="hero-image"
              src="https://cdn.prod.website-files.com/61d5e7786bf47b26e175c344/67cf152638ec12f1a65376bb_enovcroppedcoffee.jpg"
              alt="Une pause café au Café Terrasse"
              fetchPriority="high"
            />
            <div className="hero-image-label">
              <span className="label-kicker">FAIT POUR VOS PAUSES</span>
              <span className="label-title">Good coffee. Good ideas.</span>
            </div>
            <span className="visual-index" aria-hidden="true">01 / CAFÉ</span>
          </div>
        </section>

        <section className="menu-section" id="menu" aria-labelledby="menu-title">
          <div className="menu-intro">
            <div>
              <p className="eyebrow menu-eyebrow">LA CARTE DU CAFÉ</p>
              <h2 id="menu-title">Vos envies,<br /><em>à portée de main.</em></h2>
            </div>
            <p className="menu-intro-copy">
              Café, boissons fraîches et gourmandises : choisissez vos favoris et commandez directement depuis votre table.
            </p>
          </div>
          {children}
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="footer-mark" aria-hidden="true">e<span>.</span></span>
          <div><strong>Café Terrasse</strong><span>by Enovation Factory</span></div>
        </div>
        <p>Une cafétéria contemporaine aux accents locaux.</p>
        <div className="footer-location">
          <span>NOUS RENDRE VISITE</span>
          <strong>Nouvelle route Bastos · Yaoundé</strong>
        </div>
      </footer>
    </div>
  );
}
