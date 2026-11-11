import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ShopProvider } from "./shop";
import { CartDrawer, Footer, Header, Toasts } from "./components";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";
import Admin from "./pages/Admin";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ShopProvider>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:orderNo" element={<OrderSuccess />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="*"
          element={
            <main className="not-found">
              <h1>Ye page nahi mila</h1>
              <p>Link galat ho sakta hai, ya page hata diya gaya ho.</p>
              <a className="btn btn-primary" href="/">
                Home par jao
              </a>
            </main>
          }
        />
      </Routes>
      <Footer />
      <CartDrawer />
      <Toasts />
    </ShopProvider>
  );
}
