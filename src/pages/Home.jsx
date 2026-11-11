import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useShop } from "../shop";
import { finalPrice, inr } from "../lib/format";
import { LOGO } from "../logoData";
import {
  EmptyState,
  Faq,
  ProductCard,
  ProductSkeleton,
  Reveal,
} from "../components";

const FILTERS = [
  { key: "all", label: "Sab kuch" },
  { key: "new", label: "New" },
  { key: "discount", label: "Discount" },
  { key: "instock", label: "In stock" },
  { key: "wishlist", label: "♥ Wishlist" },
];

export default function Home() {
  const { products, productsLoading, productsError, settings, wishlist } = useShop();
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") || "all";
  const q = (params.get("q") || "").trim().toLowerCase();
  const [sort, setSort] = useState("featured");

  const featured = useMemo(
    () => products.filter((p) => p.featured).sort((a, b) => a.bannerOrder - b.bannerOrder),
    [products]
  );

  const visible = useMemo(() => {
    let list = [...products];
    if (filter === "new") list = list.filter((p) => p.isNew);
    if (filter === "discount") list = list.filter((p) => p.discount > 0);
    if (filter === "instock") list = list.filter((p) => p.stockType !== "out");
    if (filter === "wishlist") list = list.filter((p) => wishlist.includes(p.id));
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    if (sort === "low") list.sort((a, b) => finalPrice(a) - finalPrice(b));
    if (sort === "high") list.sort((a, b) => finalPrice(b) - finalPrice(a));
    if (sort === "discount") list.sort((a, b) => b.discount - a.discount);
    return list;
  }, [products, filter, q, sort, wishlist]);

  const setFilter = (key) => {
    const next = new URLSearchParams(params);
    if (key === "all") next.delete("filter");
    else next.set("filter", key);
    setParams(next, { replace: true });
  };

  const heroProduct = featured[0];

  return (
    <main>
      {/* ---------- hero ---------- */}
      <section className="hero">
        <div className="hero-inner">
          <Reveal>
            <p className="hero-eyebrow">Delhi ki apni dukaan · Est. 2024</p>
            <h1>
              Saman seedha,
              <br />
              daam saaf.
            </h1>
            <p className="hero-sub">
              Order karo, UPI se pay karo — aur Porter rider tumhara saman
              Delhi me kahin bhi pahuncha dega. Na koi chhupa charge, na koi
              chakkar.
            </p>
            <div className="hero-ctas">
              <a href="#shop" className="btn btn-primary btn-lg">
                Shopping shuru karo ↓
              </a>
              <Link to="/track" className="btn btn-outline btn-lg">
                Order track karo
              </Link>
            </div>
            <ul className="hero-points">
              <li>
                <strong>₹{settings.freeDeliveryAbove || 999}+</strong> par free delivery
              </li>
              <li>
                <strong>UPI</strong> payment — site par hi
              </li>
              <li>
                <strong>Porter</strong> se same-day delivery
              </li>
            </ul>
          </Reveal>

          <Reveal delay={120} className="hero-card-wrap">
            {heroProduct ? (
              <Link to={`/product/${heroProduct.id}`} className="hero-card">
                <span className="hero-card-tag">Featured</span>
                {heroProduct.images?.[0] ? (
                  <img src={heroProduct.images[0]} alt={heroProduct.name} />
                ) : (
                  <div className="hero-card-fallback">{heroProduct.name.slice(0, 1)}</div>
                )}
                <span className="hero-card-info">
                  <span className="hero-card-name">{heroProduct.name}</span>
                  <span className="hero-card-price">
                    {inr(finalPrice(heroProduct))}
                    {heroProduct.discount > 0 && (
                      <s>{inr(heroProduct.price)}</s>
                    )}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="hero-card hero-card-soon">
                <span className="hero-card-tag">Jald aa raha hai</span>
                <img src={LOGO} alt="Quick-shop" className="hero-logo" />
                <p>
                  Naya stock bhar rahe hain.
                  <br />
                  Pehle dekhne ke liye wishlist taiyaar rakho.
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ---------- featured strip ---------- */}
      {featured.length > 1 && (
        <section className="featured-strip">
          <div className="section-head">
            <h2>Featured — khaas pasand</h2>
            <span>{featured.length} items</span>
          </div>
          <div className="strip-scroll">
            {featured.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="strip-card">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} loading="lazy" />
                ) : (
                  <span className="strip-fallback">{p.name.slice(0, 1)}</span>
                )}
                <span className="strip-name">{p.name}</span>
                <span className="strip-price">{inr(finalPrice(p))}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- shop grid ---------- */}
      <section className="shop-section" id="shop">
        <div className="section-head">
          <h2>{q ? `"${q}" ke results` : "Dukaan me kya hai"}</h2>
          <span>
            {productsLoading ? "…" : `${visible.length} item${visible.length === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="filter-row">
          <div className="chips" role="tablist" aria-label="Filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`chip ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
                role="tab"
                aria-selected={filter === f.key}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="sort-wrap">
            <span>Sort:</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="discount">Sabse zyada discount</option>
            </select>
          </label>
        </div>

        {productsError && (
          <div className="alert alert-error">
            Products load nahi ho paye ({productsError}). Page refresh karke dobara try karo.
          </div>
        )}

        {productsLoading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Dukaan abhi stock bhar rahi hai"
            body="Abhi yahan koi product nahi hai — naya stock jald aa raha hai. Tab tak wishlist taiyaar rakho, aur kuch poochna ho to WhatsApp par baat kar lo."
            action={
              <a
                className="btn btn-primary"
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp par pooch lo
              </a>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Kuch nahi mila"
            body={
              q
                ? `"${q}" se match karta koi product nahi mila. Spelling check karo ya koi aur word try karo.`
                : "Is filter me abhi koi product nahi hai."
            }
            action={
              <button className="btn btn-outline" onClick={() => setFilter("all")}>
                Saare products dekho
              </button>
            }
          />
        ) : (
          <div className="product-grid">
            {visible.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- how it works ---------- */}
      <section className="how-section">
        <Reveal>
          <h2>Kaise kaam karta hai?</h2>
        </Reveal>
        <div className="how-grid">
          {[
            { n: "1", t: "Order karo", d: "Product chuno, cart me daalo, address bharo." },
            { n: "2", t: "UPI se pay karo", d: "QR scan karo ya UPI app me pay karo. UTR daalna mat bhoolo." },
            { n: "3", t: "Hum confirm karenge", d: "Payment verify hote hi order confirm aur pack hota hai." },
            { n: "4", t: "Porter le aayega", d: "Two-wheeler rider tumhara order Delhi me kahin bhi pahuncha dega." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="how-card">
                <span className="how-num">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="faq-section">
        <Reveal>
          <h2>Aksar poochhe jaane wale sawal</h2>
        </Reveal>
        <Faq
          items={[
            {
              q: "Delivery kahan tak hoti hai?",
              a: "Sirf Delhi me. Order ke baad hum Porter two-wheeler rider book karte hain, jo tumhara saman ghar tak pahuncha deta hai. Delhi ke bahar delivery nahi hoti.",
            },
            {
              q: "Delivery charge kitna hai?",
              a: `Delivery charge ₹${settings.deliveryFee || 60} hai, aur ₹${settings.freeDeliveryAbove || 999} se upar ke orders par free hai. Charge customer deta hai — checkout par total me dikh jayega.`,
            },
            {
              q: "Payment kaise karte hain?",
              a: "Sirf UPI se — QR scan karo ya apne UPI app (GPay, PhonePe, Paytm) me pay karo. Cash on Delivery nahi hai, kyunki Porter rider payment collect nahi karta.",
            },
            {
              q: "Payment ke baad kya hoga?",
              a: "Tum 'I have paid' dabao, hum tumhari payment apne UPI app me verify karenge, phir order confirm karke pack karenge. Order ID se track bhi kar sakte ho.",
            },
            {
              q: "Order track kaise karun?",
              a: "Upar 'Track order' par click karo, apna Order ID aur phone number daalo — order ki status dikh jayegi: New, Confirmed, Packed, Out for delivery, Delivered.",
            },
          ]}
        />
      </section>
    </main>
  );
}
