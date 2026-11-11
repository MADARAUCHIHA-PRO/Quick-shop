import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { inr, ORDER_STEPS, orderStatusLabel } from "../lib/format";

export default function TrackOrder() {
  const [params] = useSearchParams();
  const [orderNo, setOrderNo] = useState(params.get("order") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    setMessage("");
    setOrder(null);
    const no = orderNo.trim();
    const ph = phone.trim();
    if (!no || !/^[6-9]\d{9}$/.test(ph)) {
      setMessage("Order ID aur sahi 10-digit mobile number daalo.");
      return;
    }
    setSearching(true);
    try {
      // Doc ID is the order number, so this is a single-doc get —
      // no public list of orders (customer phone/address stay private).
      const snap = await getDoc(doc(db, "orders", no));
      if (!snap.exists()) {
        setMessage("Ye Order ID nahi mili — ID dobara check karo.");
      } else {
        const found = { id: snap.id, ...snap.data() };
        if (found.customer?.phone !== ph) {
          setMessage("Phone number match nahi hua — jis number se order kiya tha, wahi daalo.");
        } else {
          setOrder(found);
        }
      }
    } catch (err) {
      setMessage(
        err?.code === "permission-denied"
          ? "Tracking abhi available nahi hai — Order ID ke saath WhatsApp par pooch lo."
          : "Kuch gadbad hui — dobara try karo."
      );
    } finally {
      setSearching(false);
    }
  };

  const stepIndex = order
    ? order.status === "cancelled"
      ? -1
      : ORDER_STEPS.findIndex((s) => s.key === order.status)
    : -1;

  return (
    <main className="track-page">
      <h1>Order track karo</h1>
      <p className="page-sub">
        Order ID aur jis mobile number se order kiya tha, wo daalo.
      </p>

      <form className="track-form" onSubmit={search}>
        <label>
          Order ID
          <input
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="Jaise: QS-ABC123"
          />
        </label>
        <label>
          Mobile number
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            inputMode="numeric"
          />
        </label>
        <button className="btn btn-primary btn-lg" type="submit" disabled={searching}>
          {searching ? "Dhoondh rahe hain…" : "Track karo"}
        </button>
      </form>

      {message && <div className="alert alert-error">{message}</div>}

      {order && (
        <div className="track-result">
          {order.status === "cancelled" ? (
            <div className="alert alert-warn">
              Ye order <strong>cancel</strong> ho gaya hai. Paise wapas ke liye
              WhatsApp par baat karo.
            </div>
          ) : (
            <ol className="order-stepper">
              {ORDER_STEPS.map((s, i) => (
                <li key={s.key} className={i <= stepIndex ? "done" : ""}>
                  <span className="step-dot">{i < stepIndex ? "✓" : i + 1}</span>
                  <span className="step-label">{s.label}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="track-summary">
            <div className="summary-row">
              <span>Status</span>
              <strong>{orderStatusLabel(order.status)}</strong>
            </div>
            <div className="summary-row">
              <span>Payment</span>
              <strong>
                {order.payment?.status === "verified"
                  ? "Verified ✓"
                  : "UPI — verify ho rahi hai"}
              </strong>
            </div>
            <div className="summary-row">
              <span>Total</span>
              <strong>{inr(order.total)}</strong>
            </div>
            <ul className="summary-items">
              {order.items.map((i, idx) => (
                <li key={idx}>
                  <span>
                    {i.name} × {i.qty}
                  </span>
                  <span>{inr(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <p className="summary-note">
              Deliver to: {order.customer.name}, {order.customer.address},{" "}
              {order.customer.pincode}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
