import { useEffect, useMemo, useState } from 'react'
import Storefront from './components/Storefront.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import { supabase, supabaseConfigured } from './lib/supabase.js'
import './App.css'

const CART_KEY = 'favorite-clothing-cart'

const starterProducts = [
  { id: 'fg-tee', name: 'FG DONT FOLLOW ME TEE', price: 28999, category: 'Tees', badge: 'New Arrival', rating: 5, sizes: ['S', 'M', 'L', 'XL'], description: 'A reminder to walk your own path, made for everyday wear.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', stock: 12 },
  { id: 'track-pant', name: 'FG TRACK PANT', price: 42999, category: 'Track Pants', badge: 'Standard', rating: 5, sizes: ['S', 'M', 'L', 'XL'], description: 'Relaxed fit track pants with a clean, considered finish.', image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=900&q=85', stock: 8 },
  { id: 'red-trucker', name: 'BRIGHT RED TRUCKER', price: 18999, category: 'Caps & Beanies', badge: 'Standard', rating: 4.5, sizes: ['S', 'M', 'L', 'XL'], description: 'A bold everyday cap with an adjustable snapback fit.', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85', stock: 0 },
  { id: 'everyday-tank', name: 'EVERYDAY RIBBED TANK', price: 21999, category: 'Tanks', badge: 'Standard', rating: 4.5, sizes: ['S', 'M', 'L', 'XL'], description: 'Soft, breathable cotton for layering or wearing solo.', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85', stock: 10 },
  { id: 'camo-cap', name: 'FIELD NOTES CAMO CAP', price: 19999, category: 'Caps & Beanies', badge: 'Standard', rating: 5, sizes: ['S', 'M', 'L', 'XL'], description: 'A classic camo print for days spent out and about.', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85', stock: 7 },
  { id: 'beanie', name: 'STAY GROUNDED BEANIE', price: 16999, category: 'Caps & Beanies', badge: 'Standard', rating: 4, sizes: ['S', 'M', 'L', 'XL'], description: 'A soft knit staple with a comfortable, close fit.', image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=900&q=85', stock: 9 },
  { id: 'heritage-tee', name: 'BUILT ON FAITH TEE', price: 26999, category: 'Tees', badge: 'Standard', rating: 5, sizes: ['S', 'M', 'L', 'XL'], description: 'Everyday cotton, easy shape, and a message that matters.', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85', stock: 6 },
  { id: 'crossbody', name: 'DAILY CARRY CROSSBODY', price: 24999, category: 'Accessories', badge: 'Standard', rating: 4.5, sizes: ['S', 'M', 'L', 'XL'], description: 'A compact carry-all designed for your daily essentials.', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', stock: 5 },
]

function readCart() {
  try {
    const saved = localStorage.getItem(CART_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('Unable to read the shopping cart.', error)
    return []
  }
}

export default function App() {
  const [products, setProducts] = useState(supabaseConfigured ? [] : starterProducts)
  const [cart, setCart] = useState(readCart)
  const [adminOpen, setAdminOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [user, setUser] = useState(null)
  const [isStoreAdmin, setIsStoreAdmin] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(supabaseConfigured)
  const [catalogError, setCatalogError] = useState('')
  const [sessionLoading, setSessionLoading] = useState(supabaseConfigured)

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart))
    } catch (error) {
      console.error('Unable to save the shopping cart.', error)
    }
  }, [cart])

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    let lastRefreshAt = 0
    async function loadCatalog() {
      try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        if (error) throw error
        if (!active) return
        setCatalogError('')
        setProducts(data || [])
        setCart(current => current.filter(item => data?.some(product => product.id === item.id)))
      } catch (error) {
        if (!active) return
        console.error('Unable to load the product catalog.', error)
        setCatalogError(`The online catalog could not be loaded: ${error.message}`)
        setProducts([])
      } finally {
        if (active) setCatalogLoading(false)
      }
    }
    function refreshWhenVisible() {
      if (document.visibilityState !== 'visible' || Date.now() - lastRefreshAt < 5000) return
      lastRefreshAt = Date.now()
      lastRefreshAt = Date.now()
      loadCatalog()
    }

    loadCatalog()
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    async function verifyAdmin(userId) {
      try {
        const { data, error } = await supabase.from('store_admins').select('user_id').eq('user_id', userId).maybeSingle()
        if (error) throw error
        if (!active) return
        const authorized = Boolean(data)
        setIsStoreAdmin(authorized)
        setSessionLoading(false)
        if (!authorized) setAdminOpen(false)
      } catch (error) {
        if (!active) return
        console.error('Unable to verify store administrator access.', error)
        setIsStoreAdmin(false)
        setSessionLoading(false)
        setCatalogError(`Admin access could not be verified: ${error.message}`)
      }
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Unable to restore the admin session.', error)
        setSessionLoading(false)
        return
      }
      setUser(data.session?.user || null)
      if (data.session?.user) verifyAdmin(data.session.user.id)
      else setSessionLoading(false)
    }).catch(error => {
      if (!active) return
      console.error('Unable to restore the admin session.', error)
      setCatalogError(`Admin session could not be restored: ${error.message}`)
      setSessionLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) window.setTimeout(() => verifyAdmin(session.user.id), 0)
      else {
        setIsStoreAdmin(false)
        setAdminOpen(false)
        setSessionLoading(false)
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart])

  function addToCart(product, size) {
    setCart(current => {
      const match = current.find(item => item.id === product.id && item.size === size)
      return match
        ? current.map(item => item === match ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item)
        : [...current, { id: product.id, size, quantity: 1 }]
    })
  }

  function updateQuantity(id, size, amount) {
    setCart(current => current.flatMap(item => {
      if (item.id !== id || item.size !== size) return [item]
      const product = products.find(entry => entry.id === id)
      const quantity = Math.min(item.quantity + amount, product?.stock ?? item.quantity)
      return quantity > 0 ? [{ ...item, quantity }] : []
    }))
  }

  function removeFromCart(id, size) {
    setCart(current => current.filter(item => item.id !== id || item.size !== size))
  }

  async function saveProduct(product) {
    if (!supabase || !isStoreAdmin) return false
    try {
      async function saveImage(image) {
        if (!image?.startsWith('data:')) return image || null
        const response = await fetch(image)
        if (!response.ok) throw new Error('The selected product photo could not be read.')
        const blob = await response.blob()
        if (blob.size > 10 * 1024 * 1024) throw new Error('Product photos must be 10 MB or smaller.')
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[blob.type]
        if (!extension) throw new Error('Use a JPG, PNG, WEBP, or GIF product photo.')
        const path = `${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, blob, { contentType: blob.type })
        if (uploadError) throw uploadError
        return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
      }

      const payload = {
        ...product,
        image: await saveImage(product.image),
        back_image: await saveImage(product.back_image),
      }
      delete payload.created_at
      if (!payload.id) delete payload.id
      const { data, error } = await supabase.from('products').upsert(payload).select().single()
      if (error) throw error
      setProducts(current => [data, ...current.filter(item => item.id !== data.id)])
      setCatalogError('')
      return true
    } catch (error) {
      console.error('Unable to save the product.', error)
      setCatalogError(`Product changes could not be saved: ${error.message}`)
      return false
    }
  }

  async function deleteProduct(id) {
    if (!supabase || !isStoreAdmin) return false
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(current => current.filter(product => product.id !== id))
      setCart(current => current.filter(item => item.id !== id))
      setCatalogError('')
      return true
    } catch (error) {
      console.error('Unable to delete the product.', error)
      setCatalogError(`Product could not be deleted: ${error.message}`)
      return false
    }
  }

  async function login(event) {
    event.preventDefault()
    if (!supabase) {
      setLoginError('Connect a Supabase project first. See the setup steps in README.md.')
      return
    }
    setLoginBusy(true)
    setLoginError('')
    try {
      const form = new FormData(event.currentTarget)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.get('email'),
        password: form.get('password'),
      })
      if (error) throw error
      const { data: adminRecord, error: adminError } = await supabase
        .from('store_admins')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle()
      if (adminError) {
        await supabase.auth.signOut()
        throw adminError
      }
      if (!adminRecord) {
        await supabase.auth.signOut()
        setLoginError('This account is not authorized to manage the store.')
        setLoginBusy(false)
        return
      }
      setUser(data.user)
      setIsStoreAdmin(true)
      setAdminOpen(true)
      setLoginOpen(false)
      setLoginBusy(false)
    } catch (error) {
      console.error('Unable to sign in to the store admin account.', error)
      setLoginError(error.message || 'Sign-in failed. Check your connection and try again.')
      setLoginBusy(false)
    }
  }

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setAdminOpen(false)
      setIsStoreAdmin(false)
      setUser(null)
    } catch (error) {
      console.error('Unable to end the admin session.', error)
      setCatalogError(`Could not sign out: ${error.message}`)
    }
  }

  function openAdmin() {
    if (isStoreAdmin) setAdminOpen(true)
    else {
      setLoginOpen(true)
      setLoginError('')
    }
  }

  return (
    <>
      {adminOpen && user && isStoreAdmin
        ? <AdminDashboard products={products} onSave={saveProduct} onDelete={deleteProduct} onBack={logout} />
        : <Storefront products={products} cart={cart} cartCount={cartCount} onAdd={addToCart} onQuantity={updateQuantity} onRemove={removeFromCart} onAdmin={openAdmin} isStoreAdmin={isStoreAdmin} catalogLoading={catalogLoading} statusMessage={catalogError} />}
      {loginOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setLoginOpen(false) }}><form className="login-modal" onSubmit={login} role="dialog" aria-modal="true" aria-labelledby="login-title"><button type="button" className="icon-close" onClick={() => setLoginOpen(false)} aria-label="Close admin login">×</button><span className="eyebrow">OWNER ACCESS</span><h2 id="login-title">WELCOME BACK.</h2><p>Sign in with your store administrator account.</p><label className="field-label">EMAIL<input name="email" type="email" autoComplete="username" placeholder="you@example.com" required /></label><label className="field-label">PASSWORD<input name="password" type="password" autoComplete="current-password" placeholder="Your password" required /></label>{loginError && <p className="form-error" role="alert">{loginError}</p>}{!supabaseConfigured && <p className="setup-notice">Supabase is not configured yet. Add the project URL and public anon key to <code>.env.local</code>, then restart the dev server.</p>}<button type="submit" className="button button-dark" disabled={loginBusy || sessionLoading}>{loginBusy ? 'SIGNING IN…' : 'ENTER ADMIN STUDIO ↗'}</button><small>Your account must be added to the store admin allowlist.</small></form></div>}
    </>
  )
}
