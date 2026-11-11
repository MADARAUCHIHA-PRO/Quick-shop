import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { finalPrice, inr, stockLabel } from "./lib/format";
import { useShop } from "./shop";
import { LOGO } from "./logoData";

/* ---------- scroll-in reveal (IntersectionObserver, no libraries) ---------- */
export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- header ---------- */
export function Header() {
  const { settings, theme, toggleTheme, cartCount, wishlist, setDrawerOpen } = useShop();
  const [q, setQ] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
    setMobileSearch(false);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="Quick-shop home">
          <img src={LOGO} alt="Quick-shop logo" className="brand-logo" />
          <span className="brand-name">{settings.shopName || "Quick-shop"}</span>
          <span className="brand-tag">Delhi</span>
        </Link>

        <form className="header-search" onSubmit={submitSearch} role="search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kya dhoondh rahe ho? (jaise: charger, kurti…)"
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            <span aria-hidden="true">⌕</span>
          </button>
        </form>

        <nav className="header-actions" aria-label="Shop actions">
          <button
            className="icon-btn search-toggle"
            onClick={() => setMobileSearch((s) => !s)}
            aria-label="Search"
          >
            ⌕
          </button>
          <Link to="/?filter=wishlist" className="icon-btn" aria-label="Wishlist">
            ♥<span className="count-badge">{wishlist.length || ""}</span>
          </Link>
          <Link to="/track" className="header-link">
            Track order
          </Link>
          <button
            className="icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            title={theme === "light" ? "Dark karo" : "Light karo"}
          >
            <span className="theme-icon">{theme === "light" ? "☾" : "☀"}</span>
          </button>
          <button
            className="cart-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Open cart, ${cartCount} items`}
          >
            <span aria-hidden="true">🛒</span>
            <span className="cart-btn-label">Cart</span>
            <span className="count-badge solid">{cartCount || ""}</span>
          </button>
        </nav>
      </div>

      {mobileSearch && (
        <form className="mobile-search" onSubmit={submitSearch} role="search">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kya dhoondh rahe ho?"
            aria-label="Search products"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Dhoondho
          </button>
        </form>
      )}

      <nav className="header-strip" aria-label="Quick links">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/?filter=new">New arrivals</NavLink>
        <NavLink to="/?filter=discount">Discounts</NavLink>
        <NavLink to="/track">Track order</NavLink>
        <a
          href={`https://wa.me/${settings.whatsapp}`}
          target="_blank"
          rel="noreferrer"
        >
          Help on WhatsApp
        </a>
      </nav>
    </header>
  );
}

/* ---------- footer ---------- */
export function Footer() {
  const { settings } = useShop();
  const wa = `https://wa.me/${settings.whatsapp}`;
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <div className="footer-brand">
            <img src={LOGO} alt="Quick-shop logo" />
            <strong>{settings.shopName || "Quick-shop"}</strong>
          </div>
          <p>
            Delhi ki apni chhoti si dukaan. Saman seedha, daam saaf, delivery
            Porter rider se — ghar baithe order karo.
          </p>
          <p className="footer-note">Ayan ki dukaan — Delhi se, Delhi ke liye.</p>
        </div>
        <div className="footer-col">
          <h4>Delivery</h4>
          <ul>
            <li>Delhi me hi delivery hoti hai</li>
            <li>Porter two-wheeler rider se</li>
            <li>Delivery charge customer deta hai</li>
            <li>Free delivery ₹{settings.freeDeliveryAbove || 999} se upar ke orders par</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Payment</h4>
          <ul>
            <li>UPI se payment — site par hi</li>
            <li>Cash on Delivery nahi hai</li>
            <li>Payment verify hone ke baad order confirm hota hai</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Madad chahiye?</h4>
          <p>Order, delivery ya payment — kuch bhi poochna ho to WhatsApp karo.</p>
          <a className="btn btn-outline" href={wa} target="_blank" rel="noreferrer">
            WhatsApp par baat karo
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {settings.shopName || "Quick-shop"} · Delhi</span>
        <Link to="/admin">Admin login</Link>
      </div>
    </footer>
  );
}

/* ---------- product card ---------- */
export function ProductCard({ product, index = 0 }) {
  const { addToCart, toggleWishlist, isWished, pushToast, setDrawerOpen } = useShop();
  const [added, setAdded] = useState(false);
  const price = finalPrice(product);
  const stock = stockLabel(product.stockType);
  const wished = isWished(product.id);
  const img = product.images?.[0];

  const onAdd = () => {
    if (!addToCart(product, 1)) return;
    setAdded(true);
    pushToast(`${product.name} — cart me daal diya`);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Reveal delay={(index % 4) * 70}>
      <article className="product-card">
        <Link to={`/product/${product.id}`} className="card-media" aria-label={product.name}>
          {img ? (
            <img src={img} alt={product.name} loading="lazy" />
          ) : (
            <div className="card-media-fallback">
              <span>{product.name.slice(0, 1)}</span>
            </div>
          )}
          {product.discount > 0 && (
            <span className="badge badge-discount">-{product.discount}%</span>
          )}
          {product.isNew && <span className="badge badge-new">New</span>}
          <button
            className={`wish-btn ${wished ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
              pushToast(wished ? "Wishlist se hata diya" : "Wishlist me save kar diya");
            }}
            aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={wished}
          >
            {wished ? "♥" : "♡"}
          </button>
        </Link>
        <div className="card-body">
          <Link to={`/product/${product.id}`} className="card-name">
            {product.name}
          </Link>
          <div className="card-price-row">
            <span className="price">{inr(price)}</span>
            {product.discount > 0 && (
              <span className="mrp">{inr(product.price)}</span>
            )}
          </div>
          <span className={`stock-badge ${stock.cls}`}>{stock.text}</span>
          <button
            className={`btn btn-primary btn-block add-btn ${added ? "added" : ""}`}
            onClick={onAdd}
            disabled={product.stockType === "out"}
          >
            {added ? "✓ Cart me hai" : product.stockType === "out" ? "Out of stock" : "+ Cart me daalo"}
          </button>
          <button
            className="card-view-cart"
            onClick={() => {
              if (addToCart(product, 1)) setDrawerOpen(true);
            }}
            disabled={product.stockType === "out"}
          >
            Buy now →
          </button>
        </div>
      </article>
    </Reveal>
  );
}

/* ---------- skeletons ---------- */
export function ProductSkeleton() {
  return (
    <div className="product-card skeleton-card" aria-hidden="true">
      <div className="sk sk-media" />
      <div className="sk sk-line" />
      <div className="sk sk-line short" />
      <div className="sk sk-btn" />
    </div>
  );
}

/* ---------- empty state ---------- */
export function EmptyState({ title, body, action }) {
  const { settings } = useShop();
  return (
    <div className="empty-state">
      <div className="empty-logo">
        <img src={LOGO} alt="Quick-shop" />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
      <p className="empty-help">
        Kuch poochna ho?{" "}
        <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer">
          WhatsApp par pooch lo
        </a>
      </p>
    </div>
  );
}

/* ---------- cart drawer ---------- */
export function CartDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    cartDetailed,
    cartSubtotal,
    setQty,
    removeFromCart,
    settings,
  } = useShop();
  const navigate = useNavigate();

  if (!drawerOpen) return null;
  const freeAbove = settings.freeDeliveryAbove || 999;
  const remaining = Math.max(0, freeAbove - cartSubtotal);
  const progress = Math.min(100, (cartSubtotal / freeAbove) * 100);

  return (
    <div className="drawer-root">
      <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      <aside className="cart-drawer" role="dialog" aria-label="Your cart">
        <div className="drawer-head">
          <h3>Tumhara cart ({cartDetailed.reduce((s, l) => s + l.qty, 0)})</h3>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Close cart">
            ✕
          </button>
        </div>

        {cartDetailed.length === 0 ? (
          <div className="drawer-empty">
            <p className="big-emoji" aria-hidden="true">
              🛒
            </p>
            <p>Cart abhi khaali hai.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setDrawerOpen(false);
                navigate("/");
              }}
            >
              Shopping shuru karo
            </button>
          </div>
        ) : (
          <>
            <div className="free-delivery-bar">
              {remaining > 0 ? (
                <p>
                  <strong>{inr(remaining)}</strong> aur — free delivery!
                </p>
              ) : (
                <p className="free-won">🎉 Free delivery mil gayi!</p>
              )}
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="drawer-items">
              {cartDetailed.map((item) => (
                <li key={item.id} className="drawer-item">
                  <Link
                    to={`/product/${item.id}`}
                    onClick={() => setDrawerOpen(false)}
                    className="drawer-thumb"
                  >
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} />
                    ) : (
                      <span>{item.name.slice(0, 1)}</span>
                    )}
                  </Link>
                  <div className="drawer-item-info">
                    <Link to={`/product/${item.id}`} onClick={() => setDrawerOpen(false)}>
                      {item.name}
                    </Link>
                    <span className="drawer-item-price">{inr(finalPrice(item))}</span>
                    <div className="qty-row">
                      <button onClick={() => setQty(item.id, item.qty - 1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                  </div>
                  <div className="drawer-item-right">
                    <strong>{inr(item.lineTotal)}</strong>
                    <button
                      className="remove-link"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      Hatayo
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="drawer-foot">
              <div className="drawer-total">
                <span>Subtotal</span>
                <strong>{inr(cartSubtotal)}</strong>
              </div>
              <p className="drawer-note">
                Delivery charge checkout par lagega — Delhi me Porter se.
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  setDrawerOpen(false);
                  navigate("/checkout");
                }}
              >
                Checkout →
              </button>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setDrawerOpen(false);
                  navigate("/cart");
                }}
              >
                Cart page dekho
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/* ---------- toasts ---------- */
export function Toasts() {
  const { toasts } = useShop();
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          ✓ {t.message}
        </div>
      ))}
    </div>
  );
}

/* ---------- FAQ accordion ---------- */
export function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {items.map((item, i) => (
        <div key={i} className={`faq-item ${open === i ? "open" : ""}`}>
          <button
            className="faq-q"
            onClick={() => setOpen(open === i ? -1 : i)}
            aria-expanded={open === i}
          >
            <span>{item.q}</span>
            <span className="faq-chev">{open === i ? "−" : "+"}</span>
          </button>
          <div className="faq-a">
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
