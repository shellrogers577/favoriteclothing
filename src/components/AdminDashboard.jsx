import { useMemo, useState } from 'react'
import { formatNaira } from '../utils.js'

const categories = ['Tees', 'Caps & Beanies', 'Track Pants', 'Tanks', 'Accessories']
const sizesList = ['S', 'M', 'L', 'XL']
const emptyProduct = { name: '', price: '', category: 'Tees', badge: 'Standard', rating: '5', sizes: ['S', 'M', 'L', 'XL'], description: '', image: '', stock: 10 }

function ProductForm({ editing, onSave, onCancel }) {
  const [form, setForm] = useState(editing ? { ...editing, price: String(editing.price), rating: String(editing.rating) } : emptyProduct)
  const [imageUrl, setImageUrl] = useState(editing?.image || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function change(field, value) { setForm(current => ({ ...current, [field]: value })) }
  function toggleSize(size) { setForm(current => ({ ...current, sizes: current.sizes.includes(size) ? current.sizes.filter(item => item !== size) : [...current.sizes, size] })) }
  function updateImageUrl(value) { setImageUrl(value); change('image', value.trim()) }
  function uploadImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file to continue.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Image files must be 2 MB or smaller for reliable upload.'); return }
    const reader = new FileReader()
    reader.onload = () => { const result = String(reader.result || ''); change('image', result); setImageUrl(''); setError('') }
    reader.onerror = () => setError('This image could not be read. Please try another file.')
    reader.readAsDataURL(file)
  }
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!form.sizes.length) { setError('Select at least one available size.'); return }
    if (!form.image.trim()) { setError('Add an image URL or upload an image.'); return }
    setSaving(true)
    try {
      const saved = await onSave({ ...form, name: form.name.trim().toUpperCase(), price: Number(form.price), rating: Number(form.rating), stock: form.badge === 'Sold Out' ? 0 : (form.stock === 0 ? 10 : Number(form.stock)) })
      if (!saved) setError('Could not save this product. Check the catalog connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="form-section-title"><span>01</span><div><h3>Product details</h3><p>Give this piece its place in the collection.</p></div></div>
      <label className="field-label">PRODUCT NAME<input value={form.name} onChange={event => change('name', event.target.value)} placeholder="e.g. BUILT ON FAITH TEE" required maxLength={70} /></label>
      <div className="form-two-col">
        <label className="field-label">PRICE (₦)<input type="number" value={form.price} onChange={event => change('price', event.target.value)} min="1" step="1" placeholder="28999" required /></label>
        <label className="field-label">CATEGORY<select value={form.category} onChange={event => change('category', event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
      </div>
      <div className="form-two-col">
        <label className="field-label">BADGE / STATUS<select value={form.badge} onChange={event => { change('badge', event.target.value); if (event.target.value === 'Sold Out') change('stock', 0) }}>{['New Arrival', 'Standard', 'Sold Out'].map(badge => <option key={badge}>{badge}</option>)}</select></label>
        <label className="field-label">STAR RATING<select value={form.rating} onChange={event => change('rating', event.target.value)}>{[5, 4.5, 4, 3.5, 3, 2, 1].map(rating => <option value={rating} key={rating}>{rating} / 5</option>)}</select></label>
      </div>
      <fieldset className="size-fieldset"><legend>AVAILABLE SIZES</legend><div className="admin-size-options">{sizesList.map(size => <label key={size} className={form.sizes.includes(size) ? 'admin-size-selected' : ''}><input type="checkbox" checked={form.sizes.includes(size)} onChange={() => toggleSize(size)} />{size}</label>)}</div></fieldset>
      <label className="field-label">SHORT DESCRIPTION<textarea value={form.description} onChange={event => change('description', event.target.value)} placeholder="What makes this piece special?" rows="3" maxLength={180} /></label>
      <div className="form-section-title image-form-title"><span>02</span><div><h3>Product image</h3><p>Paste a direct image URL or upload a file (2 MB max).</p></div></div>
      <label className="field-label">IMAGE URL<input type="url" value={imageUrl} onChange={event => updateImageUrl(event.target.value)} placeholder="https://your-image-url.com/photo.jpg" /></label>
      <label className="upload-field"><span>↑</span><strong>UPLOAD TO SECURE STORE</strong><small>JPG, PNG, WEBP · MAX 2 MB</small><input type="file" accept="image/*" onChange={uploadImage} /></label>
      {form.image && <div className="image-preview"><img src={form.image} alt="Product preview" /><span>IMAGE PREVIEW</span></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button className="button button-dark" disabled={saving}>{editing ? 'SAVE CHANGES' : 'PUBLISH PRODUCT'} <span>↗</span></button>{editing && <button className="button button-outline" type="button" onClick={onCancel}>CANCEL</button>}</div>
    </form>
  )
}

export default function AdminDashboard({ products, onSave, onDelete, onBack }) {
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const newArrivals = products.filter(product => product.badge === 'New Arrival').length
  const soldOut = products.filter(product => product.stock === 0).length
  const inventoryValue = useMemo(() => products.reduce((sum, product) => sum + product.price * product.stock, 0), [products])

  async function save(product) {
    const saved = await onSave(product)
    if (!saved) {
      setToast('Could not save this product. Check the catalog connection and try again.')
      window.setTimeout(() => setToast(''), 4500)
      return false
    }
    setEditing(null)
    setToast(product.id ? 'Product changes saved.' : 'Your new product is live in the store.')
    window.setTimeout(() => setToast(''), 3500)
    return true
  }
  async function toggleStock(product) {
    const saved = await onSave({ ...product, stock: product.stock === 0 ? 10 : 0, badge: product.stock === 0 && product.badge === 'Sold Out' ? 'Standard' : (product.stock > 0 ? 'Sold Out' : product.badge) })
    setToast(saved ? (product.stock === 0 ? `${product.name} marked as in stock.` : `${product.name} marked sold out.`) : 'Could not update stock. Check the catalog connection.')
    window.setTimeout(() => setToast(''), 3500)
  }
  async function removeProduct(product) {
    if (!await onDelete(product.id)) {
      setToast('Could not delete this product. Please try again.')
      window.setTimeout(() => setToast(''), 3500)
      return
    }
    setConfirmDelete(null)
    setToast(`${product.name} deleted.`)
    window.setTimeout(() => setToast(''), 3500)
  }

  return (
    <main className="admin-page">
      <header className="admin-header"><a className="wordmark" href="#admin">FAVORITE<span>®</span><small>ADMIN STUDIO</small></a><div className="admin-header-right"><span className="admin-live"><i /> STORE LIVE</span><button className="button button-outline" onClick={onBack}>← BACK TO STOREFRONT</button></div></header>
      <div className="admin-content">
        <div className="admin-welcome"><div><span className="eyebrow">YOUR STORE, YOUR STORY</span><h1>ADMIN <em>STUDIO.</em></h1><p>Manage your collection and keep every piece in motion.</p></div><div className="admin-date">FAVORITE CLOTHING<br />LAGOS, NIGERIA</div></div>
        <section className="stats-grid" aria-label="Store statistics">
          <article><span>TOTAL PRODUCTS</span><strong>{products.length.toString().padStart(2, '0')}</strong><small>Pieces in the collection</small></article>
          <article><span>NEW ARRIVALS</span><strong>{newArrivals.toString().padStart(2, '0')}</strong><small>Fresh from the studio</small></article>
          <article><span>SOLD OUT</span><strong>{soldOut.toString().padStart(2, '0')}</strong><small>Ready for a restock</small></article>
          <article><span>INVENTORY VALUE</span><strong>{formatNaira(inventoryValue)}</strong><small>Based on current stock</small></article>
        </section>
        <div className="admin-workspace">
          <section className="admin-panel form-panel"><div className="admin-panel-heading"><span className="eyebrow">ADD SOMETHING NEW</span><h2>{editing ? 'EDIT PRODUCT' : 'ADD NEW CLOTHING'}</h2></div><ProductForm key={editing?.id || 'new-product'} editing={editing} onSave={save} onCancel={() => setEditing(null)} /></section>
          <section className="admin-panel inventory-panel"><div className="admin-panel-heading inventory-heading"><div><span className="eyebrow">YOUR CURRENT LINEUP</span><h2>INVENTORY</h2></div><span className="inventory-count">{products.length} PRODUCTS</span></div>
            {!products.length ? <div className="inventory-empty">No products yet. Add your first piece to start the collection.</div> : <div className="inventory-table-wrap"><table className="inventory-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>STATUS</th><th>SIZES</th><th>PRICE</th><th>ACTIONS</th></tr></thead><tbody>{products.map(product => <tr key={product.id}>
              <td><div className="inventory-product"><img src={product.image} alt="" /><div><strong>{product.name}</strong><small>Stock: {product.stock}</small></div></div></td>
              <td>{product.category}</td><td><span className={`status-chip ${product.stock === 0 ? 'status-sold' : product.badge === 'New Arrival' ? 'status-new' : ''}`}>{product.stock === 0 ? 'SOLD OUT' : product.badge === 'New Arrival' ? 'NEW' : 'IN STOCK'}</span></td><td>{product.sizes?.join(' / ') || '—'}</td><td>{formatNaira(product.price)}</td><td><div className="inventory-actions"><button type="button" onClick={() => setEditing(product)}>EDIT</button><button type="button" onClick={() => toggleStock(product)}>{product.stock === 0 ? 'RESTOCK' : 'SOLD OUT'}</button><button type="button" className="delete-action" onClick={() => setConfirmDelete(product)}>DELETE</button></div></td>
            </tr>)}</tbody></table>
            <div className="inventory-cards">{products.map(product => <article className="inventory-card" key={product.id}><div className="inventory-product"><img src={product.image} alt="" /><div><strong>{product.name}</strong><small>{product.category} · Stock: {product.stock}</small></div></div><div className="inventory-card-meta"><span className={`status-chip ${product.stock === 0 ? 'status-sold' : product.badge === 'New Arrival' ? 'status-new' : ''}`}>{product.stock === 0 ? 'SOLD OUT' : product.badge === 'New Arrival' ? 'NEW' : 'IN STOCK'}</span><strong>{formatNaira(product.price)}</strong></div><div className="inventory-actions"><button onClick={() => setEditing(product)}>EDIT</button><button onClick={() => toggleStock(product)}>{product.stock === 0 ? 'RESTOCK' : 'SOLD OUT'}</button><button className="delete-action" onClick={() => setConfirmDelete(product)}>DELETE</button></div></article>)}</div>
            </div>}
          </section>
        </div>
      </div>
      {toast && <div className="toast admin-toast" role="status">{toast}</div>}
      {confirmDelete && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setConfirmDelete(null) }}><section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><span className="eyebrow">REMOVE FROM STORE</span><h2 id="delete-title">Delete this piece?</h2><p>{confirmDelete.name} will be removed from your storefront and any carts.</p><div><button className="button button-outline" onClick={() => setConfirmDelete(null)}>KEEP PRODUCT</button><button className="button button-dark" onClick={() => removeProduct(confirmDelete)}>DELETE PRODUCT</button></div></section></div>}
    </main>
  )
}
