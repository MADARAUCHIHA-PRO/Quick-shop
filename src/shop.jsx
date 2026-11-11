import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { finalPrice, normalizeProduct } from "./lib/format";

export const DEFAULT_SETTINGS = {
  shopName: "Quick-shop",
  upiId: "quickshop@okhdfcbank",
  upiPayee: "Quick-shop",
  deliveryFee: 60,
  freeDeliveryAbove: 999,
  whatsapp: "9773786804",
};

const PLACEHOLDER_UPI = DEFAULT_SETTINGS.upiId;

const ShopContext = createContext(null);

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export function ShopProvider({ children }) {
  // ---- theme: ONLY light / dark ----
  const [theme, setTheme] = useState(() => {
    const saved = readLS("qs-theme", null);
    if (saved === "light" || saved === "dark") return saved;
    return "light";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writeLS("qs-theme", theme);
  }, [theme]);
  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    []
  );

  // ---- products (live from Firestore) ----
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "products"),
      (snap) => {
        const list = snap.docs
          .map((d) => normalizeProduct(d.id, d.data()))
          .sort((a, b) => a.bannerOrder - b.bannerOrder || a.name.localeCompare(b.name));
        setProducts(list);
        setProductsLoading(false);
      },
      (err) => {
        setProductsError(err.message || "Products load nahi ho paye.");
        setProductsLoading(false);
      }
    );
    return unsub;
  }, []);

  // ---- settings (Firestore settings/shop, with safe built-in defaults) ----
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsFromCloud, setSettingsFromCloud] = useState(false);
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "shop"),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
          setSettingsFromCloud(true);
        }
      },
      () => {
        // Permission denied (rules not updated yet) or offline:
        // keep built-in defaults so the shop still works.
        setSettingsFromCloud(false);
      }
    );
    return unsub;
  }, []);

  const upiIsPlaceholder = settings.upiId === PLACEHOLDER_UPI;

  // ---- cart (localStorage) ----
  const [cart, setCart] = useState(() => readLS("qs-cart-v2", []));
  useEffect(() => writeLS("qs-cart-v2", cart), [cart]);

  const cartDetailed = useMemo(
    () =>
      cart
        .map((line) => {
          const p = products.find((x) => x.id === line.id);
          if (!p) return null;
          return { ...p, qty: line.qty, lineTotal: finalPrice(p) * line.qty };
        })
        .filter(Boolean),
    [cart, products]
  );
  const cartCount = useMemo(
    () => cartDetailed.reduce((s, l) => s + l.qty, 0),
    [cartDetailed]
  );
  const cartSubtotal = useMemo(
    () => cartDetailed.reduce((s, l) => s + l.lineTotal, 0),
    [cartDetailed]
  );

  // Drop cart lines whose product no longer exists, once products have loaded.
  // (Without this, a deleted product would linger invisibly in localStorage.)
  useEffect(() => {
    if (productsLoading) return;
    setCart((prev) => {
      const pruned = prev.filter((l) => products.some((p) => p.id === l.id));
      return pruned.length === prev.length ? prev : pruned;
    });
  }, [productsLoading, products]);

  const addToCart = useCallback((product, qty = 1) => {
    if (!product || product.stockType === "out") return false;
    setCart((prev) => {
      const found = prev.find((l) => l.id === product.id);
      if (found) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, qty: Math.min(l.qty + qty, 10) } : l
        );
      }
      return [...prev, { id: product.id, qty }];
    });
    return true;
  }, []);

  const setQty = useCallback((id, qty) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, 10) } : l))
    );
  }, []);

  const removeFromCart = useCallback(
    (id) => setCart((prev) => prev.filter((l) => l.id !== id)),
    []
  );
  const clearCart = useCallback(() => setCart([]), []);

  // ---- wishlist (localStorage) ----
  const [wishlist, setWishlist] = useState(() => readLS("qs-wishlist-v2", []));
  useEffect(() => writeLS("qs-wishlist-v2", wishlist), [wishlist]);
  const toggleWishlist = useCallback((id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);
  const isWished = useCallback((id) => wishlist.includes(id), [wishlist]);

  // ---- toasts ----
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const pushToast = useCallback((message) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  // ---- cart drawer ----
  const [drawerOpen, setDrawerOpen] = useState(false);

  const value = {
    theme,
    toggleTheme,
    products,
    productsLoading,
    productsError,
    settings,
    settingsFromCloud,
    upiIsPlaceholder,
    cart,
    cartDetailed,
    cartCount,
    cartSubtotal,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    wishlist,
    toggleWishlist,
    isWished,
    toasts,
    pushToast,
    drawerOpen,
    setDrawerOpen,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
