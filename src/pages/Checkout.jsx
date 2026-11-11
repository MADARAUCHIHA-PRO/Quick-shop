import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useShop } from "../shop";
import { finalPrice, inr, makeOrderNo } from "../lib/format";

const emptyForm = { name: "", phone: "", address: "", pincode: "" };

export default function Checkout() {
  const { cartDetailed, cartSubtotal, clearCart, settings, upiIsPlaceholder } = useShop();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 details, 2 payment
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [utr, setUtr] = useState("");
  const [qr, setQr] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [orderNo] = useState(() => makeOrderNo());

  const deliveryFee =
    cartSubtotal >= (settings.freeDeliveryAbove || 999) || cartSubtotal === 0
      ? 0
      : settings.deliveryFee || 60;
  const total = cartSubtotal + deliveryFee;

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: settings.upiId || "",
      pn: settings.upiPayee || "Quick-shop",
      am: String(total),
      cu: "INR",
      tn: `${orderNo} Quick-shop order`,
    });
    return `upi://pay?${params.toString()}`;
  }, [settings.upiId, settings.upiPayee, total, orderNo]);

  useEffect(() => {
    if (step !== 2) return;
    let alive = true;
    QRCode.toDataURL(upiLink, { width: 280, margin: 1 })
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [step, upiLink]);

  if (cartDetailed.length === 0 && !placeError) {
    return (
      <main className="checkout-page">
        <div className="empty-state">
          <h3>Checkout ke liye cart khaali hai</h3>
          <p>Pehle kuch products cart me daalo.</p>
          <Link className="btn btn-primary" to="/">
            Shopping shuru karo
          </Link>
        </div>
      </main>
    );
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validateDetails = () => {
    const er = {};
    if (form.name.trim().length < 2) er.name = "Apna poora naam likho.";
    if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      er.phone = "Sahi 10-digit mobile number likho (6 se 9 se shuru).";
    if (form.address.trim().length < 10)
      er.address = "Poora address likho — ghar number, gali, area.";
    if (!/^\d{6}$/.test(form.pincode.trim()))
      er.pincode = "6-digit pincode likho.";
    else if (!form.pincode.trim().startsWith("110"))
      er.pincode = "Delivery sirf Delhi me hai — pincode 110 se shuru hona chahiye.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const placeOrder = async () => {
    setPlacing(true);
    setPlaceError("");
    const order = {
      orderNo,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
      },
      items: cartDetailed.map((i) => ({
        id: i.id,
        name: i.name,
        price: finalPrice(i),
        qty: i.qty,
      })),
      subtotal: cartSubtotal,
      deliveryFee,
      total,
      payment: {
        method: "upi",
        upiId: settings.upiId,
        utr: utr.trim(),
        status: "awaiting_verification",
      },
      status: "new",
      createdAt: serverTimestamp(),
    };
    try {
      // Order doc ID = order number, so tracking works with a get-only rule
      // (no public list — customer orders stay private).
      await setDoc(doc(db, "orders", orderNo), order);
      clearCart();
      navigate(`/order/${orderNo}`, {
        state: { order: { ...order, id: orderNo, createdAt: new Date().toISOString() } },
      });
    } catch (e) {
      setPlaceError(
        e?.code === "permission-denied"
          ? "Order save nahi ho paya — dukaan ki settings me abhi order saving on nahi hai. Neeche WhatsApp par apna order bhej do, hum wahan se confirm kar denge."
          : `Order save nahi ho paya (${e?.message || "unknown error"}). Dobara try karo ya WhatsApp par order bhej do.`
      );
    } finally {
      setPlacing(false);
    }
  };

  const waOrderText = encodeURIComponent(
    `Namaste Quick-shop! Mera order:\n\n${cartDetailed
      .map((i) => `• ${i.name} x ${i.qty} — ${inr(i.lineTotal)}`)
      .join("\n")}\n\nSubtotal: ${inr(cartSubtotal)}\nDelivery: ${deliveryFee === 0 ? "FREE" : inr(deliveryFee)}\nTotal: ${inr(total)}\nOrder No: ${orderNo}\n\nNaam: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}, ${form.pincode}`
  );

  return (
    <main className="checkout-page">
      <h1>Checkout</h1>
      <ol className="checkout-steps" aria-label="Checkout steps">
        <li className={step >= 1 ? "active" : ""}>
          <span>1</span> Details
        </li>
        <li className={step >= 2 ? "active" : ""}>
          <span>2</span> Payment
        </li>
        <li>
          <span>3</span> Done
        </li>
      </ol>

      <div className="checkout-layout">
        <section className="checkout-main">
          {step === 1 && (
            <form
              className="checkout-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (validateDetails()) setStep(2);
              }}
            >
              <h2>Tumhari details</h2>
              <label>
                Poora naam
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Jaise: Ayan Khan"
                  autoComplete="name"
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </label>
              <label>
                Mobile number
                <input
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  autoComplete="tel"
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </label>
              <label>
                Delivery address (Delhi)
                <textarea
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Ghar/flat number, gali, area, landmark"
                  rows={3}
                  autoComplete="street-address"
                />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </label>
              <label>
                Pincode
                <input
                  value={form.pincode}
                  onChange={set("pincode")}
                  placeholder="110001"
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
                {errors.pincode && <span className="field-error">{errors.pincode}</span>}
              </label>
              <p className="form-note">
                Delivery sirf Delhi me hoti hai — Porter two-wheeler rider se.
              </p>
              <button type="submit" className="btn btn-primary btn-block btn-lg">
                Payment par jao →
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="pay-box">
              <button className="back-link" onClick={() => setStep(1)}>
                ← Details badlo
              </button>
              <h2>UPI se payment karo — {inr(total)}</h2>
              <p>
                Neeche wala QR apne UPI app (GPay, PhonePe, Paytm) se scan karo,
                ya button se seedha app kholo.
              </p>
              {upiIsPlaceholder && (
                <div className="alert alert-warn">
                  Shop ki UPI ID abhi update ho rahi hai — payment karne se pehle
                  WhatsApp par confirm kar lein.
                </div>
              )}
              <div className="qr-wrap">
                {qr ? (
                  <img src={qr} alt={`UPI QR code — ${inr(total)} pay karein`} />
                ) : (
                  <div className="qr-loading">QR ban raha hai…</div>
                )}
                <p className="qr-amount">
                  Pay karo: <strong>{inr(total)}</strong>
                </p>
                <p className="qr-upi">
                  UPI ID: <strong>{settings.upiId}</strong> ({settings.upiPayee})
                </p>
              </div>
              <a className="btn btn-dark btn-block btn-lg" href={upiLink}>
                UPI app me pay karo ↗
              </a>

              <label className="utr-field">
                UTR / Transaction reference (agar ho to)
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Jaise: 432156789012"
                  inputMode="numeric"
                />
                <span className="field-hint">
                  Payment ke baad UPI app me jo 12-digit UTR dikhe, wo yahan daal do —
                  isse verification fast hoti hai. Na ho to khaali chhod do.
                </span>
              </label>

              <div className="pay-note">
                <strong>Yaad rakho:</strong> Payment verify hum khud apne UPI/bank app me
                karenge — ye automatic nahi hota. Verify hote hi order confirm ho
                jayega, aur tum Order ID se track kar sakoge.
              </div>

              {placeError && (
                <div className="alert alert-error">
                  {placeError}
                  <br />
                  <a
                    className="btn btn-outline"
                    href={`https://wa.me/${settings.whatsapp}?text=${waOrderText}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp par order bhejo
                  </a>
                </div>
              )}

              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={placeOrder}
                disabled={placing}
              >
                {placing ? "Order place ho raha hai…" : "✓ Maine pay kar diya — Order place karo"}
              </button>
              <p className="form-note">
                Order place karte hi tumhe Order ID milegi. Payment verify hone tak
                order "awaiting verification" rahega.
              </p>
            </div>
          )}
        </section>

        <aside className="summary-card">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {cartDetailed.map((i) => (
              <li key={i.id}>
                <span>
                  {i.name} × {i.qty}
                </span>
                <span>{inr(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{inr(cartSubtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery (Porter, Delhi)</span>
            <span>{deliveryFee === 0 ? "FREE" : inr(deliveryFee)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{inr(total)}</strong>
          </div>
          <p className="summary-note">
            Order No: <strong>{orderNo}</strong>
            <br />
            Cash on Delivery nahi hai — Porter rider payment collect nahi karta.
          </p>
        </aside>
      </div>
    </main>
  );
}
