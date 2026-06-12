import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

/* ================= AUTH ================= */

/* ================= TELEGRAM ================= */

const TELEGRAM_BOT_TOKEN = "8676350117:AAGoXA6-r3Q2dpYo7sXidtQqNOUEE0esK-A";
const TELEGRAM_CHAT_ID   = "-1003916779961";
const WEBSITE_URL        = "https://quickshop.netlify.app";
const WHATSAPP_NUMBER    = "919773786804";

/* ================= FIREBASE ================= */

const firebaseConfig = {
  apiKey:            "AIzaSyAQhBWcHqBXCOCF_RhFhDyCnthy3t8luZM",
  authDomain:        "quick-shop-63627.firebaseapp.com",
  projectId:         "quick-shop-63627",
  storageBucket:     "quick-shop-63627.appspot.com",
  messagingSenderId: "461073578456",
  appId:             "1:461073578456:web:db6548f79b4a0af82c1aad"
};

const app         = initializeApp(firebaseConfig);
const db          = getFirestore(app);
const auth = getAuth(app);
const productsRef = collection(db, "products");

/* ================= ELEMENTS ================= */

const authView       = document.getElementById("authView");
const dashboardView  = document.getElementById("dashboardView");
const loginForm      = document.getElementById("loginForm");
const adminId        = document.getElementById("adminId");
const adminPass      = document.getElementById("adminPass");
const logoutBtn      = document.getElementById("logoutBtn");
const productForm    = document.getElementById("productForm");
const productGrid    = document.getElementById("productGrid");
const featuredGrid   = document.getElementById("featuredGrid");
const filterSelect   = document.getElementById("filterSelect");
const searchInput    = document.getElementById("searchInput");
const statsGrid      = document.getElementById("statsGrid");
const toastStack     = document.getElementById("toastStack");
const editModal      = document.getElementById("editModal");
const editForm       = document.getElementById("editForm");
const closeModalBtn  = document.getElementById("closeModalBtn");
const saveBtn        = document.getElementById("saveBtn");

/* SHARE MODAL */
const shareModal         = document.getElementById("shareModal");
const closeShareModalBtn = document.getElementById("closeShareModalBtn");
const sharePreviewImage  = document.getElementById("sharePreviewImage");
const sharePreviewText   = document.getElementById("sharePreviewText");
const openWhatsappBtn    = document.getElementById("openWhatsappBtn");
const copyProductBtn     = document.getElementById("copyProductBtn");
const shareAgainBtn      = document.getElementById("shareAgainBtn");

let products       = [];
let latestShareData = null;

/* ================= TOAST ================= */

const toast = (msg, err = false) => {
  const t = document.createElement("div");
  t.className = `toast ${err ? "err" : ""}`;
  t.textContent = msg;
  toastStack.appendChild(t);
  setTimeout(() => t.remove(), 2200);
};

/* ================= HELPERS ================= */

const cleanLines = v =>
  v.split("\n").map(x => x.trim()).filter(Boolean);

const cleanComma = v =>
  v.split(",").map(x => x.trim()).filter(Boolean);

/* ================= FORMAT ================= */

const format = (form) => {
  const fd = new FormData(form);

  // Collect designs — design1 … design5
  const designs = [];
  for (let i = 1; i <= 5; i++) {
    const val = (fd.get(`design${i}`) || "").trim();
    if (val) designs.push(val);
  }

  return {
    name:            fd.get("name")?.trim(),
    price:           Number(fd.get("price") || 0),
    discount:        Number(fd.get("discount") || 0),
    stockType:       fd.get("stockType"),
    description:     fd.get("description")?.trim(),
    fullDescription: fd.get("fullDescription")?.trim(),
    highlights:      cleanComma(fd.get("highlights") || ""),
    images:          cleanLines(fd.get("images") || ""),
    isNew:           fd.get("isNew") === "on",
    designs,            // ← new field
    featured:        false,
    bannerOrder:     999
  };
};

/* ================= PRICE ================= */

const getFinalPrice = (price, discount) => {
  if (!discount) return price;
  return Math.round(price - (price * discount / 100));
};

/* ================= WHATSAPP ================= */

const createWhatsappMessage = (productId, product) => {
  const { name, price, discount, description, images } = product;
  const finalPrice = getFinalPrice(price, discount);
  const productLink = `${WEBSITE_URL}/product.html?id=${productId}`;
  const image = images?.[0] || "";

  const message = `${image}

━━━━━━━━━━━━━━
🔥 QUICK SHOP 🔥
━━━━━━━━━━━━━━

🛍 ${name}

💸 ₹${finalPrice}  (${discount}% OFF)

✨ ${description}

🛒 VIEW PRODUCT:
${productLink}

━━━━━━━━━━━━━━`;

  return {
    image,
    productLink,
    message,
    encoded: encodeURIComponent(message)
  };
};

const openWhatsappShare = async () => {
  if (!latestShareData) return;
  const waUrl = `https://wa.me/?text=${latestShareData.encoded}`;
  window.open(waUrl, "_blank");
  toast("WhatsApp Share Opened");
};

const previewShare = (data) => {
  latestShareData = data;
  sharePreviewImage.src    = data.image;
  sharePreviewText.textContent = data.message;
  shareModal.classList.remove("hidden");
};

/* ================= TELEGRAM POST ================= */

const sendTelegramPost = async (productId, productData) => {
  try {
    const { name, price, discount, description, images } = productData;
    const finalPrice  = getFinalPrice(price, discount);
    const productLink = `${WEBSITE_URL}/product.html?id=${productId}`;
    const whatsappText = encodeURIComponent(`I want to buy ${name}`);
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;

    const caption =
`🔥 NEW PRODUCT DROPPED 🔥

🛍 ${name}

💸 ₹${finalPrice} (-${discount}%)

✨ ${description}

🛒 View Product:
${productLink}

📲 Buy On WhatsApp:
${whatsappLink}`;

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    TELEGRAM_CHAT_ID,
          photo:      images?.[0] || "",
          caption,
          parse_mode: "HTML"
        })
      }
    );

    const data = await response.json();
    if (data.ok) {
      console.log("Telegram Post Sent Successfully");
    } else {
      console.error("Telegram Error:", data);
    }
  } catch (err) {
    console.error("Telegram Send Failed:", err);
  }
};

/* ================= STATS ================= */

const renderStats = () => {
  const featuredCount = products.filter(p => p.featured).length;
  statsGrid.innerHTML = `
  <div class="stat glass">
    <h4>Total Products</h4>
    <strong>${products.length}</strong>
  </div>
  <div class="stat glass">
    <h4>Featured Products</h4>
    <strong>${featuredCount}</strong>
  </div>`;
};

/* ================= FEATURED ================= */

const renderFeaturedProducts = () => {
  const featuredProducts = products
    .filter(p => p.featured)
    .sort((a, b) => (a.bannerOrder || 999) - (b.bannerOrder || 999));

  if (!featuredProducts.length) {
    featuredGrid.innerHTML = `
    <div class="glass panel">
      No featured products selected.
    </div>`;
    return;
  }

  featuredGrid.innerHTML = featuredProducts.map(p => `
  <div class="featured-card">
    <span class="featured-order">#${p.bannerOrder || 1}</span>
    <img src="${p.images?.[0] || ""}">
    <h4>${p.name}</h4>
    <div class="featured-meta">
      <span>₹${p.price}</span>
      <span>${p.discount || 0}% OFF</span>
    </div>
  </div>`).join("");
};

/* ================= PRODUCTS ================= */

const renderProducts = () => {
  const q      = searchInput.value.toLowerCase();
  const filter = filterSelect.value;

  productGrid.innerHTML = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q);
      const matchFilter = filter === "all" ? true : p.stockType === filter;
      return matchSearch && matchFilter;
    })
    .map(p => {
      const designCount = (p.designs || []).length;
      return `
<div
  class="product-card glass ${p.featured ? "featured" : ""}"
  data-id="${p.id}"
>
  ${p.featured ? `<div class="featured-badge">⭐ FEATURED</div>` : ""}
  <img src="${p.images?.[0] || ""}" loading="lazy">
  <h4>
    ${p.name}
    ${designCount > 0 ? `<span class="designs-badge">🎨 ${designCount}</span>` : ""}
  </h4>
  <div class="product-meta">
    <span>₹${p.price}</span>
    <span class="badge ${p.stockType}">${p.stockType}</span>
  </div>
  <div class="banner-controls">
    <button
      class="btn ${p.featured ? "btn-featured" : "btn-ghost"} feature-btn"
      data-id="${p.id}"
    >
      ${p.featured ? "⭐ Featured" : "☆ Set Featured"}
    </button>
    ${p.featured ? `
    <div class="banner-order">
      <span>Order</span>
      <input
        type="number"
        min="1"
        value="${p.bannerOrder || 1}"
        class="order-input"
        data-id="${p.id}"
      />
    </div>` : ""}
  </div>
</div>`;
    }).join("");
};

/* ================= FEATURE TOGGLE ================= */

const toggleFeatured = async (id) => {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const nextState = !product.featured;
  await updateDoc(doc(db, "products", id), {
    featured:    nextState,
    bannerOrder: nextState ? (product.bannerOrder || 1) : 999
  });

  toast(nextState ? "Marked Featured" : "Removed Featured");
};

/* ================= ORDER ================= */

const updateBannerOrder = async (id, value) => {
  const order = Number(value || 1);
  await updateDoc(doc(db, "products", id), { bannerOrder: order });
  toast("Banner Order Updated");
};

/* ================= DESIGNS EDIT FIELDS ================= */

const buildDesignFields = (existingDesigns = []) => {
  const fields = [];
  for (let i = 1; i <= 5; i++) {
    const val = existingDesigns[i - 1] || "";
    fields.push(`
    <label>
      Design ${i} Image URL
      <input name="design${i}" placeholder="https://..." value="${val.replace(/"/g, "&quot;")}">
    </label>`);
  }
  return fields.join("");
};

/* ================= MODAL ================= */

const openEditor = (p) => {
  if (!p) return;

  editForm.innerHTML = `
  <div class="grid2">
    <label>
      Name
      <input name="name" value="${p.name}" required>
    </label>
    <label>
      Price
      <input name="price" type="number" value="${p.price}" required>
    </label>
  </div>

  <label>
    Discount
    <input name="discount" type="number" value="${p.discount || 0}">
  </label>

  <label>
    Stock Type
    <select name="stockType">
      <option value="available" ${p.stockType === "available" ? "selected" : ""}>Available</option>
      <option value="few"       ${p.stockType === "few"       ? "selected" : ""}>Few</option>
      <option value="out"       ${p.stockType === "out"       ? "selected" : ""}>Out</option>
    </select>
  </label>

  <label>
    Description
    <input name="description" value="${p.description}" required>
  </label>

  <label>
    Full Description
    <textarea name="fullDescription">${p.fullDescription || ""}</textarea>
  </label>

  <label>
    Highlights
    <input name="highlights" value="${(p.highlights || []).join(", ")}">
  </label>

  <label>
    Images
    <textarea name="images">${(p.images || []).join("\n")}</textarea>
  </label>

  <label class="checkbox-row">
    <input type="checkbox" name="isNew" ${p.isNew ? "checked" : ""}>
    Mark as NEW
  </label>

  <!-- DESIGNS SECTION IN EDIT -->
  <div class="designs-section">
    <div class="designs-header">
      <span class="designs-icon">🎨</span>
      <div>
        <p class="designs-title">Product Designs</p>
        <p class="designs-sub">Optional — Add multiple design variants</p>
      </div>
    </div>
    <div class="designs-fields">
      ${buildDesignFields(p.designs || [])}
    </div>
  </div>

  <div class="edit-actions">
    <button class="btn btn-primary">Save</button>
    <button id="delBtn" type="button" class="btn btn-danger">Delete</button>
  </div>`;

  editModal.classList.remove("hidden");

  editForm.onsubmit = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "products", p.id), {
      ...format(editForm),
      featured:    p.featured    || false,
      bannerOrder: p.bannerOrder || 999
    });
    toast("Updated");
    editModal.classList.add("hidden");
  };

  document.getElementById("delBtn").onclick = async () => {
    if (!confirm("Delete product?")) return;
    await deleteDoc(doc(db, "products", p.id));
    toast("Deleted");
    editModal.classList.add("hidden");
  };
};

closeModalBtn.onclick = () => editModal.classList.add("hidden");

closeShareModalBtn.onclick = () => shareModal.classList.add("hidden");

/* ================= COPY ================= */

copyProductBtn.onclick = async () => {
  if (!latestShareData) return;
  await navigator.clipboard.writeText(latestShareData.productLink);
  toast("Product Link Copied");
};

/* ================= SHARE AGAIN ================= */

shareAgainBtn.onclick = async () => await openWhatsappShare();

/* ================= OPEN WA ================= */

openWhatsappBtn.onclick = async () => await openWhatsappShare();

/* ================= ADD PRODUCT ================= */

productForm.onsubmit = async (e) => {
  e.preventDefault();
  try {
    saveBtn.textContent = "Preparing Share";
    saveBtn.classList.add("loading-btn");

    const productData = format(productForm);
    const docRef      = await addDoc(productsRef, productData);

    toast("Added");
    productForm.reset();

    /* TELEGRAM */
    await sendTelegramPost(docRef.id, productData);

    /* WHATSAPP */
    const shareData = createWhatsappMessage(docRef.id, productData);
    previewShare(shareData);
    await openWhatsappShare();

  } catch (err) {
    console.error(err);
    toast("Failed To Add Product", true);
  } finally {
    saveBtn.textContent = "Save Product";
    saveBtn.classList.remove("loading-btn");
  }
};

/* ================= GRID EVENTS ================= */

productGrid.onclick = async (e) => {
  const featureBtn = e.target.closest(".feature-btn");
  if (featureBtn) {
    e.stopPropagation();
    await toggleFeatured(featureBtn.dataset.id);
    return;
  }

  const card = e.target.closest(".product-card");
  if (!card) return;

  openEditor(products.find(x => x.id === card.dataset.id));
};

productGrid.addEventListener("input", async (e) => {
  if (e.target.classList.contains("order-input")) {
    await updateBannerOrder(e.target.dataset.id, e.target.value);
  }
});

searchInput.oninput  = renderProducts;
filterSelect.onchange = renderProducts;

/* ================= FIRESTORE ================= */

onSnapshot(productsRef, (snap) => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderStats();
  renderProducts();
  renderFeaturedProducts();
});

/* ================= AUTH ================= */

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(
      auth,
      adminId.value.trim(),
      adminPass.value.trim()
    );
    toast("Login Success");
  } catch (err) {
    console.error(err);
    toast("Wrong Email Or Password", true);
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
  toast("Logged Out");
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    authView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
  } else {
    authView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
  }
});