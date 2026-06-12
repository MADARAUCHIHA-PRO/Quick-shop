import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAQhBWcHqBXCOCF_RhFhDyCnthy3t8luZM",
  authDomain:        "quick-shop-63627.firebaseapp.com",
  projectId:         "quick-shop-63627",
  storageBucket:     "quick-shop-63627.firebasestorage.app",
  messagingSenderId: "461073578456",
  appId:             "1:461073578456:web:db6548f79b4a0af82c1aad"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const id = new URLSearchParams(location.search).get("id");

const $ = (elId) => document.getElementById(elId);

const WHATSAPP_NUMBER = "919773786804";
const WISHLIST_KEY    = "quickshop_wishlist";

let product = null;

/* ================= WHATSAPP ================= */

const openWhatsApp = (message = "") => {
  const url =
    `https://wa.me/${WHATSAPP_NUMBER}` +
    (message ? `?text=${encodeURIComponent(message)}` : "");
  window.open(url, "_blank");
};

/* ================= WISHLIST ================= */

const getWishlist = () => {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
};

const saveWishlist = (wishlist) => {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
};

const loadWishlistState = () => {
  const btn        = $("wishlistBtn");
  const isWishlisted = getWishlist().includes(id);
  btn.classList.toggle("active", isWishlisted);
  btn.innerHTML = isWishlisted
    ? '<i class="fa-solid fa-heart"></i>'
    : '<i class="fa-regular fa-heart"></i>';
};

const toggleWishlist = () => {
  const wishlist = getWishlist();
  const exists   = wishlist.includes(id);
  saveWishlist(exists ? wishlist.filter(item => item !== id) : [...wishlist, id]);
  loadWishlistState();
};

/* ================= DESIGNS ================= */

/**
 * Swap the main product image with a smooth fade transition.
 */
const swapMainImage = (src) => {
  const img = $("mainImage");
  img.classList.add("img-fade");

  setTimeout(() => {
    img.src = src;
    $("modalImage").src = src;
    img.classList.remove("img-fade");
  }, 180);
};

/**
 * Render the designs rail if the product has designs.
 * Hides the entire section when there are no designs.
 */
const renderDesigns = (designs = []) => {
  const section = $("designsSection");

  // Hide section if no designs
  if (!designs || designs.length === 0) {
    section.classList.add("hidden");
    return;
  }

  // Update header text & badge
  $("designsCountBadge").textContent = designs.length;

  const rail = $("designsRail");
  rail.innerHTML = designs
    .map(
      (src, index) => `
      <img
        src="${src}"
        loading="lazy"
        class="design-thumb${index === 0 ? " active" : ""}"
        data-index="${index}"
        data-src="${src}"
        alt="Design ${index + 1}"
      />`
    )
    .join("");

  // Click handler — switch main image
  rail.addEventListener("click", (e) => {
    const thumb = e.target.closest(".design-thumb");
    if (!thumb) return;

    // Update active state
    rail.querySelectorAll(".design-thumb").forEach(t => t.classList.remove("active"));
    thumb.classList.add("active");

    // Swap main image smoothly
    swapMainImage(thumb.dataset.src);
  });

  // Show section
  section.classList.remove("hidden");
};

/* ================= RENDER PRODUCT ================= */

const renderProduct = (data) => {
  product = data;

  const discount   = Number(data.discount || 0);
  const finalPrice = Math.round(data.price * (1 - discount / 100));

  // PRODUCT NAME & PRICES
  $("name").textContent        = data.name;
  $("finalPrice").textContent  = `₹${finalPrice}`;
  $("originalPrice").textContent = `₹${data.price}`;

  const discountBadge = $("discountBadge");
  if (discount > 0) {
    discountBadge.textContent    = `-${discount}%`;
    discountBadge.style.display  = "inline-block";
    $("originalPrice").style.display = "inline";
  } else {
    discountBadge.style.display      = "none";
    $("originalPrice").style.display = "none";
  }

  // STOCK
  let stockText = "Out of Stock";
  let color     = "#ff4d71";
  if (data.stockType === "available") { stockText = "Available";        color = "#29da8f"; }
  else if (data.stockType === "few")  { stockText = "Few Items Left";   color = "#f59e0b"; }

  const stockBadge = $("stockBadge");
  stockBadge.textContent           = stockText;
  stockBadge.style.border          = `1px solid ${color}`;
  stockBadge.style.background      = `${color}22`;

  // DESCRIPTIONS
  $("shortDescription").textContent = data.description    || "";
  $("fullDescription").textContent  = data.fullDescription || data.description || "";

  // READ MORE TOGGLE
  const toggleBtn = $("toggleDescription");
  const fullDesc  = $("fullDescription");
  toggleBtn.onclick = () => {
    fullDesc.classList.toggle("collapsed");
    toggleBtn.textContent = fullDesc.classList.contains("collapsed")
      ? "Read More"
      : "Show Less";
  };

  // IMAGES
  const images = data.images?.length ? data.images : ["https://placehold.co/600x600"];

  $("mainImage").src   = images[0];
  $("modalImage").src  = images[0];

  $("thumbnailRail").innerHTML = images
    .map(
      (img, index) => `
      <img
        src="${img}"
        class="thumb ${index === 0 ? "active" : ""}"
        loading="lazy"
      >`
    )
    .join("");

  document.querySelectorAll(".thumb").forEach((img) => {
    img.onclick = () => {
      swapMainImage(img.src);
      document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
      img.classList.add("active");
      // Deactivate all designs when a product image is selected
      document.querySelectorAll(".design-thumb").forEach(t => t.classList.remove("active"));
    };
  });

  // IMAGE MODAL
  $("mainImage").onclick = () => {
    $("imageModal").classList.remove("hidden");
    $("modalImage").src = $("mainImage").src;
  };
  $("closeModal").onclick = () => $("imageModal").classList.add("hidden");
  $("imageModal").onclick = (e) => {
    if (e.target.id === "imageModal") $("imageModal").classList.add("hidden");
  };

  // BUTTONS
  $("buyBtn").onclick = () =>
    openWhatsApp(`Hi, I want to buy ${data.name}`);

  $("negotiateBtn").onclick = () =>
    openWhatsApp(`Hi, I want to negotiate price for ${data.name}`);

  $("directBtn").onclick = () => openWhatsApp();

  $("backBtn").onclick = () => {
    window.location.href = "index.html";
  };

  // SHARE BUTTON
  $("shareBtn").onclick = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: data.name, text: data.description, url: location.href });
      } else {
        navigator.clipboard.writeText(location.href);
        alert("Product link copied!");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // WISHLIST
  $("wishlistBtn").onclick = (e) => {
    e.stopPropagation();
    toggleWishlist();
  };
  loadWishlistState();

  // HIGHLIGHTS
  const highlights = data.highlights || [];
  $("highlightsList").innerHTML = highlights.length
    ? highlights.map(item => `<li>${item}</li>`).join("")
    : `
      <li>Premium Quality</li>
      <li>Best Seller Product</li>
      <li>Trusted by Customers</li>
    `;

  // ============ DESIGNS ============
  renderDesigns(data.designs || []);
};

/* ================= INIT ================= */

const init = async () => {
  try {
    const snap = await getDocs(collection(db, "products"));

    let found = null;
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.productId == id || docSnap.id == id) {
        found = d;
      }
    });

    if (!found) throw "Not found";

    renderProduct(found);

    $("skeleton").classList.add("hidden");
    $("productSection").classList.remove("hidden");

  } catch (e) {
    console.log(e);
    $("skeleton").classList.add("hidden");
    $("errorState").classList.remove("hidden");
  }
};

init();