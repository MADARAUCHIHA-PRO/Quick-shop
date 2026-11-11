import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { inr, ORDER_STEPS } from "../lib/format";

export default function OrderSuccess() {
  const { orderNo } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (order) return;
    let alive = true;
    (async () => {
      try {
        // Doc ID is the order number — single-doc get, no public list.
        const snap = await getDoc(doc(db, "orders", orderNo));
        if (!alive) return;
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          setLoadError("Order details load nahi ho paye — Order ID neeche note kar lo.");
        }
      } catch {
        if (alive)
          setLoadError("Order details load nahi ho paye — Order ID neeche note kar lo.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [order, orderNo]);

  return (
    <main className="order-page">
      <div className="order-success-card">
        <p className="success-tick" aria-hidden="true">
          ✓
        </p>
        <h1>Order mil gaya — shukriya!</h1>
        <p>
          Tumhara order place ho gaya hai. Payment verify hote hi hum order
          confirm karenge.
        </p>
        <div className="order-id-box">
          <span>Order ID</span>
          <strong>{orderNo}</strong>
        </div>
        {loadError && <div className="alert alert-warn">{loadError}</div>}

        {order && (
          <>
            <div className="order-status-line">
              <span>Status:</span>
              <strong>
                {order.status === "new"
                  ? "New — payment verify ho rahi hai"
                  : (ORDER_STEPS.find((s) => s.key === order.status) || {}).label || order.status}
              </strong>
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
            <div className="summary-row">
              <span>Delivery</span>
              <span>{order.deliveryFee === 0 ? "FREE" : inr(order.deliveryFee)}</span>
            </div>
            <div className="summary-row total">
              <span>Total (paid via UPI)</span>
              <strong>{inr(order.total)}</strong>
            </div>
            <p className="order-customer">
              {order.customer.name} · {order.customer.phone}
              <br />
              {order.customer.address}, {order.customer.pincode}
            </p>
            {order.payment?.utr && (
              <p className="order-utr">UTR: {order.payment.utr}</p>
            )}
          </>
        )}

        <div className="order-actions">
          <Link className="btn btn-primary" to={`/track?order=${orderNo}`}>
            Order track karo
          </Link>
          <Link className="btn btn-outline" to="/">
            Aur shopping karo
          </Link>
        </div>
        <p className="order-note">
          Kuch poochna ho to Order ID ke saath{" "}
          <a href="https://wa.me/9773786804" target="_blank" rel="noreferrer">
            WhatsApp karo
          </a>
          .
        </p>
      </div>
    </main>
  );
}
