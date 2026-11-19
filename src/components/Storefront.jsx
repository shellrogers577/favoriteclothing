import { useEffect, useMemo, useState } from "react";
import { formatNaira, whatsappLink } from "../utils.js";

const filters = ["All", "Tees", "Clothing", "Trousers"];
const faqs = [
  [
    "How do I place an order?",
    "Add your favourite pieces to cart, choose a size, then check out through WhatsApp. We’ll confirm your order and delivery details with you.",
  ],
  [
    "Do you deliver across Nigeria?",
    "Yes. We deliver nationwide. Delivery timing and fees are confirmed when we follow up on your WhatsApp order.",
  ],
  [
    "Can I exchange an item?",
    "If your item is unworn and still in its original condition, contact us within 7 days of delivery and we’ll help with an exchange.",
  ],
  [
    "How do I choose my size?",
    "Choose your usual size for a relaxed everyday fit. Message us on WhatsApp if you’d like help with a specific piece.",
  ],
];

function ProductImageViewer({ product, side, onSideChange, onClose }) {
  const hasBackImage = Boolean(product.back_image)
  const showingBack = side === "back" && hasBackImage;

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="product-viewer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="product-viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-viewer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="product-viewer-heading">
          <div>
            <span className="eyebrow">PRODUCT DETAILS</span>
            <h2 id="product-viewer-title">{product.name}</h2>
          </div>
          <button
            type="button"
            className="icon-close"
            onClick={onClose}
            aria-label="Close product image"
          >
            ×
          </button>
        </div>
        <img
          className="product-viewer-image"
          src={showingBack ? product.back_image : product.image}
          alt={`${product.name} ${showingBack ? "back" : "front"} view`}
        />
        <div className="product-view-controls product-viewer-controls" role="group" aria-label="Product image side">
          <button
            type="button"
            className={!showingBack ? "view-selected" : ""}
            aria-pressed={!showingBack}
            onClick={() => onSideChange("front")}
          >
            FRONT
          </button>
          <button
            type="button"
            className={showingBack ? "view-selected" : ""}
            aria-pressed={showingBack}
            disabled={!hasBackImage}
            onClick={() => onSideChange("back")}
          >
            BACK
          </button>
          {!hasBackImage && <small>The back photo is not available yet.</small>}
        </div>
      </section>
    </div>
  );
}

function matchesCategory(product, filter) {
  if (filter === "All") return true;
  if (filter === "Tees") return product.category === "Tees";
  if (filter === "Trousers") return product.category === "Track Pants";
  return ["Caps & Beanies", "Tanks", "Accessories"].includes(product.category);
}

function ProductCard({ product, onAdd, onQuickOrder, onView }) {
  const [size, setSize] = useState(product.sizes?.[0] || "M");
  const [side, setSide] = useState("front");
  const isSoldOut = product.stock === 0;
  const showingBack = side === "back" && Boolean(product.back_image);
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <button
          type="button"
          className="product-image-trigger"
          onClick={() => onView(product, showingBack ? "back" : "front")}
          aria-label={`View ${product.name} ${showingBack ? "back" : "front"} image larger`}
        >
          <img
            src={showingBack ? product.back_image : product.image}
            alt={`${product.name} ${showingBack ? "back" : "front"} view`}
            className="product-image"
            loading="lazy"
          />
        </button>
        {product.badge === "New Arrival" && (
          <span className="product-badge">NEW</span>
        )}
        {isSoldOut && <span className="sold-overlay">SOLD OUT</span>}
        <button
          className="quick-order"
          type="button"
          onClick={() => onQuickOrder(product, size)}
          aria-label={`Order ${product.name} via WhatsApp`}
        >
          ↗
        </button>
      </div>
      <div className="product-view-controls" role="group" aria-label={`${product.name} image side`}>
        <button
          type="button"
          className={!showingBack ? "view-selected" : ""}
          aria-pressed={!showingBack}
          onClick={() => setSide("front")}
        >
          FRONT
        </button>
        <button
          type="button"
          className={showingBack ? "view-selected" : ""}
          aria-pressed={showingBack}
          disabled={!product.back_image}
          title={!product.back_image ? "Back photo not added yet" : undefined}
          onClick={() => setSide("back")}
        >
          BACK
        </button>
      </div>
      <div className="product-meta">
        <div className="product-title-line">
          <h3>{product.name}</h3>
          <span className="product-price">{formatNaira(product.price)}</span>
        </div>
        <div className="size-row" aria-label="Choose a size">
          {(product.sizes?.length ? product.sizes : ["S", "M", "L", "XL"]).map(
            (option) => (
              <button
                type="button"
                key={option}
                className={`size-pill ${size === option ? "selected" : ""}`}
                onClick={() => setSize(option)}
              >
                {option}
              </button>
            ),
          )}
        </div>
        <div className="product-actions">
          <button
            type="button"
            className="button button-dark add-button"
            disabled={isSoldOut}
            onClick={() => onAdd(product, size)}
          >
            {isSoldOut ? "SOLD OUT" : "ADD TO CART"}
          </button>
          <button
            type="button"
            className="whatsapp-order"
            onClick={() => onQuickOrder(product, size)}
          >
            WHATSAPP ↗
          </button>
        </div>
      </div>
    </article>
  );
}

function Header({ cartCount, onAdmin, onCart, isStoreAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div className="announcement">
        EXCLUSIVE DROPS &amp; EARLY ACCESS <span>✦</span> MADE WITH PURPOSE
      </div>
      <header className="site-header">
        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <span>{menuOpen ? "×" : "☰"}</span>
        </button>
        <a
          className="wordmark"
          href="#home"
          aria-label="Favorite Clothing home"
        >
          FAVORITE<span>®</span>
          <small>CLOTHING</small>
        </a>
        <nav
          className={`main-nav ${menuOpen ? "nav-open" : ""}`}
          aria-label="Main navigation"
        >
          {[
            ["Home", "#home"],
            ["Shop", "#shop"],
            ["FAQ", "#faq"],
            ["Checkout", "#shop"],
          ].map(([item, href]) => (
              <a
                key={item}
                href={href}
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          <button
            type="button"
            className="mobile-admin-link"
            onClick={() => {
              setMenuOpen(false);
              onAdmin();
            }}
          >
            {isStoreAdmin ? "Admin Studio" : "Admin Login"}
          </button>
        </nav>
        <div className="header-tools">
          <button
            className="cart-button"
            type="button"
            onClick={onCart}
            aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6" />
              <circle cx="10" cy="21" r="1" />
              <circle cx="18" cy="21" r="1" />
            </svg>
            <i>{cartCount}</i>
          </button>
          <button type="button" className="admin-login" onClick={onAdmin}>
            {isStoreAdmin ? "ADMIN STUDIO" : "ADMIN LOGIN"}
          </button>
        </div>
      </header>
    </>
  );
}

function CartDrawer({ open, onClose, products, cart, onQuantity, onRemove }) {
  const lines = cart
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.id),
    }))
    .filter((item) => item.product);
  const subtotal = lines.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  function checkout() {
    const summary = lines
      .map(
        (item) =>
          `${item.quantity} × ${item.product.name} (Size ${item.size}) — ${formatNaira(item.product.price * item.quantity)}`,
      )
      .join("\n");
    window.open(
      whatsappLink(
        `Hello Favorite Clothing, I’d like to place this order:\n\n${summary}\n\nSubtotal: ${formatNaira(subtotal)}\n\nPlease confirm delivery details.`,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  }
  return (
    <>
      {open && (
        <button
          className="drawer-scrim"
          onClick={onClose}
          aria-label="Close cart"
        />
      )}
      <aside
        className={`cart-drawer ${open ? "drawer-open" : ""}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">YOUR SELECTION</span>
            <h2>
              Shopping cart{" "}
              <span>
                ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </span>
            </h2>
          </div>
          <button
            type="button"
            className="icon-close"
            onClick={onClose}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>
        <div className="cart-lines">
          {!lines.length && (
            <div className="empty-cart">
              <span>◯</span>
              <h3>Your cart is waiting</h3>
              <p>Find something that feels like you.</p>
              <button className="button button-dark" onClick={onClose}>
                EXPLORE THE DROP
              </button>
            </div>
          )}
          {lines.map((item) => (
            <div className="cart-line" key={`${item.id}-${item.size}`}>
              <img src={item.product.image} alt="" />
              <div className="cart-line-info">
                <h3>{item.product.name}</h3>
                <p>Size: {item.size}</p>
                <strong>{formatNaira(item.product.price)}</strong>
                <div className="quantity-control">
                  <button
                    type="button"
                    onClick={() => onQuantity(item.id, item.size, -1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    disabled={item.quantity >= item.product.stock}
                    onClick={() => onQuantity(item.id, item.size, 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="remove-line"
                onClick={() => onRemove(item.id, item.size)}
                aria-label={`Remove ${item.product.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {!!lines.length && (
          <div className="cart-checkout">
            <div className="subtotal">
              <span>Subtotal</span>
              <strong>{formatNaira(subtotal)}</strong>
            </div>
            <p>Shipping is calculated and confirmed via WhatsApp.</p>
            <button
              type="button"
              className="button button-dark checkout-button"
              onClick={checkout}
            >
              CHECKOUT VIA WHATSAPP <span>↗</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  function subscribe(event) {
    event.preventDefault();
    setSubscribed(true);
  }
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <a className="wordmark footer-mark" href="#home">
            FAVORITE<span>®</span>
            <small>CLOTHING</small>
          </a>
          <p>
            Faith-inspired fashion for everyday wear. Shop curated collections
            made with care and purpose.
          </p>
          <div className="social-links">
            <a
              href="https://www.tiktok.com/@amaka.e2"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok profile @amaka.e2"
            >
              TK ↗
            </a>
          </div>
        </div>
        <div className="footer-column">
          <h3>SHOP</h3>
          <a href="#shop">All Products</a>
          <a href="#shop">Best Sellers</a>
        </div>
        <div className="footer-column">
          <h3>COMPANY</h3>
          <a href="#about">About Us</a>
          <a href="#faq">FAQs</a>
          <a href="#faq">Returns &amp; Refunds</a>
        </div>
        <div className="footer-column">
          <h3>POLICIES</h3>
          <a href="#policies">Terms</a>
          <a href="#policies">Privacy</a>
          <a href="#policies">Returns</a>
        </div>
        <div className="footer-column footer-contact">
          <h3>GET IN TOUCH</h3>
          <a href="mailto:hello@favoriteclothing.ng">
            hello@favoriteclothing.ng
          </a>
          <a href="tel:+2347050881599">+234 705 088 1599</a>
        </div>
        <form className="newsletter" onSubmit={subscribe}>
          <label htmlFor="newsletter-email">STAY IN TOUCH</label>
          <p>Sign up for exclusive offers and new drops.</p>
          <div>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Your email address"
              required
            />
            <button type="submit">
              {subscribed ? "THANK YOU ✓" : "SUBSCRIBE ↗"}
            </button>
          </div>
        </form>
      </div>
      <div className="footer-bottom">
        <span>© 2026 [only_1victor]. All rights reserved.</span>
        <span>
          Developed by Victor |{" "}
          <a
            href="https://wa.me/2347016402733"
            target="_blank"
            rel="noreferrer"
          >
            +2347016402733
          </a>
        </span>
      </div>
    </footer>
  );
}

export default function Storefront({
  products,
  cart,
  cartCount,
  onAdd,
  onQuantity,
  onRemove,
  onAdmin,
  isStoreAdmin,
  catalogLoading,
  statusMessage,
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [toast, setToast] = useState("");
  const [viewingProduct, setViewingProduct] = useState(null);
  const [viewerSide, setViewerSide] = useState("front");

  const displayedProducts = useMemo(
    () =>
      products
        .filter((product) => matchesCategory(product, activeFilter))
        .slice(0, visibleCount),
    [products, activeFilter, visibleCount],
  );

  function add(product, size) {
    onAdd(product, size);
    setToast(`${product.name} added to your cart`);
    window.setTimeout(() => setToast(""), 2600);
  }
  function quickOrder(product, size) {
    window.open(
      whatsappLink(
        `Hello Favorite Clothing, I’m interested in ${product.name} (Size ${size}) — ${formatNaira(product.price)}. Is it available?`,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  }
  function viewProductImage(product, side) {
    setViewingProduct(product);
    setViewerSide(side);
  }

  return (
    <>
      <Header
        cartCount={cartCount}
        onAdmin={onAdmin}
        onCart={() => setCartOpen(true)}
        isStoreAdmin={isStoreAdmin}
      />
      {statusMessage && (
        <div className="store-status" role="alert">
          {statusMessage}
        </div>
      )}
      <main>
        <section className="hero-section" id="home">
          <img
            className="hero-photo"
            src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=2200&q=90"
            alt="Streetwear editorial featuring modern everyday style"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <span className="hero-kicker">
              <i /> NEW COLLECTION — 2026
            </span>
            <h1>
              WALK IN
              <br />
              <em>YOUR</em> PURPOSE.
            </h1>
            <p>
              Faith in every thread. Made for wherever your journey takes you.
            </p>
            <a className="button button-light" href="#shop">
              SHOP THE DROP <span>↗</span>
            </a>
          </div>
          <div className="hero-bottom">
            <span>01 — EVERYDAY, WITH INTENTION</span>
            <span>LAGOS, NIGERIA · WORLDWIDE SHIPPING</span>
          </div>
          <div className="hero-side-note">
            BUILT ON BELIEF · WORN WITH PURPOSE
          </div>
        </section>

        <section className="shop-section section-pad" id="shop">
          <div className="section-heading shop-heading">
            <div>
              <span className="eyebrow">CURATED FOR YOUR JOURNEY</span>
              <h2>
                THE LATEST DROP
                <span className="drop-count">
                  {products.length.toString().padStart(2, "0")}
                </span>
              </h2>
            </div>
            <p>Good things, made to be lived in.</p>
          </div>
          <div
            className="filter-row"
            role="tablist"
            aria-label="Filter products"
          >
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter}
                className={activeFilter === filter ? "filter-active" : ""}
                onClick={() => {
                  setActiveFilter(filter);
                  setVisibleCount(8);
                }}
              >
                {filter}
                <span>·</span>
              </button>
            ))}
          </div>
          {catalogLoading ? (
            <div className="no-results">Loading the latest pieces…</div>
          ) : displayedProducts.length ? (
            <div className="product-grid">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={add}
                  onQuickOrder={quickOrder}
                  onView={viewProductImage}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              No pieces found in this category.
            </div>
          )}
          {products.filter(
            (product) => matchesCategory(product, activeFilter),
          ).length > visibleCount && (
            <button
              className="button button-outline see-more"
              onClick={() => setVisibleCount((count) => count + 8)}
            >
              SEE MORE PRODUCTS <span>↓</span>
            </button>
          )}
        </section>

        <section className="manifesto" id="about">
          <span className="eyebrow">NOT JUST WHAT YOU WEAR</span>
          <h2>
            WEAR WHAT
            <br />
            <em>YOU BELIEVE.</em>
          </h2>
          <p>
            Created for the ones building with faith, moving with intention, and
            choosing their own direction.
          </p>
          <a href="#shop">DISCOVER YOUR PIECE ↗</a>
          <svg
            className="manifesto-cross"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <path d="M47 0h6l3 38 25-27 4 4-27 25 38 3v6l-38 3 27 25-4 4-25-27-3 38h-6l-3-38-25 27-4-4 27-25-38-3v-6l38-3L15 15l4-4 25 27z" />
          </svg>
        </section>

        <section className="faq-section section-pad" id="faq">
          <div className="faq-intro">
            <span className="eyebrow">NEED A HAND?</span>
            <h2>
              GOOD TO
              <br />
              KNOW.
            </h2>
            <p>Everything you need to make your next favourite easy.</p>
            <a
              href="https://wa.me/2347050881599"
              target="_blank"
              rel="noreferrer"
            >
              ASK US ON WHATSAPP ↗
            </a>
          </div>
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <details key={question} className="faq-item">
                <summary>
                  <span>0{index + 1}</span>
                  <strong>{question}</strong>
                  <i>+</i>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <a
        className="floating-whatsapp"
        href="https://wa.me/2347050881599"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <span>◉</span>
        <small>CHAT WITH US</small>
      </a>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        products={products}
        cart={cart}
        onQuantity={onQuantity}
        onRemove={onRemove}
      />
      {viewingProduct && (
        <ProductImageViewer
          product={viewingProduct}
          side={viewerSide}
          onSideChange={setViewerSide}
          onClose={() => setViewingProduct(null)}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button type="button" onClick={() => setCartOpen(true)}>
            VIEW CART ↗
          </button>
        </div>
      )}
    </>
  );
}
