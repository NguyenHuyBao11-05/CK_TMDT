(function () {
  'use strict'
  const $ = (id) => document.getElementById(id)
  const e = FW.escapeHtml
  const form = $('checkoutForm')
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  $('fDate').min = today.toISOString().slice(0, 10)

  try {
    const saved = JSON.parse(localStorage.getItem('fw_checkout')) || {}
    Object.entries(saved).forEach(([k, v]) => { if (form.elements[k]) form.elements[k].value = v })
  } catch { /* bỏ qua */ }

  async function init() {
    const s = await FW_API.getCartSummary()
    if (!s.lines.length) { location.replace(FW.url('shop/cart.html')); return }
    $('orderLines').innerHTML = s.lines.map((l) => `
      <div class="d-flex justify-content-between gap-2 small">
        <span>${e(l.name)} <span class="text-muted-fw">× ${l.quantity}</span></span>
        <span>${FW.formatVnd(l.unit_price * l.quantity)}</span>
      </div>`).join('')
    $('sSub').textContent = FW.formatVnd(s.subtotal)
    $('sDisc').textContent = s.discount ? '− ' + FW.formatVnd(s.discount) : '0 đ'
    $('sCode').textContent = s.voucher_code ? `(${s.voucher_code})` : ''
    $('sTotal').textContent = FW.formatVnd(s.total)
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const f = form.elements
    const ok = {
      name: f.name.value.trim().length > 0,
      phone: /^0\d{9}$/.test(f.phone.value.replace(/\s/g, '')),
      address: f.address.value.trim().length > 0,
      date: f.date.value !== '' && f.date.value >= f.date.min,
    }
    Object.entries(ok).forEach(([k, v]) => f[k].classList.toggle('is-invalid', !v))
    const firstBad = Object.keys(ok).find((k) => !ok[k])
    if (firstBad) {
      f[firstBad].scrollIntoView({ block: 'center', behavior: 'smooth' })
      f[firstBad].focus({ preventScroll: true })
      return
    }
    const data = { name: f.name.value.trim(), phone: f.phone.value.replace(/\s/g, ''), address: f.address.value.trim(),
      date: f.date.value, slot: f.slot.value, note: f.note.value.trim() }
    try { localStorage.setItem('fw_checkout', JSON.stringify(data)) } catch { /* bỏ qua */ }
    location.href = FW.url('shop/payment.html')
  })

  init()
})()