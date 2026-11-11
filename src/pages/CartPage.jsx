import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../shop";
import { finalPrice, inr } from "../lib/format";

export default function CartPage() {
  const { cartDetailed, cartSubtotal, setQty, removeFromCart, clearCart, settings } = useShop();
  const navigate = useNavigate();

  const freeAbove = settings.freeDeliveryAbove || 999;
  const deliveryFee = cartSubtotal >= freeAbove || cartSubtotal === 0 ? 0 : settings.deliveryFee || 60;
  const total = cartSubtotal + deliveryFee;

  if (cartDetailed.length === 0) {
    return (
      <main className="cart-page">
        <div className="empty-state">
          <p className="big-emoji" aria-hidden="true">
            🛒
          </p>
          <h3>Cart abhi khaali hai</h3>
          <p>Kuch pasand aaye to cart me daalo, phir yahan se checkout karna.</p>
          <Link className="btn btn-primary" to="/">
            Shopping shuru karo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>Tumhara cart</h1>
      <div className="cart-layout">
        <ul className="cart-items">
          {cartDetailed.map((item) => (
            <li key={item.id} className="cart-item">
              <Link to={`/product/${item.id}`} className="cart-thumb">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} />
                ) : (
                  <span>{item.name.slice(0, 1)}</span>
                )}
              </Link>
              <div className="cart-item-info">
                <Link to={`/product/${item.id}`} className="cart-item-name">
                  {item.name}
                </Link>
                <span className="cart-item-price">
                  {inr(finalPrice(item))}
                  {item.discount > 0 && <s>{inr(item.price)}</s>}
                </span>
                <div className="qty-row">
                  <button onClick={() => setQty(item.id, item.qty - 1)} aria-label="Kam karo">
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button onClick={() => setQty(item.id, item.qty + 1)} aria-label="Zyada karo">
                    +
                  </button>
                </div>
              </div>
              <div className="cart-item-right">
                <strong>{inr(item.lineTotal)}</strong>
                <button className="remove-link" onClick={() => removeFromCart(item.id)}>
                  Hatayo
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="summary-card">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{inr(cartSubtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery (Porter, Delhi)</span>
            <span>{deliveryFee === 0 ? "FREE" : inr(deliveryFee)}</span>
          </div>
          {deliveryFee > 0 && (
            <p className="summary-hint">
              ₹{inr(freeAbove - cartSubtotal)} aur ka saman lo — delivery free ho jayegi.
            </p>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <strong>{inr(total)}</strong>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate("/checkout")}>
            Checkout →
          </button>
          <button className="btn btn-ghost btn-block" onClick={clearCart}>
            Cart khaali karo
          </button>
          <p className="summary-note">
            Payment UPI se hogi. Cash on Delivery nahi hai.
          </p>
        </aside>
      </div>
    </main>
  );
}
