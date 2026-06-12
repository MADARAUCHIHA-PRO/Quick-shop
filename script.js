import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   FIREBASE
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyAQhBWcHqBXCOCF_RhFhDyCnthy3t8luZM",
  authDomain: "quick-shop-63627.firebaseapp.com",
  projectId: "quick-shop-63627",
  storageBucket: "quick-shop-63627.firebasestorage.app",
  messagingSenderId: "461073578456",
  appId: "1:461073578456:web:db6548f79b4a0af82c1aad"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   PREMIUM SHOP
========================= */

class PremiumShop {

  constructor() {

    this.products = [];
    this.filteredProducts = [];
    this.featuredProducts = [];

    this.currentFilter = "all";
    this.searchTerm = "";

    this.currentSlide = 0;
    this.sliderInterval = null;
    this.searchRaf = null;

    /* ELEMENTS */

    this.gridEl =
      document.getElementById("productsGrid");

    this.emptyStateEl =
      document.getElementById("emptyState");

    this.sliderTrack =
      document.getElementById("sliderTrack");

    this.sliderDots =
      document.getElementById("sliderDots");

    this.featuredSlider =
      document.getElementById("featuredSlider");

    this.defaultHero =
      document.getElementById("defaultHero");

    this.prevSlideBtn =
      document.getElementById("prevSlideBtn");

    this.nextSlideBtn =
      document.getElementById("nextSlideBtn");

    this.themeBtn =
      document.getElementById("themeToggleBtn");

    this.themePanel =
      document.getElementById("themePanel");

    /* STORAGE */

    this.themeKey = "quickshop_theme";
    this.customThemeKey = "quickshop_custom_theme";

    this.customTheme = "";

    this.wishlistKey = "quickshop_wishlist";

    this.wishlist = this.getWishlist();

    this.init();
  }

  /* =========================
     INIT
  ========================= */

  async init() {

    this.applySavedTheme();

    this.applySavedCustomTheme();

    this.bindEvents();

    this.updateWishlistCount();

    await this.loadProducts();

    this.renderHeroSlider();

    this.applyFilters();
  }

  /* =========================
     WISHLIST
  ========================= */

  getWishlist() {

    try {

      const data = JSON.parse(
        localStorage.getItem(this.wishlistKey)
      );

      return Array.isArray(data)
        ? data
        : [];

    } catch {

      return [];
    }
  }

  saveWishlist() {

    localStorage.setItem(
      this.wishlistKey,
      JSON.stringify(this.wishlist)
    );
  }

  updateWishlistCount() {

    document.getElementById(
      "wishlistCount"
    ).textContent = this.wishlist.length;
  }

  toggleWishlist(productId) {

    const exists =
      this.wishlist.includes(productId);

    if (exists) {

      this.wishlist =
        this.wishlist.filter(
          id => id !== productId
        );

    } else {

      this.wishlist.push(productId);
    }

    this.saveWishlist();

    this.updateWishlistCount();

    const btn =
      document.querySelector(
        `.wishlist-btn[data-id="${productId}"]`
      );

    if (btn) {

      btn.classList.toggle("active");

      btn.innerHTML = exists
        ? '<i class="far fa-heart"></i>'
        : '<i class="fas fa-heart"></i>';
    }

    if (this.currentFilter === "wishlist") {

      this.applyFilters();
    }
  }

  /* =========================
     THEMES
  ========================= */

  applySavedTheme() {

    const savedTheme =
      localStorage.getItem(this.themeKey);

    if (savedTheme === "light") {

      document.body.classList.add("light-theme");

      this.themeBtn.innerHTML =
        '<i class="fas fa-sun"></i>';

    } else {

      document.body.classList.remove("light-theme");

      this.themeBtn.innerHTML =
        '<i class="fas fa-moon"></i>';
    }
  }

  applySavedCustomTheme() {

    const saved =
      localStorage.getItem(this.customThemeKey);

    if (
      ["theme-purple", "theme-amoled", "theme-glass"]
      .includes(saved)
    ) {

      this.setCustomTheme(saved);
    }
  }

  clearCustomTheme() {

    document.body.classList.remove(
      "custom-theme",
      "theme-purple",
      "theme-amoled",
      "theme-glass"
    );

    this.customTheme = "";

    localStorage.removeItem(
      this.customThemeKey
    );

    this.syncThemeCardState();
  }

  setCustomTheme(themeName) {

    document.body.classList.remove(
      "theme-purple",
      "theme-amoled",
      "theme-glass",
      "light-theme"
    );

    document.body.classList.add(
      "custom-theme",
      themeName
    );

    this.customTheme = themeName;

    localStorage.setItem(
      this.customThemeKey,
      themeName
    );

    this.themeBtn.innerHTML =
      '<i class="fas fa-layer-group"></i>';

    this.syncThemeCardState();
  }

  syncThemeCardState() {

    document
      .querySelectorAll(".theme-card")
      .forEach((card) => {

        card.classList.toggle(
          "active",
          card.dataset.theme === this.customTheme
        );
      });
  }

  toggleTheme() {

    if (this.customTheme) {

      this.clearCustomTheme();

      this.applySavedTheme();

      return;
    }

    const isLight =
      document.body.classList.toggle(
        "light-theme"
      );

    localStorage.setItem(
      this.themeKey,
      isLight ? "light" : "dark"
    );

    this.themeBtn.innerHTML = isLight
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  }

  /* =========================
     EVENTS
  ========================= */

  bindEvents() {

    /* THEME */

    this.themeBtn.onclick = () => {

      this.toggleTheme();
    };

    /* SUPPORT */

    document.getElementById(
      "supportBtn"
    ).onclick = () => {

      window.open(
        "https://wa.me/9773786804",
        "_blank"
      );
    };

    /* MENU */

    const menuBtn =
      document.getElementById("menuBtn");

    const menu =
      document.getElementById("quickMenu");

    const overlay =
      document.getElementById("menuOverlay");

    const openMenu = () => {

      overlay.hidden = false;

      menu.classList.add("open");

      overlay.classList.add("open");

      menuBtn.setAttribute(
        "aria-expanded",
        "true"
      );
    };

    const closeMenu = () => {

      menu.classList.remove("open");

      overlay.classList.remove("open");

      overlay.hidden = true;

      menuBtn.setAttribute(
        "aria-expanded",
        "false"
      );
    };

    menuBtn.onclick = () => {

      menu.classList.contains("open")
        ? closeMenu()
        : openMenu();
    };

    overlay.onclick = () => {

      closeMenu();

      closeThemePanel();
    };

    /* THEME PANEL */

    const themesBtn =
      document.getElementById("themesBtn");

    const themeCloseBtn =
      document.getElementById("themePanelClose");

    const openThemePanel = () => {

      this.themePanel.hidden = false;

      requestAnimationFrame(() => {

        this.themePanel.classList.add("open");
      });

      this.themePanel.setAttribute(
        "aria-hidden",
        "false"
      );

      this.syncThemeCardState();
    };

    const closeThemePanel = () => {

      this.themePanel.classList.remove("open");

      this.themePanel.setAttribute(
        "aria-hidden",
        "true"
      );

      setTimeout(() => {

        if (
          !this.themePanel.classList.contains("open")
        ) {

          this.themePanel.hidden = true;
        }

      }, 260);
    };

    themesBtn.onclick = openThemePanel;

    themeCloseBtn.onclick = closeThemePanel;

    this.themePanel.addEventListener(
      "click",
      (e) => {

        const card =
          e.target.closest(".theme-card");

        if (!card) return;

        this.setCustomTheme(
          card.dataset.theme
        );
      }
    );

    /* FILTERS */

    document
      .querySelectorAll(".filter-tab")
      .forEach(btn => {

        btn.onclick = () => {

          document
            .querySelectorAll(".filter-tab")
            .forEach(b => {

              b.classList.remove("active");
            });

          btn.classList.add("active");

          this.currentFilter =
            btn.dataset.filter;

          this.applyFilters();
        };
      });

    /* SEARCH */

    document.getElementById(
      "searchInput"
    ).oninput = (e) => {

      this.searchTerm =
        e.target.value
        .toLowerCase()
        .trim();

      cancelAnimationFrame(
        this.searchRaf
      );

      this.searchRaf =
        requestAnimationFrame(() => {

          this.applyFilters();
        });
    };

    /* CLEAR */

    document.getElementById(
      "clearFilters"
    ).onclick = () => {

      this.searchTerm = "";

      document.getElementById(
        "searchInput"
      ).value = "";

      this.currentFilter = "all";

      document
        .querySelectorAll(".filter-tab")
        .forEach(btn => {

          btn.classList.toggle(
            "active",
            btn.dataset.filter === "all"
          );
        });

      this.applyFilters();
    };

    /* PRODUCT CLICK */

    this.gridEl.addEventListener(
      "click",
      (e) => {

        const wishlistBtn =
          e.target.closest(".wishlist-btn");

        if (wishlistBtn) {

          e.stopPropagation();

          this.toggleWishlist(
            wishlistBtn.dataset.id
          );

          return;
        }

        const card =
          e.target.closest(".product-card");

        if (!card) return;

        window.location.href =
          `product.html?id=${card.dataset.id}`;
      }
    );

    /* SLIDER */

    this.prevSlideBtn?.addEventListener(
      "click",
      () => this.prevSlide()
    );

    this.nextSlideBtn?.addEventListener(
      "click",
      () => this.nextSlide()
    );

    /* TOUCH */

    let startX = 0;

    this.featuredSlider?.addEventListener(
      "touchstart",
      (e) => {

        startX = e.touches[0].clientX;
      }
    );

    this.featuredSlider?.addEventListener(
      "touchend",
      (e) => {

        const endX =
          e.changedTouches[0].clientX;

        if (startX - endX > 50) {

          this.nextSlide();
        }

        if (endX - startX > 50) {

          this.prevSlide();
        }
      }
    );
  }

  /* =========================
     FIREBASE PRODUCTS
  ========================= */

  async loadProducts() {

    try {

      const snap = await getDocs(
        query(
          collection(db, "products"),
          limit(300)
        )
      );

      this.products = snap.docs.map(doc => {

        const data = doc.data();

        return {

          id:
            data.productId || doc.id,

          name:
            data.name || "Unnamed Product",

          price:
            Number(data.price) || 0,

          discount:
            Number(data.discount) || 0,

          stockType:
            data.stockType ||
            data.stock ||
            "out",

          description:
            data.description || "",

          images:
            Array.isArray(data.images)
              ? data.images
              : [],

          isNew:
            data.isNew === true,

          featured:
            data.featured === true,

          bannerOrder:
            Number(data.bannerOrder) || 999
        };
      });

      this.featuredProducts =
        this.products
        .filter(p => p.featured)
        .sort(
          (a, b) =>
            a.bannerOrder - b.bannerOrder
        );

      console.log(this.products);

    } catch (err) {

      console.error(err);

      this.gridEl.innerHTML = `
        <div style="
          padding:2rem;
          text-align:center;
        ">
          Failed To Load Products
        </div>
      `;
    }
  }

  /* =========================
     HERO SLIDER
  ========================= */

  renderHeroSlider() {

    if (!this.featuredProducts.length) {

      this.defaultHero.classList.remove(
        "hidden"
      );

      this.featuredSlider.classList.add(
        "hidden"
      );

      return;
    }

    this.defaultHero.classList.add(
      "hidden"
    );

    this.featuredSlider.classList.remove(
      "hidden"
    );

    const slidesHTML =
      this.featuredProducts.map((p, index) => {

        const finalPrice =
          Math.round(
            p.price * (1 - p.discount / 100)
          );

        const image =
          p.images[0] ||
          "https://placehold.co/600x600";

        return `
        <div class="hero-slide ${index === 0 ? "active" : ""}">

          <div class="hero-slide-content">

            <span class="hero-slide-badge">
              ⭐ Featured Product
            </span>

            <h2 class="hero-slide-title">
              ${p.name}
            </h2>

            <p class="hero-slide-desc">
              ${p.description}
            </p>

            <div class="hero-price-row">

              <span class="hero-final-price">
                ₹${finalPrice}
              </span>

              ${
                p.discount > 0
                ? `
                <span class="hero-old-price">
                  ₹${p.price}
                </span>
                `
                : ""
              }

              ${
                p.discount > 0
                ? `
                <span class="hero-discount">
                  -${p.discount}% OFF
                </span>
                `
                : ""
              }

            </div>

            <div class="hero-buttons">

              <button
                class="hero-btn hero-btn-primary"
                onclick="window.location.href='product.html?id=${p.id}'"
              >
                Buy Now
              </button>

              <button
                class="hero-btn hero-btn-secondary"
                onclick="window.location.href='product.html?id=${p.id}'"
              >
                View Product
              </button>

            </div>

          </div>

          <div class="hero-slide-image-wrap">

            <div class="hero-image-glow"></div>

            <img
              src="${image}"
              alt="${p.name}"
              class="hero-slide-image"
            >

          </div>

        </div>
        `;
      }).join("");

    this.sliderTrack.innerHTML =
      slidesHTML;

    this.sliderDots.innerHTML =
      this.featuredProducts.map((_, i) => `
        <button
          class="slider-dot ${i === 0 ? "active" : ""}"
          data-slide="${i}"
        ></button>
      `).join("");

    document
      .querySelectorAll(".slider-dot")
      .forEach(dot => {

        dot.onclick = () => {

          this.goToSlide(
            Number(dot.dataset.slide)
          );
        };
      });

    this.startSlider();
  }

  startSlider() {

    clearInterval(this.sliderInterval);

    this.sliderInterval =
      setInterval(() => {

        this.nextSlide();

      }, 5000);
  }

  goToSlide(index) {

    const slides =
      document.querySelectorAll(".hero-slide");

    const dots =
      document.querySelectorAll(".slider-dot");

    slides.forEach(slide => {

      slide.classList.remove("active");
    });

    dots.forEach(dot => {

      dot.classList.remove("active");
    });

    slides[index]?.classList.add("active");

    dots[index]?.classList.add("active");

    this.currentSlide = index;
  }

  nextSlide() {

    if (!this.featuredProducts.length) return;

    const next =
      (
        this.currentSlide + 1
      ) %
      this.featuredProducts.length;

    this.goToSlide(next);
  }

  prevSlide() {

    if (!this.featuredProducts.length) return;

    const prev =
      (
        this.currentSlide - 1 +
        this.featuredProducts.length
      ) %
      this.featuredProducts.length;

    this.goToSlide(prev);
  }

  /* =========================
     FILTERS
  ========================= */

  applyFilters() {

    this.filteredProducts =
      this.products.filter((p) => {

        const matchSearch =
          p.name
          .toLowerCase()
          .includes(this.searchTerm);

        let matchFilter = true;

        if (this.currentFilter === "new") {

          matchFilter = p.isNew;
        }

        if (this.currentFilter === "discount") {

          matchFilter = p.discount > 0;
        }

        if (this.currentFilter === "instock") {

          matchFilter =
            p.stockType !== "out";
        }

        if (this.currentFilter === "wishlist") {

          matchFilter =
            this.wishlist.includes(p.id);
        }

        return matchSearch && matchFilter;
      });

    this.renderProducts();
  }

  /* =========================
     RENDER PRODUCTS
  ========================= */

  renderProducts() {

    if (!this.filteredProducts.length) {

      this.gridEl.innerHTML = "";

      this.emptyStateEl.classList.remove(
        "hidden"
      );

      return;
    }

    this.emptyStateEl.classList.add(
      "hidden"
    );

    const stockMap = {
      available: "Available",
      few: "Few Left",
      out: "Out Of Stock"
    };

    this.gridEl.innerHTML =
      this.filteredProducts.map((p) => {

        const finalPrice =
          Math.round(
            p.price * (1 - p.discount / 100)
          );

        const image =
          p.images[0] ||
          "https://placehold.co/600x600";

        const stockKey =
          ["available", "few", "out"]
          .includes(p.stockType)
            ? p.stockType
            : "out";

        const isWishlisted =
          this.wishlist.includes(p.id);

        return `
        <article
          class="product-card"
          data-id="${p.id}"
          tabindex="0"
        >

          <div class="product-image-container">

            ${
              p.isNew
              ? `
              <span class="new-badge">
                NEW
              </span>
              `
              : ""
            }

            ${
              p.discount > 0
              ? `
              <span class="discount-badge">
                -${p.discount}%
              </span>
              `
              : ""
            }

            <button
              class="wishlist-btn ${isWishlisted ? "active" : ""}"
              data-id="${p.id}"
            >
              <i class="${isWishlisted ? "fas" : "far"} fa-heart"></i>
            </button>

            <img
              src="${image}"
              alt="${p.name}"
              class="product-image"
              loading="lazy"
            >

          </div>

          <div class="product-content">

            <h3 class="product-name">
              ${p.name}
            </h3>

            <div class="product-pricing">

              <span class="final-price">
                ₹${finalPrice}
              </span>

              ${
                p.discount > 0
                ? `
                <span class="original-price">
                  ₹${p.price}
                </span>
                `
                : ""
              }

            </div>

            <p class="product-description">
              ${p.description}
            </p>

            <p class="stock ${stockKey}">
              ${stockMap[stockKey]}
            </p>

          </div>

        </article>
        `;
      }).join("");
  }
}

new PremiumShop();