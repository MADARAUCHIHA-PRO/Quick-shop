import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LOGO } from "../logoData";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { useShop, DEFAULT_SETTINGS } from "../shop";
import { finalPrice, inr, normalizeProduct, ORDER_STEPS, orderStatusLabel } from "../lib/format";

const emptyProduct = {
  name: "",
  price: "",
  discount: "0",
  stockType: "available",
  description: "",
  imagesText: "",
  isNew: false,
  featured: false,
  bannerOrder: "999",
};

export default function Admin() {
  const { products, productsLoading, settings, settingsFromCloud } = useShop();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState("dashboard");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setAuthLoading(false);
  }), []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setOrdersLoading(false);
      },
      (err) => {
        setOrdersError(err.message || "Orders load nahi ho paye.");
        setOrdersLoading(false);
      }
    );
    return unsub;
  }, [user]);

  const login = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setLoginError(
        err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password"
          ? "Email ya password galat hai."
          : `Login nahi ho paya (${err?.code || err?.message || "unknown error"}).`
      );
    }
  };

  if (authLoading) {
    return (
      <main className="admin-page">
        <p>Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-page admin-login">
        <div className="login-card">
          <img src={LOGO} alt="Quick-shop" />
          <h1>Admin login</h1>
          <p>Sirf dukaan ke malik ke liye — apna admin email aur password daalo.</p>
          <form onSubmit={login}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin email"
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                autoComplete="current-password"
              />
            </label>
            {loginError && <div className="alert alert-error">{loginError}</div>}
            <button className="btn btn-primary btn-block btn-lg" type="submit">
              Login karo
            </button>
          </form>
          <Link to="/" className="back-link">
            ← Dukaan par wapas jao
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Admin panel</h1>
          <p>
            Logged in: {user.email} ·{" "}
            <button className="remove-link" onClick={() => signOut(auth)}>
              Logout
            </button>
          </p>
        </div>
        <Link className="btn btn-outline" to="/" target="_blank" rel="noreferrer">
          Dukaan dekho ↗
        </Link>
      </div>

      {!settingsFromCloud && (
        <div className="alert alert-warn">
          Settings cloud se load nahi ho rahi — default values dikh rahi hain.
          Yahan save karne ke baad bhi agar load nahi hoti, to Firestore rules
          check karo.
        </div>
      )}

      <div className="admin-tabs" role="tablist">
        {[
          ["dashboard", "Dashboard"],
          ["products", `Products (${products.length})`],
          ["orders", `Orders (${orders.length})`],
          ["settings", "Settings"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`admin-tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
            role="tab"
            aria-selected={tab === key}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <Dashboard orders={orders} ordersLoading={ordersLoading} ordersError={ordersError} products={products} />
      )}
      {tab === "products" && <ProductManager products={products} loading={productsLoading} />}
      {tab === "orders" && (
        <OrderManager orders={orders} loading={ordersLoading} error={ordersError} />
      )}
      {tab === "settings" && <SettingsForm settings={settings} />}
    </main>
  );
}

/* ---------------- dashboard ---------------- */
function Dashboard({ orders, ordersLoading, ordersError, products }) {
  const stats = useMemo(() => {
    const done = orders.filter((o) => o.status !== "cancelled");
    const revenue = done.reduce((s, o) => s + (Number(o.total) || 0), 0);
    return {
      total: orders.length,
      fresh: orders.filter((o) => o.status === "new").length,
      awaiting: orders.filter((o) => o.payment?.status === "awaiting_verification").length,
      revenue,
    };
  }, [orders]);

  const lowStock = products.filter((p) => p.stockType === "few" || p.stockType === "out");

  return (
    <section>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Total orders</span>
          <strong>{ordersLoading ? "…" : stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>New orders</span>
          <strong>{ordersLoading ? "…" : stats.fresh}</strong>
        </div>
        <div className="stat-card">
          <span>Payment verify karni hai</span>
          <strong>{ordersLoading ? "…" : stats.awaiting}</strong>
        </div>
        <div className="stat-card">
          <span>Revenue (cancelled chhod kar)</span>
          <strong>{ordersLoading ? "…" : inr(stats.revenue)}</strong>
        </div>
      </div>

      {ordersError && <div className="alert alert-error">{ordersError}</div>}

      <div className="dash-cols">
        <div className="dash-box">
          <h2>Low stock — dhyaan do</h2>
          {lowStock.length === 0 ? (
            <p className="muted">Sab products ka stock theek hai.</p>
          ) : (
            <ul className="low-stock-list">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span className={`stock-badge ${p.stockType === "out" ? "out" : "few"}`}>
                    {p.stockType === "out" ? "Out of stock" : "Only a few left"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="dash-box">
          <h2>Recent orders</h2>
          {ordersLoading ? (
            <p className="muted">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="muted">Abhi koi order nahi aaya hai.</p>
          ) : (
            <ul className="recent-list">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <span>
                    <strong>{o.orderNo}</strong> · {o.customer?.name}
                  </span>
                  <span>
                    {inr(o.total)} · {orderStatusLabel(o.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- products ---------------- */
function ProductManager({ products, loading }) {
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const set = (key) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: v }));
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      discount: String(p.discount),
      stockType: p.stockType,
      description: p.description || "",
      imagesText: (p.images || []).join("\n"),
      isNew: p.isNew,
      featured: p.featured,
      bannerOrder: String(p.bannerOrder),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!form.name.trim() || Number(form.price) <= 0) {
      setErr("Naam aur sahi price (0 se zyada) zaroori hai.");
      return;
    }
    const data = {
      name: form.name.trim(),
      price: Number(form.price),
      discount: Math.min(100, Math.max(0, Number(form.discount) || 0)),
      stockType: form.stockType,
      description: form.description.trim(),
      images: form.imagesText.split("\n").map((s) => s.trim()).filter(Boolean),
      isNew: !!form.isNew,
      featured: !!form.featured,
      bannerOrder: Number(form.bannerOrder) || 999,
    };
    setSaving(true);
    try {
      if (editingId) {
        await setDoc(doc(db, "products", editingId), data, { merge: true });
        setMsg("Product update ho gaya.");
      } else {
        await addDoc(collection(db, "products"), data);
        setMsg("Product add ho gaya.");
      }
      setForm(emptyProduct);
      setEditingId(null);
    } catch (e2) {
      setErr(`Save nahi ho paya (${e2?.code || e2?.message || "unknown error"}).`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`"${p.name}" delete karna hai? Ye wapas nahi aayega.`)) return;
    try {
      await deleteDoc(doc(db, "products", p.id));
    } catch (e) {
      setErr(`Delete nahi ho paya (${e?.code || e?.message || "unknown error"}).`);
    }
  };

  return (
    <section>
      <form className="product-form" onSubmit={save}>
        <h2>{editingId ? "Product edit karo" : "Naya product add karo"}</h2>
        <div className="form-grid">
          <label>
            Naam *
            <input value={form.name} onChange={set("name")} placeholder="Jaise: USB-C Charger 25W" />
          </label>
          <label>
            Price (₹) *
            <input value={form.price} onChange={set("price")} placeholder="499" inputMode="numeric" />
          </label>
          <label>
            Discount (%)
            <input value={form.discount} onChange={set("discount")} placeholder="0" inputMode="numeric" />
          </label>
          <label>
            Stock
            <select value={form.stockType} onChange={set("stockType")}>
              <option value="available">In stock</option>
              <option value="few">Only a few left</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
          <label className="span-2">
            Description
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Product ke baare me 1–2 lines — kya hai, kis kaam ka hai."
              rows={2}
            />
          </label>
          <label className="span-2">
            Photo URLs (har line par ek link)
            <textarea
              value={form.imagesText}
              onChange={set("imagesText")}
              placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
              rows={2}
            />
          </label>
          <label>
            Banner order (featured me kis number par)
            <input value={form.bannerOrder} onChange={set("bannerOrder")} placeholder="999" inputMode="numeric" />
          </label>
          <div className="check-row">
            <label>
              <input type="checkbox" checked={form.isNew} onChange={set("isNew")} /> New
            </label>
            <label>
              <input type="checkbox" checked={form.featured} onChange={set("featured")} /> Featured
            </label>
          </div>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-ok">{msg}</div>}
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Save ho raha hai…" : editingId ? "Update karo" : "Add karo"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyProduct);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="section-title">Saare products ({products.length})</h2>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : products.length === 0 ? (
        <div className="alert">
          Abhi koi product nahi hai — upar wale form se pehla product add karo.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <br />
                    <span className="muted small">{p.id}</span>
                  </td>
                  <td>
                    {inr(finalPrice(p))}
                    {p.discount > 0 && (
                      <>
                        <br />
                        <s className="muted">{inr(p.price)}</s> (−{p.discount}%)
                      </>
                    )}
                  </td>
                  <td>
                    <span className={`stock-badge ${p.stockType === "out" ? "out" : p.stockType === "few" ? "few" : "in"}`}>
                      {p.stockType === "out" ? "Out" : p.stockType === "few" ? "Few" : "In stock"}
                    </span>
                  </td>
                  <td>
                    {p.isNew ? "New " : ""}
                    {p.featured ? "Featured" : ""}
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- orders ---------------- */
function OrderManager({ orders, loading, error }) {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const setStatus = async (order, next) => {
    setBusy(order.id + next);
    setErr("");
    try {
      await updateDoc(doc(db, "orders", order.id), { status: next });
    } catch (e) {
      setErr(`Status update nahi ho paya (${e?.code || e?.message || "unknown error"}).`);
    } finally {
      setBusy("");
    }
  };

  const verifyPayment = async (order) => {
    setBusy(order.id + "pay");
    setErr("");
    try {
      await updateDoc(doc(db, "orders", order.id), {
        "payment.status": "verified",
      });
    } catch (e) {
      setErr(`Payment verify nahi ho paya (${e?.code || e?.message || "unknown error"}).`);
    } finally {
      setBusy("");
    }
  };

  if (loading) return <p className="muted">Orders load ho rahe hain…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (orders.length === 0)
    return <div className="alert">Abhi koi order nahi aaya hai.</div>;

  return (
    <section>
      {err && <div className="alert alert-error">{err}</div>}
      <div className="order-list">
        {orders.map((o) => {
          const stepIdx = ORDER_STEPS.findIndex((s) => s.key === o.status);
          const nextStep = stepIdx >= 0 && stepIdx < ORDER_STEPS.length - 1 ? ORDER_STEPS[stepIdx + 1] : null;
          const payPending = o.payment?.status === "awaiting_verification";
          return (
            <article key={o.id} className="admin-order-card">
              <div className="admin-order-head">
                <div>
                  <strong>{o.orderNo}</strong>
                  <span className="muted">
                    {" "}
                    · {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString("en-IN") : ""}
                  </span>
                  <br />
                  <span>
                    {o.customer?.name} · {o.customer?.phone}
                  </span>
                  <br />
                  <span className="muted small">
                    {o.customer?.address}, {o.customer?.pincode}
                  </span>
                </div>
                <div className="admin-order-total">
                  <strong>{inr(o.total)}</strong>
                  <span className={`pay-pill ${payPending ? "pending" : "ok"}`}>
                    {payPending ? "Payment verify karni hai" : "Payment verified ✓"}
                  </span>
                </div>
              </div>

              <ul className="summary-items">
                {(o.items || []).map((i, idx) => (
                  <li key={idx}>
                    <span>
                      {i.name} × {i.qty}
                    </span>
                    <span>{inr(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              {o.payment?.utr && <p className="order-utr">UTR: {o.payment.utr}</p>}

              {o.status === "cancelled" ? (
                <p className="cancelled-note">Ye order cancel ho gaya hai.</p>
              ) : (
                <>
                  <ol className="order-stepper small">
                    {ORDER_STEPS.map((s, i) => (
                      <li key={s.key} className={i <= stepIdx ? "done" : ""}>
                        <span className="step-dot">{i < stepIdx ? "✓" : i + 1}</span>
                        <span className="step-label">{s.label}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="step-hint">
                    <strong>Ab kya karna hai:</strong>{" "}
                    {(ORDER_STEPS[stepIdx] || {}).hint || ""}
                  </p>
                  <div className="order-actions-row">
                    {payPending && (
                      <button
                        className="btn btn-dark btn-sm"
                        disabled={busy === o.id + "pay"}
                        onClick={() => verifyPayment(o)}
                      >
                        Payment verify karo (UPI app me check karke)
                      </button>
                    )}
                    {nextStep && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={busy === o.id + nextStep.key}
                        onClick={() => setStatus(o, nextStep.key)}
                      >
                        → {nextStep.label} karo
                      </button>
                    )}
                    {o.status !== "delivered" && (
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={busy === o.id + "cancelled"}
                        onClick={() => {
                          if (window.confirm("Ye order cancel karna hai?")) setStatus(o, "cancelled");
                        }}
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- settings ---------------- */
function SettingsForm({ settings }) {
  const [form, setForm] = useState({
    shopName: settings.shopName || DEFAULT_SETTINGS.shopName,
    upiId: settings.upiId || DEFAULT_SETTINGS.upiId,
    upiPayee: settings.upiPayee || DEFAULT_SETTINGS.upiPayee,
    deliveryFee: String(settings.deliveryFee ?? DEFAULT_SETTINGS.deliveryFee),
    freeDeliveryAbove: String(settings.freeDeliveryAbove ?? DEFAULT_SETTINGS.freeDeliveryAbove),
    whatsapp: settings.whatsapp || DEFAULT_SETTINGS.whatsapp,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!form.upiId.trim() || !form.upiPayee.trim()) {
      setErr("UPI ID aur payee naam dono zaroori hain — warna customer pay nahi kar payega.");
      return;
    }
    setSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "shop"),
        {
          shopName: form.shopName.trim() || DEFAULT_SETTINGS.shopName,
          upiId: form.upiId.trim(),
          upiPayee: form.upiPayee.trim(),
          deliveryFee: Math.max(0, Number(form.deliveryFee) || 0),
          freeDeliveryAbove: Math.max(0, Number(form.freeDeliveryAbove) || 0),
          whatsapp: form.whatsapp.replace(/\D/g, "") || DEFAULT_SETTINGS.whatsapp,
        },
        { merge: true }
      );
      setMsg("Settings save ho gayi.");
    } catch (e2) {
      setErr(`Save nahi ho paya (${e2?.code || e2?.message || "unknown error"}). Firestore rules check karo.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <form className="settings-form" onSubmit={save}>
        <h2>Shop settings</h2>
        <p className="muted">
          Ye settings poori site par lagu hoti hain — checkout ka UPI QR, delivery
          charge, sab yahin se chalta hai.
        </p>
        <label>
          Shop ka naam
          <input value={form.shopName} onChange={set("shopName")} />
        </label>
        <label>
          UPI ID *
          <input value={form.upiId} onChange={set("upiId")} placeholder="tumhara-naam@okhdfcbank" />
          <span className="field-hint">
            Yehi ID checkout wale QR me aayegi. Apni asli UPI ID daalo — placeholder
            wali ID par payment nahi aayega.
          </span>
        </label>
        <label>
          UPI payee naam *
          <input value={form.upiPayee} onChange={set("upiPayee")} placeholder="Tumhara naam" />
          <span className="field-hint">UPI app me payment karte waqt ye naam dikhega.</span>
        </label>
        <label>
          Delivery fee (₹)
          <input value={form.deliveryFee} onChange={set("deliveryFee")} inputMode="numeric" />
        </label>
        <label>
          Free delivery kis amount se upar? (₹)
          <input value={form.freeDeliveryAbove} onChange={set("freeDeliveryAbove")} inputMode="numeric" />
        </label>
        <label>
          Support WhatsApp number (country code ke saath, + ke bina)
          <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="919773786804" />
        </label>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-ok">{msg}</div>}
        <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
          {saving ? "Save ho raha hai…" : "Settings save karo"}
        </button>
      </form>
    </section>
  );
}
