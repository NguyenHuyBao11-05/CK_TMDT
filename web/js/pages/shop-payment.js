(function () {
  'use strict'
  const $ = (id) => document.getElementById(id)
  const e = FW.escapeHtml
  const quoteId = new URLSearchParams(location.search).get('quote_id')
  const code = FW_API.newOrderCode()   // dùng làm nội dung chuyển khoản và mã đơn
  let summary = null
  let recipient = {}

  async function init() {
    if (quoteId) {
      summary = await FW_API.getQuoteForPayment(quoteId)   // 1 dòng hàng có quote_id
      recipient = { note: 'Giao nhận theo yêu cầu thiết kế riêng', quote_id: quoteId }
    } else {
      summary = await FW_API.getCartSummary()
      try { recipient = JSON.parse(localStorage.getItem('fw_checkout')) || null } catch { recipient = null }
      if (summary.lines.length && !recipient) { location.replace(FW.url('shop/checkout.html')); return }
    }
    if (!summary.lines.length) { $('emptyMsg').hidden = false; return }
    $('payBody').hidden = false
    $('orderLines').innerHTML = summary.lines.map((l) => `
      <div class="d-flex justify-content-between gap-2 small">
        <span>${e(l.name)} <span class="text-muted-fw">× ${l.quantity}</span>
          ${l.quote_id ? '<span class="badge text-bg-light">Báo giá</span>' : ''}</span>
        <span>${FW.formatVnd(l.unit_price * l.quantity)}</span>
      </div>`).join('')
    $('sSub').textContent = FW.formatVnd(summary.subtotal)
    $('sDisc').textContent = summary.discount ? '− ' + FW.formatVnd(summary.discount) : '0 đ'
    $('sTotal').textContent = FW.formatVnd(summary.total)
    $('payAmount').textContent = FW.formatVnd(summary.total)
    $('payCode').textContent = code
  }

  $('paidBtn').addEventListener('click', async (ev) => {
    ev.target.disabled = true   // tránh bấm 2 lần tạo 2 đơn
    const order = await FW_API.createOrder({ code, lines: summary.lines, recipient, voucher_code: summary.voucher_code,
      subtotal: summary.subtotal, discount: summary.discount, total: summary.total })
    if (!quoteId) {   // đơn từ giỏ → dọn giỏ, voucher, thông tin giao nhận
      FW.cart.clear()
      try { localStorage.removeItem('fw_voucher'); localStorage.removeItem('fw_checkout') } catch { /* bỏ qua */ }
    }
    location.href = FW.url('shop/payment-success.html?code=' + encodeURIComponent(order.code))
  })

  init()
})()
