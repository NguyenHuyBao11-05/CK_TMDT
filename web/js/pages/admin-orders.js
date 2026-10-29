(function () {
  'use strict'

  const e = FW.escapeHtml
  const labels = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang chuẩn bị',
    SHIPPING: 'Đang giao',
    RECEIVED: 'Đã nhận',
    CANCELLED: 'Đã huỷ',
  }
  const orderModal = new bootstrap.Modal(document.getElementById('orderDetailModal'))
  let orders = []

  function formatDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  }

  function badge(status) {
    const tone = status === 'RECEIVED' ? 'green' : status === 'CANCELLED' ? 'rose'
      : status === 'PENDING' ? 'gold' : status === 'SHIPPING' ? 'blue' : 'gray'
    return `<span class="badge-soft ${tone}">${e(labels[status] || status || '—')}</span>`
  }

  function filteredOrders() {
    const query = document.getElementById('orderSearch').value.trim().toLocaleLowerCase('vi')
    const status = document.getElementById('orderStatus').value
    const paymentStatus = document.getElementById('paymentStatus').value
    return orders.filter((order) => {
      const itemNames = (order.items || []).map((item) => item.item_name).join(' ')
      const text = `${order.order_code} ${order.customer_name} ${order.customer_phone || ''} ${order.partner_name || ''} ${itemNames}`.toLocaleLowerCase('vi')
      return (!query || text.includes(query))
        && (!status || order.status === status)
        && (!paymentStatus || order.payment_status === paymentStatus)
    })
  }

  function renderStats() {
    const count = (status) => orders.filter((order) => order.status === status).length
    document.getElementById('statTotal').innerHTML = `${orders.length} <small>đơn</small>`
    document.getElementById('statPending').innerHTML = `${count('PENDING')} <small>đơn</small>`
    document.getElementById('statProcessing').innerHTML = `${count('PROCESSING') + count('SHIPPING')} <small>đơn</small>`
    document.getElementById('statCancelled').innerHTML = `${count('CANCELLED')} <small>đơn</small>`
  }

  function renderOrders() {
    const visible = filteredOrders()
    const rows = visible.map((order) => {
      const payment = order.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'
      return `<tr>
        <td><strong>${e(order.order_code)}</strong><small>${(order.items || []).length} món</small></td>
        <td><strong>${e(order.customer_name || '—')}</strong><small>${e(order.customer_phone || '')}</small></td>
        <td>${e(formatDate(order.created_at))}</td>
        <td>${e(payment)}<small class="${order.payment_status === 'PAID' ? 'text-success' : 'text-warning'}">${order.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</small></td>
        <td>${e(order.partner_name || 'Chưa có Đối tác')}</td>
        <td><strong>${FW.formatVnd(order.total_amount)}</strong></td>
        <td>${badge(order.status)}</td>
        <td><div class="d-flex gap-1">
          <button type="button" class="btn-icon" data-order-detail="${e(order.id)}" aria-label="Xem chi tiết"><i class="fa-regular fa-eye"></i></button>
          ${order.status === 'PENDING' && !order.partner_id && !order.design_request_id
            ? `<button type="button" class="btn-icon danger" data-cancel-order="${e(order.id)}" aria-label="Huỷ đơn chưa có người nhận"><i class="fa-solid fa-ban"></i></button>` : ''}
        </div></td>
      </tr>`
    }).join('')
    document.getElementById('orderRows').innerHTML = rows || '<tr><td colspan="8" class="text-center text-muted-fw py-5">Không có đơn hàng phù hợp.</td></tr>'
    document.getElementById('orderCount').textContent = `Hiển thị ${visible.length} / ${orders.length} đơn hàng`
  }

  function renderDetails(order) {
    const items = (order.items || []).map((item) => `
      <div class="order-detail-item">
        ${item.thumbnail_url ? `<img src="${e(FW_API.imageUrl(item.thumbnail_url))}" alt="">` : '<span class="order-detail-placeholder"><i class="fa-solid fa-spa"></i></span>'}
        <div class="flex-grow-1"><strong>${e(item.item_name)} × ${e(item.quantity)}</strong>
          <small>${e(item.material || item.item_description || '—')}</small></div>
        <div class="text-end"><small>${FW.formatVnd(item.unit_price)} / món</small><strong>${FW.formatVnd(item.subtotal)}</strong></div>
      </div>`).join('') || '<p class="text-muted-fw">Đơn chưa có thông tin món hàng.</p>'
    const evidence = order.completion_image_url
      ? `<a class="order-evidence" href="${e(FW_API.imageUrl(order.completion_image_url))}" target="_blank" rel="noopener noreferrer">
          <img src="${e(FW_API.imageUrl(order.completion_image_url))}" alt="Ảnh minh chứng hoàn thành"><span><i class="fa-regular fa-image me-1"></i>Xem ảnh minh chứng</span>
        </a>`
      : '<p class="text-muted-fw small mb-0">Chưa có ảnh minh chứng hoàn thành.</p>'
    const invoice = order.invoice_number
      ? `<strong>${e(order.invoice_number)}</strong><small>Gửi lúc: ${e(formatDate(order.invoice_sent_at))}</small>`
      : '<span class="text-muted-fw">Chưa phát hành hoá đơn</span>'
    document.getElementById('orderDetailTitle').textContent = `Chi tiết đơn ${order.order_code}`
    document.getElementById('orderDetailBody').innerHTML = `
      <div class="order-detail-grid">
        <section class="order-detail-section"><h3><i class="fa-solid fa-user me-2"></i>Khách hàng & giao nhận</h3>
          <p><strong>${e(order.customer_name || '—')}</strong><br>${e(order.customer_email || '')} ${order.customer_phone ? `· ${e(order.customer_phone)}` : ''}</p>
          <p class="mb-1">Người nhận: ${e(order.recipient_name || '—')} · ${e(order.recipient_phone || '—')}</p>
          <p class="mb-1">Địa chỉ: ${e(order.delivery_address || '—')}</p>
          ${order.delivery_note ? `<p class="mb-0">Ghi chú: ${e(order.delivery_note)}</p>` : ''}
        </section>
        <section class="order-detail-section"><h3><i class="fa-solid fa-credit-card me-2"></i>Thanh toán</h3>
          <p>${order.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'} · ${order.payment_status === 'PAID' ? '<span class="text-success">Đã thanh toán</span>' : '<span class="text-warning">Chưa thanh toán</span>'}</p>
          <div class="order-detail-money"><span>Tạm tính</span><strong>${FW.formatVnd(order.subtotal_amount)}</strong></div>
          <div class="order-detail-money"><span>Giảm giá</span><strong>${FW.formatVnd(order.discount_amount)}</strong></div>
          <div class="order-detail-money"><span>Phí giao hàng</span><strong>${FW.formatVnd(order.shipping_fee)}</strong></div>
          <div class="order-detail-money total"><span>Tổng thanh toán</span><strong>${FW.formatVnd(order.total_amount)}</strong></div>
        </section>
        <section class="order-detail-section"><h3><i class="fa-regular fa-file-lines me-2"></i>Hoá đơn</h3>${invoice}</section>
        <section class="order-detail-section"><h3><i class="fa-regular fa-image me-2"></i>Ảnh minh chứng</h3>${evidence}</section>
      </div>
      <section class="order-detail-section mt-3"><h3><i class="fa-solid fa-basket-shopping me-2"></i>Món hàng</h3><div class="order-detail-items">${items}</div></section>`
  }

  async function loadOrders() {
    const rows = document.getElementById('orderRows')
    rows.innerHTML = '<tr><td colspan="8" class="text-center text-muted-fw py-5">Đang tải đơn hàng...</td></tr>'
    try {
      orders = await FW_API.getAdminOrders()
      renderStats()
      renderOrders()
    } catch (error) {
      orders = []
      renderStats()
      rows.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-5">${e(error.message)}</td></tr>`
      document.getElementById('orderCount').textContent = ''
      FW.toast(error.message)
    }
  }

  document.getElementById('orderSearch').addEventListener('input', renderOrders)
  document.getElementById('orderStatus').addEventListener('change', renderOrders)
  document.getElementById('paymentStatus').addEventListener('change', renderOrders)
  document.getElementById('refreshOrders').addEventListener('click', () => { void loadOrders() })
  document.getElementById('orderRows').addEventListener('click', async (event) => {
    const detailButton = event.target.closest('[data-order-detail]')
    if (detailButton) {
      const order = orders.find((item) => item.id === Number(detailButton.dataset.orderDetail))
      if (order) {
        renderDetails(order)
        orderModal.show()
      }
      return
    }
    const cancelButton = event.target.closest('[data-cancel-order]')
    if (!cancelButton) return
    const order = orders.find((item) => item.id === Number(cancelButton.dataset.cancelOrder))
    const paidWarning = order && order.payment_status === 'PAID'
      ? ' Đơn đã thanh toán; thao tác này không tự động hoàn tiền.'
      : ''
    if (!order || !window.confirm(`Huỷ đơn ${order.order_code}? Chỉ những đơn chưa có Đối tác nhận mới được phép huỷ.${paidWarning}`)) return
    cancelButton.disabled = true
    try {
      await FW_API.cancelUnclaimedAdminOrder(order.id)
      FW.toast(`Đã huỷ đơn ${order.order_code}.`)
      await loadOrders()
    } catch (error) {
      FW.toast(error.message)
      cancelButton.disabled = false
    }
  })

  void loadOrders()
})()
