(function () {
  'use strict'
  const $ = (id) => document.getElementById(id)
  const code = new URLSearchParams(location.search).get('code')
  let order = null

  async function init() {
    order = code ? await FW_API.getOrderByCode(code) : null
    if (!order) { $('noOrder').hidden = false; return }
    $('okBody').hidden = false
    $('oCode').textContent = order.code
    $('oCount').textContent = order.lines.reduce((n, l) => n + l.quantity, 0)
    $('oTotal').textContent = FW.formatVnd(order.total)
    const r = order.recipient || {}
    $('oShip').textContent = r.address ? `${r.name} · ${r.phone} · ${r.address} (${r.date}, ${r.slot})` : (r.note || '—')
  }

  $('invoiceForm').addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const res = await FW_API.sendInvoice(order.code, ev.target.email.value)
    $('invoiceMsg').className = 'small mt-2 mb-0 ' + (res.ok ? 'text-forest' : 'text-rose')
    $('invoiceMsg').textContent = res.ok ? 'Đã gửi hoá đơn, bạn kiểm tra email nhé.' : res.message
  })

  init()
})()
