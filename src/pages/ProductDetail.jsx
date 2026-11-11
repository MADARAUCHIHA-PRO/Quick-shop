import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useShop } from "../shop";
import { finalPrice, inr, stockLabel } from "../lib/format";
import { ProductCard, ProductSkeleton } from "../components";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    products,
    productsLoading,
    addToCart,
    toggleWishlist,
    isWished,
    pushToast,
    setDrawerOpen,
  } = useShop();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);

  const product = products.find((p) => p.id === id);
  const related = useMemo(
    () =>
      products
        .filter((p) => p.id !== id && p.stockType !== "out")
        .slice(0, 4),
    [products, id]
  );

  if (productsLoading) {
    return (
      <main className="detail-page">
        <div className="detail-grid">
          <ProductSkeleton />
          <div>
            <div className="sk sk-line" />
            <div className="sk sk-line short" />
            <div className="sk sk-btn" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="detail-page">
        <div className="empty-state">
          <h3>Ye product nahi mila</h3>
          <p>Shayad ye hata diya gaya hai, ya link galat hai.</p>
          <Link className="btn btn-primary" to="/">
            Dukaan par wapas jao
          </Link>
        </div>
      </main>
    );
  }

  const price = finalPrice(product);
  const stock = stockLabel(product.stockType);
  const wished = isWished(product.id);
  const images = product.images?.length ? product.images : [];
  const mainImg = images[imgIdx];

  const onAdd = () => {
    if (!addToCart(product, qty)) return;
    setAdded(true);
    pushToast(`${product.name} — cart me daal diya`);
    setTimeout(() => setAdded(false), 1400);
  };

  const onBuyNow = () => {
    if (!addToCart(product, qty)) return;
    setDrawerOpen(true);
  };

  return (
    <main className="detail-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> <span>›</span> <span>{product.name}</span>
      </nav>

      <div className="detail-grid">
        <div className="detail-gallery">
          <div className="detail-main-img">
            {mainImg ? (
              <img src={mainImg} alt={product.name} />
            ) : (
              <div className="card-media-fallback big">{product.name.slice(0, 1)}</div>
            )}
            {product.discount > 0 && (
              <span className="badge badge-discount">-{product.discount}% OFF</span>
            )}
            {product.isNew && <span className="badge badge-new">New</span>}
          </div>
          {images.length > 1 && (
            <div className="detail-thumbs">
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`thumb ${i === imgIdx ? "active" : ""}`}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Photo ${i + 1} dekho`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <h1>{product.name}</h1>
          <div className="detail-price-row">
            <span className="price big">{inr(price)}</span>
            {product.discount > 0 && (
              <>
                <span className="mrp big">{inr(product.price)}</span>
                <span className="save-chip">
                  {inr(product.price - price)} bachao
                </span>
              </>
            )}
          </div>
          <span className={`stock-badge ${stock.cls}`}>{stock.text}</span>
          {product.description && <p className="detail-desc">{product.description}</p>}

          <div className="detail-buy">
            <div className="qty-row big">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kam karo">
                −
              </button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(q + 1, 10))} aria-label="Zyada karo">
                +
              </button>
            </div>
            <button
              className={`btn btn-primary btn-lg ${added ? "added" : ""}`}
              onClick={onAdd}
              disabled={product.stockType === "out"}
            >
              {added ? "✓ Cart me hai" : "Cart me daalo"}
            </button>
            <button
              className="btn btn-dark btn-lg"
              onClick={onBuyNow}
              disabled={product.stockType === "out"}
            >
              Buy now →
            </button>
            <button
              className={`btn btn-outline ${wished ? "wished" : ""}`}
              onClick={() => {
                toggleWishlist(product.id);
                pushToast(wished ? "Wishlist se hata diya" : "Wishlist me save kar diya");
              }}
              aria-pressed={wished}
            >
              {wished ? "♥ Wishlist me hai" : "♡ Wishlist"}
            </button>
          </div>

          <div className="detail-meta">
            <div>
              <strong>Delivery</strong>
              <span>Delhi me Porter rider se — order ke baad book hota hai.</span>
            </div>
            <div>
              <strong>Payment</strong>
              <span>UPI se — QR ya UPI app. Cash on Delivery nahi hai.</span>
            </div>
            <div>
              <strong>Madad</strong>
              <span>
                Sawal ho to{" "}
                <a href="https://wa.me/9773786804" target="_blank" rel="noreferrer">
                  WhatsApp karo
                </a>
                .
              </span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related-section">
          <h2>Ye bhi dekh lo</h2>
          <div className="product-grid">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
