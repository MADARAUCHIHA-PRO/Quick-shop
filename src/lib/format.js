export const inr = (n) =>
  "₹" + (Math.round(Number(n) || 0)).toLocaleString("en-IN");

export const finalPrice = (p) => {
  const price = Number(p?.price) || 0;
  const d = Number(p?.discount) || 0;
  if (!d) return price;
  return Math.round(price - (price * d) / 100);
};

export const stockLabel = (stockType) => {
  if (stockType === "out") return { text: "Out of stock", cls: "out" };
  if (stockType === "few") return { text: "Only a few left", cls: "few" };
  return { text: "In stock", cls: "in" };
};

export const normalizeProduct = (id, data = {}) => {
  const images = Array.isArray(data.images)
    ? data.images.filter(Boolean)
    : data.images
      ? [data.images]
      : [];
  return {
    id,
    productId: data.productId || id,
    name: data.name || "Unnamed product",
    price: Number(data.price) || 0,
    discount: Number(data.discount) || 0,
    stockType: data.stockType || data.stock || "available",
    description: data.description || "",
    images,
    isNew: data.isNew === true,
    featured: data.featured === true,
    bannerOrder: Number(data.bannerOrder) || 999,
  };
};

export const ORDER_STEPS = [
  { key: "new", label: "New", hint: "Order aaya hai — payment verify karo, phir Confirm karo." },
  { key: "confirmed", label: "Confirmed", hint: "Payment apne UPI/bank app me check karo, phir saman pack karo." },
  { key: "packed", label: "Packed", hint: "Saman pack karke ready rakho, address slip chipkao." },
  {
    key: "out_for_delivery",
    label: "Out for delivery",
    hint: "Porter app kholo — pickup: apni dukaan, drop: customer ka address, two-wheeler rider book karo.",
  },
  { key: "delivered", label: "Delivered", hint: "Customer ko mil gaya. Kaam khatam." },
];

export const orderStatusLabel = (s) =>
  (ORDER_STEPS.find((x) => x.key === s) || { label: s }).label;

export const makeOrderNo = () =>
  "QS-" +
  Date.now().toString(36).toUpperCase() +
  Math.random().toString(36).slice(2, 5).toUpperCase();
