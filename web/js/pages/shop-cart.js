// KH03 - Xem & chỉnh giỏ hàng, áp voucher
(function () {
  'use strict'
  const $ = (id) => document.getElementById(id)
  let products = [], voucher = null

  const unit = (p) => p.discount_price ?? p.price
  const subtotal = () => FW.cart.items().reduce((s, i) => s + unit(products.find((p) => p.id === i.product_id)) * i.quantity, 0)

  async function render() {
    const items = FW.cart.items()
    $('cartEmpty').hidden = items.length > 0
    $('cartBody').hidden = items.length === 0
    if (!items.length) return
    products = await FW_API.getProductsByIds(items.map((i) => i.product_id))
    $('cartLines').innerHTML = items.map((i) => {
      const p = products.find((x) => x.id === i.product_id)
      const name = FW.escapeHtml(p.name)
      return `<div class="d-flex gap-3 p-3 bg-white border rounded-4 align-items-center">
        <img src="${FW.escapeHtml(p.thumbnail_url)}" alt="${name}" width="88" height="88" class="rounded-3 object-fit-cover">
        <div class="flex-grow-1">
          <div class="font-serif">${name}</div>
          <div class="small text-muted-fw">${FW.escapeHtml(p.partner_name)}</div>
          <div class="text-rose fw-bold">${FW.formatVnd(unit(p))}</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-ghost px-3" data-qty="${p.id}" data-d="-1" aria-label="Giảm số lượng">−</button>
          <span aria-label="Số lượng">${i.quantity}</span>
          <button class="btn btn-ghost px-3" data-qty="${p.id}" data-d="1" aria-label="Tăng số lượng">+</button>
        </div>
        <button class="btn btn-ghost" data-del="${p.id}" aria-label="Xoá ${name} khỏi giỏ"><i class="fa-solid fa-trash"></i></button>
      </div>`
    }).join('')
    await totals()
  }

  async function totals() {
    const sub = subtotal()
    let discount = 0
    if (voucher) {
      const r = await FW_API.validateVoucher(voucher, sub)  // đơn đổi → kiểm tra lại
      if (r.ok) discount = r.discount
      else { voucher = null; $('voucherMsg').className = 'small mb-3 text-rose'; $('voucherMsg').textContent = r.message }
    }
    try { voucher ? localStorage.setItem('fw_voucher', voucher) : localStorage.removeItem('fw_voucher') } catch { /* bỏ qua */ }
    $('subtotal').textContent = FW.formatVnd(sub)
    $('discount').textContent = discount ? '− ' + FW.formatVnd(discount) : '0 đ'
    $('total').textContent = FW.formatVnd(sub - discount)
  }

  $('cartLines').addEventListener('click', (e) => {
    const q = e.target.closest('[data-qty]'), d = e.target.closest('[data-del]')
    if (q) {
      const id = Number(q.dataset.qty)
      const cur = FW.cart.items().find((i) => i.product_id === id).quantity
      FW.cart.setQty(id, cur + Number(q.dataset.d))
    } else if (d) FW.cart.remove(Number(d.dataset.del))
    else return
    render()
  })

  $('voucherForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const code = e.target.code.value
    const r = await FW_API.validateVoucher(code, subtotal())
    $('voucherMsg').className = 'small mb-3 ' + (r.ok ? 'text-forest' : 'text-rose')
    $('voucherMsg').textContent = r.ok ? `Đã áp mã ${r.code}, giảm ${FW.formatVnd(r.discount)}.` : r.message
    voucher = r.ok ? r.code : null
    totals()
  })

  render()
})()
