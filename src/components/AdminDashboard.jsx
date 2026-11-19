import { useMemo, useState } from "react";
import { formatNaira } from "../utils.js";

const categories = [
  "Tees",
  "Caps & Beanies",
  "Track Pants",
  "Tanks",
  "Accessories",
];
const sizesList = ["S", "M", "L", "XL"];
const maxImageSize = 10 * 1024 * 1024;
const supportedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const imageSides = [
  { key: "image", label: "FRONT" },
  { key: "back_image", label: "BACK" },
];
function getStock(product) {
  const stock = Number(product.stock);
  return Number.isFinite(stock) && stock > 0 ? stock : 0;
}

function getPrice(product) {
  const price = Number(product.price);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

const emptyProduct = {
  name: "",
  price: "",
  category: "Tees",
  badge: "Standard",
  sizes: ["S", "M", "L", "XL"],
  description: "",
  image: "",
  back_image: "",
  stock: 10,
};

function ProductForm({ editing, onSave, onCancel }) {
  const [form, setForm] = useState(
    editing
      ? {
          ...editing,
          price: String(editing.price),
          stock: String(editing.stock ?? 0),
          image: editing.image || "",
          back_image: editing.back_image || "",
        }
      : emptyProduct,
  );
  const [imageUrls, setImageUrls] = useState({
    image: editing?.image || "",
    back_image: editing?.back_image || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function toggleSize(size) {
    setForm((current) => ({
      ...current,
      sizes: current.sizes.includes(size)
        ? current.sizes.filter((item) => item !== size)
        : [...current.sizes, size],
    }));
  }
  function updateImageUrl(side, value) {
    setImageUrls((current) => ({ ...current, [side]: value }));
    change(side, value.trim());
  }
  function uploadImage(event, side) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!supportedImageTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, WEBP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > maxImageSize) {
      setError("Each product photo must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      change(side, result);
      setImageUrls((current) => ({ ...current, [side]: "" }));
      setError("");
    };
    reader.onerror = () =>
      setError("This image could not be read. Please try another file.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.sizes.length) {
      setError("Select at least one available size.");
      return;
    }
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Enter a whole number of available items (0 or more).");
      return;
    }
    if (!form.image.trim() || !form.back_image.trim()) {
      setError("Add both a front and a back product photo.");
      return;
    }
    setSaving(true);
    try {
      const saved = await onSave({
        ...form,
        name: form.name.trim().toUpperCase(),
        price: Number(form.price),
        badge:
          form.badge === "New Arrival"
            ? "New Arrival"
            : stock === 0
              ? "Sold Out"
              : "Standard",
        stock,
      });
      if (!saved)
        setError(
          "Could not save this product. Check the catalog connection and try again.",
        );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="form-section-title">
        <span>01</span>
        <div>
          <h3>Product details</h3>
          <p>Give this piece its place in the collection.</p>
        </div>
      </div>
      <label className="field-label">
        PRODUCT NAME
        <input
          value={form.name}
          onChange={(event) => change("name", event.target.value)}
          placeholder="e.g. BUILT ON FAITH TEE"
          required
          maxLength={70}
        />
      </label>
      <div className="form-two-col">
        <label className="field-label">
          PRICE (₦)
          <input
            type="number"
            value={form.price}
            onChange={(event) => change("price", event.target.value)}
            min="1"
            step="1"
            placeholder="28999"
            required
          />
        </label>
        <label className="field-label">
          CATEGORY
          <select
            value={form.category}
            onChange={(event) => change("category", event.target.value)}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-two-col">
        <label className="field-label">
          BADGE / STATUS
          <select
            value={form.badge}
            onChange={(event) => {
              change("badge", event.target.value);
              if (event.target.value === "Sold Out") change("stock", 0);
            }}
          >
            {["New Arrival", "Standard", "Sold Out"].map((badge) => (
              <option key={badge}>{badge}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          QUANTITY IN STOCK
          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(event) => change("stock", event.target.value)}
            required
          />
        </label>
      </div>
      <fieldset className="size-fieldset">
        <legend>AVAILABLE SIZES</legend>
        <div className="admin-size-options">
          {sizesList.map((size) => (
            <label
              key={size}
              className={form.sizes.includes(size) ? "admin-size-selected" : ""}
            >
              <input
                type="checkbox"
                checked={form.sizes.includes(size)}
                onChange={() => toggleSize(size)}
              />
              {size}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field-label">
        SHORT DESCRIPTION
        <textarea
          value={form.description}
          onChange={(event) => change("description", event.target.value)}
          placeholder="What makes this piece special?"
          rows="3"
          maxLength={180}
        />
      </label>
      <div className="form-section-title image-form-title">
        <span>02</span>
        <div>
          <h3>Product photos</h3>
          <p>
            Add both sides so customers can inspect the whole piece. Maximum 10
            MB per photo.
          </p>
        </div>
      </div>
      <div className="product-photo-fields">
        {imageSides.map(({ key, label }) => (
          <section
            className="product-photo-field"
            key={key}
            aria-label={`${label} product photo`}
          >
            <label className="field-label">
              {label} IMAGE URL
              <input
                type="url"
                value={imageUrls[key]}
                onChange={(event) => updateImageUrl(key, event.target.value)}
                placeholder="https://your-image-url.com/photo.jpg"
              />
            </label>
            <label className="upload-field">
              <span>↑</span>
              <strong>UPLOAD {label} PHOTO</strong>
              <small>JPG, PNG, WEBP, GIF · MAX 10 MB</small>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => uploadImage(event, key)}
              />
            </label>
            {form[key] && (
              <div className="image-preview">
                <img
                  src={form[key]}
                  alt={`${label.toLowerCase()} product preview`}
                />
                <span>{label} PREVIEW</span>
              </div>
            )}
          </section>
        ))}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-dark" disabled={saving}>
          {editing ? "SAVE CHANGES" : "PUBLISH PRODUCT"} <span>↗</span>
        </button>
        {editing && (
          <button
            className="button button-outline"
            type="button"
            onClick={onCancel}
          >
            CANCEL
          </button>
        )}
      </div>
    </form>
  );
}

export default function AdminDashboard({ products, onSave, onDelete, onBack }) {
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const newArrivals = products.filter(
    (product) => product.badge === "New Arrival",
  ).length;
  const soldOut = products.filter((product) => getStock(product) === 0).length;
  const totalUnits = useMemo(
    () => products.reduce((sum, product) => sum + getStock(product), 0),
    [products],
  );
  const inventoryValue = useMemo(
    () => products.reduce((sum, product) => sum + getPrice(product) * getStock(product), 0),
    [products],
  );

  async function save(product) {
    const saved = await onSave(product);
    if (!saved) {
      setToast(
        "Could not save this product. Check the catalog connection and try again.",
      );
      window.setTimeout(() => setToast(""), 4500);
      return false;
    }
    setEditing(null);
    setToast(
      product.id
        ? "Product changes saved."
        : "Your new product is live in the store.",
    );
    window.setTimeout(() => setToast(""), 3500);
    return true;
  }
  async function toggleStock(product) {
    const saved = await onSave({
      ...product,
      stock: product.stock === 0 ? 10 : 0,
      badge:
        product.stock === 0 && product.badge === "Sold Out"
          ? "Standard"
          : product.stock > 0
            ? "Sold Out"
            : product.badge,
    });
    setToast(
      saved
        ? product.stock === 0
          ? `${product.name} marked as in stock.`
          : `${product.name} marked sold out.`
        : "Could not update stock. Check the catalog connection.",
    );
    window.setTimeout(() => setToast(""), 3500);
  }
  async function removeProduct(product) {
    if (!(await onDelete(product.id))) {
      setToast("Could not delete this product. Please try again.");
      window.setTimeout(() => setToast(""), 3500);
      return;
    }
    setConfirmDelete(null);
    setToast(`${product.name} deleted.`);
    window.setTimeout(() => setToast(""), 3500);
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="wordmark" href="#admin">
          FAVORITE
          <small>ADMIN STUDIO</small>
        </a>
        <div className="admin-header-right">
          <span className="admin-live">
            <i /> STORE LIVE
          </span>
          <button className="button button-outline" onClick={onBack}>
            ← BACK TO STOREFRONT
          </button>
        </div>
      </header>
      <div className="admin-content">
        <div className="admin-welcome">
          <div>
            <span className="eyebrow">YOUR STORE, YOUR STORY</span>
            <h1>
              ADMIN <em>STUDIO.</em>
            </h1>
            <p>Manage your collection and keep every piece in motion.</p>
          </div>
          <div className="admin-date">
            FAVORITE CLOTHING
            <br />
            LAGOS, NIGERIA
          </div>
        </div>
        <section className="stats-grid" aria-label="Store statistics">
          <article>
            <span>TOTAL PRODUCTS</span>
            <strong>{products.length.toString().padStart(2, "0")}</strong>
            <small>Pieces in the collection</small>
          </article>
          <article>
            <span>NEW ARRIVALS</span>
            <strong>{newArrivals.toString().padStart(2, "0")}</strong>
            <small>Fresh from the studio</small>
          </article>
          <article>
            <span>TOTAL UNITS</span>
            <strong>{totalUnits.toLocaleString("en-NG")}</strong>
            <small>Items currently in stock</small>
          </article>
          <article>
            <span>SOLD OUT</span>
            <strong>{soldOut.toString().padStart(2, "0")}</strong>
            <small>Ready for a restock</small>
          </article>
          <article>
            <span>INVENTORY VALUE</span>
            <strong>{formatNaira(inventoryValue)}</strong>
            <small>Price × quantity in stock</small>
          </article>
        </section>
        <div className="admin-workspace">
          <section className="admin-panel form-panel">
            <div className="admin-panel-heading">
              <span className="eyebrow">ADD SOMETHING NEW</span>
              <h2>{editing ? "EDIT PRODUCT" : "ADD NEW CLOTHING"}</h2>
            </div>
            <ProductForm
              key={editing?.id || "new-product"}
              editing={editing}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          </section>
          <section className="admin-panel inventory-panel">
            <div className="admin-panel-heading inventory-heading">
              <div>
                <span className="eyebrow">YOUR CURRENT LINEUP</span>
                <h2>INVENTORY</h2>
              </div>
              <span className="inventory-count">
                {products.length} PRODUCTS
              </span>
            </div>
            {!products.length ? (
              <div className="inventory-empty">
                No products yet. Add your first piece to start the collection.
              </div>
            ) : (
              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>CATEGORY</th>
                      <th>STATUS</th>
                      <th>SIZES</th>
                      <th>PRICE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="inventory-product">
                            <img src={product.image} alt="" />
                            <div>
                              <strong>{product.name}</strong>
                              <small>
                                {product.back_image
                                  ? "Front + back photos"
                                  : "Back photo needed"}{" "}
                                · Stock: {product.stock}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>
                          <span
                            className={`status-chip ${product.stock === 0 ? "status-sold" : product.badge === "New Arrival" ? "status-new" : ""}`}
                          >
                            {product.stock === 0
                              ? "SOLD OUT"
                              : product.badge === "New Arrival"
                                ? "NEW"
                                : "IN STOCK"}
                          </span>
                        </td>
                        <td>{product.sizes?.join(" / ") || "—"}</td>
                        <td>{formatNaira(product.price)}</td>
                        <td>
                          <div className="inventory-actions">
                            <button
                              type="button"
                              onClick={() => setEditing(product)}
                            >
                              EDIT
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStock(product)}
                            >
                              {product.stock === 0 ? "RESTOCK" : "SOLD OUT"}
                            </button>
                            <button
                              type="button"
                              className="delete-action"
                              onClick={() => setConfirmDelete(product)}
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="inventory-cards">
                  {products.map((product) => (
                    <article className="inventory-card" key={product.id}>
                      <div className="inventory-product">
                        <img src={product.image} alt="" />
                        <div>
                          <strong>{product.name}</strong>
                          <small>
                            {product.category} ·{" "}
                            {product.back_image
                              ? "Front + back photos"
                              : "Back photo needed"}{" "}
                            · Stock: {product.stock}
                          </small>
                        </div>
                      </div>
                      <div className="inventory-card-meta">
                        <span
                          className={`status-chip ${product.stock === 0 ? "status-sold" : product.badge === "New Arrival" ? "status-new" : ""}`}
                        >
                          {product.stock === 0
                            ? "SOLD OUT"
                            : product.badge === "New Arrival"
                              ? "NEW"
                              : "IN STOCK"}
                        </span>
                        <strong>{formatNaira(product.price)}</strong>
                      </div>
                      <div className="inventory-actions">
                        <button onClick={() => setEditing(product)}>
                          EDIT
                        </button>
                        <button onClick={() => toggleStock(product)}>
                          {product.stock === 0 ? "RESTOCK" : "SOLD OUT"}
                        </button>
                        <button
                          className="delete-action"
                          onClick={() => setConfirmDelete(product)}
                        >
                          DELETE
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      {toast && (
        <div className="toast admin-toast" role="status">
          {toast}
        </div>
      )}
      {confirmDelete && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmDelete(null);
          }}
        >
          <section
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <span className="eyebrow">REMOVE FROM STORE</span>
            <h2 id="delete-title">Delete this piece?</h2>
            <p>
              {confirmDelete.name} will be removed from your storefront and any
              carts.
            </p>
            <div>
              <button
                className="button button-outline"
                onClick={() => setConfirmDelete(null)}
              >
                KEEP PRODUCT
              </button>
              <button
                className="button button-dark"
                onClick={() => removeProduct(confirmDelete)}
              >
                DELETE PRODUCT
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
