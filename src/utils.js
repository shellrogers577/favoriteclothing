const OWNER_PHONE = '2347050881599'

export function formatNaira(value) {
  return `₦ ${Number(value || 0).toLocaleString('en-NG')}`
}

export function whatsappLink(text) {
  return `https://wa.me/${OWNER_PHONE}?text=${encodeURIComponent(text)}`
}
