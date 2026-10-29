'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const fmt = (n) => n.toLocaleString('fr-FR') + ' FCFA';

function CupIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path d="M7 12h17v9.2A6.8 6.8 0 0 1 17.2 28h-3.4A6.8 6.8 0 0 1 7 21.2V12Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M24 14h2.4a3.6 3.6 0 0 1 0 7.2H24M5 30h22M12 7c-1.7-1.5.8-2.4 0-4M18 7c-1.7-1.5.8-2.4 0-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function MenuClient({ categories, items, initialTable }) {
  const router = useRouter();
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [tableNumber, setTableNumber] = useState(initialTable || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cartLines = useMemo(
    () => items.filter((i) => cart[i.id]).map((i) => ({ ...i, quantity: cart[i.id] })),
    [items, cart]
  );
  const total = cartLines.reduce((s, l) => s + l.price * l.quantity, 0);
  const count = cartLines.reduce((s, l) => s + l.quantity, 0);

  function add(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }

  function remove(id) {
    setCart((c) => {
      const next = { ...c };
      const q = (c[id] || 0) - 1;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!tableNumber.trim()) {
      setError('Veuillez entrer votre numéro de table.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          customerName,
          customerPhone,
          items: cartLines.map((l) => ({ id: l.id, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.');

      const payRes = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderId }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        router.push(`/order/${data.orderId}`);
        return;
      }
      window.location.href = payData.link;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="category-bar" aria-label="Catégories du menu">
        <span className="category-bar-label">PARCOURIR</span>
        <div className="category-links">
          {categories.map((cat, index) => (
            <a key={cat.id} href={`#category-${cat.id}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>{cat.name}
            </a>
          ))}
        </div>
      </div>

      <div className="menu-list">
        {categories.map((cat, index) => {
          const categoryItems = items.filter((item) => item.category_id === cat.id);
          return (
            <section className="menu-category" key={cat.id} id={`category-${cat.id}`}>
              <div className="category-heading-row">
                <span className="category-index">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="category-title">{cat.name}</h3>
                <span className="category-rule" />
                <span className="category-count">{categoryItems.length} {categoryItems.length > 1 ? 'articles' : 'article'}</span>
              </div>
              {categoryItems.length === 0 ? (
                <p className="empty-category">Les nouveautés arrivent bientôt.</p>
              ) : (
                <div className="menu-grid">
                  {categoryItems.map((item) => (
                    <article className="item" key={item.id}>
                      <div className="item-main">
                        {item.image_url ? (
                          <div className="item-image-wrap">
                            <img className="thumb" src={item.image_url} alt={item.name} loading="lazy" />
                          </div>
                        ) : (
                          <div className="item-placeholder"><CupIcon /><span>CAFÉ TERRASSE</span></div>
                        )}
                        <div className="item-copy">
                          <h4>{item.name}</h4>
                          {item.description && <p>{item.description}</p>}
                        </div>
                      </div>
                      <div className="item-side">
                        <div className="price">{fmt(item.price)}</div>
                        <div className="qty" aria-label={`Quantité pour ${item.name}`}>
                          {cart[item.id] ? (
                            <>
                              <button className="minus" type="button" onClick={() => remove(item.id)} aria-label={`Retirer un ${item.name}`}>−</button>
                              <span aria-live="polite">{cart[item.id]}</span>
                            </>
                          ) : null}
                          <button type="button" onClick={() => add(item.id)} aria-label={`Ajouter ${item.name} au panier`}>+</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {categories.length === 0 && (
          <div className="menu-empty-state">
            <span className="empty-icon"><CupIcon /></span>
            <h3>La carte se prépare.</h3>
            <p>Le menu sera disponible ici dès qu’il aura été ajouté.</p>
          </div>
        )}
      </div>

      {count > 0 && !showCart && (
        <button className="cart-bar" onClick={() => setShowCart(true)}>
          <span className="cart-bar-label"><span className="cart-bag" aria-hidden="true">↗</span><span>Voir le panier <small>{count} {count > 1 ? 'articles' : 'article'}</small></span></span>
          <span className="cart-bar-total">{fmt(total)} <span aria-hidden="true">→</span></span>
        </button>
      )}

      {showCart && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowCart(false)} />
          <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="sheet-handle" aria-hidden="true" />
            <div className="sheet-heading">
              <div>
                <p className="eyebrow">VOTRE SÉLECTION</p>
                <h2 id="cart-title">Votre commande<span>.</span></h2>
              </div>
              <button type="button" className="sheet-close" onClick={() => setShowCart(false)} aria-label="Fermer le panier">×</button>
            </div>

            {cartLines.length === 0 && <p className="empty-cart">Votre panier est vide.</p>}

            {cartLines.map((l) => (
              <div className="line" key={l.id}>
                <div className="cart-line-copy">
                  <strong>{l.name}</strong>
                  <span>{fmt(l.price)} × {l.quantity}</span>
                </div>
                <div className="qty">
                  <button className="minus" type="button" onClick={() => remove(l.id)} aria-label={`Retirer un ${l.name}`}>−</button>
                  <span>{l.quantity}</span>
                  <button type="button" onClick={() => add(l.id)} aria-label={`Ajouter un ${l.name}`}>+</button>
                </div>
              </div>
            ))}

            <div className="total-row">
              <span>Total à régler</span>
              <span>{fmt(total)}</span>
            </div>

            <form onSubmit={submit}>
              <div className="cart-fields-row">
                <label className="field">
                  <span>Numéro de table *</span>
                  <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex. : 05"
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </label>
                <label className="field">
                  <span>Votre nom (optionnel)</span>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nom"
                    maxLength={60}
                  />
                </label>
              </div>
              <label className="field">
                <span>Téléphone (optionnel)</span>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="6XX XX XX XX"
                  inputMode="tel"
                  maxLength={20}
                />
              </label>

              {error && <p className="error" role="alert">{error}</p>}

              <button className="primary-btn" type="submit" disabled={submitting || cartLines.length === 0}>
                {submitting ? 'Envoi en cours...' : 'Confirmer et payer'} <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="continue-btn" onClick={() => setShowCart(false)}>
                Continuer mes achats
              </button>
            </form>
          </section>
        </>
      )}
    </>
  );
}
