(function () {
  'use strict'

  const e = FW.escapeHtml
  const columns = [
    { status: 'AVAILABLE', title: 'Đơn khả dụng', icon: 'fa-inbox', tone: 'pending' },
    { status: 'PROCESSING', title: 'Đang chuẩn bị', icon: 'fa-scissors', tone: 'processing' },
    { status: 'SHIPPING', title: 'Đang giao hàng', icon: 'fa-truck', tone: 'shipping' },
  ]
  let orders = []
  let availableOrders = []

  function formatDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  }

  function orderType(order) {
    return order.design_request_id ? 'Thiết kế riêng' : 'Mẫu có sẵn'
  }

  function orderCard(order) {
    const items = (order.items || []).map((item) => `
      <div class="kanban-product">
        <img src="${e(FW_API.imageUrl(item.thumbnail_url))}" alt="">
        <div><strong>${e(item.item_name)} × ${e(item.quantity)}</strong><span>${e(item.material || 'Thiết kế riêng')}</span></div>
      </div>`).join('')
    const action = order.status === 'AVAILABLE'
      ? `<button type="button" class="partner-primary-btn" data-accept-order="${e(order.id)}"><i class="fa-solid fa-check"></i> Nhận đơn</button>`
      : order.status === 'PROCESSING'
        ? '<span class="order-status processing">Đang chuẩn bị</span>'
        : '<span class="order-status shipping"><i class="fa-solid fa-truck"></i> Đang vận chuyển</span>'
    return `
      <article class="kanban-order-card">
        <div class="kanban-card-top"><strong>${e(order.order_code)}</strong><span class="order-status ${order.status.toLowerCase()}">${e(orderType(order))}</span></div>
        <div class="kanban-customer"><i class="fa-solid fa-user me-1"></i>${e(order.customer_name)}${order.customer_phone ? ` · ${e(order.customer_phone)}` : ''}</div>
        ${items || '<div class="kanban-product"><div><strong>Thông tin sản phẩm chưa có</strong></div></div>'}
        <div class="kanban-price-row"><span><i class="fa-regular fa-clock me-1"></i>Đặt lúc: ${e(formatDate(order.created_at))}</span><strong>${FW.formatVnd(order.total_amount)}</strong></div>
        <div class="kanban-order-actions">${action}</div>
      </article>`
  }

  function renderBoard() {
    const query = document.getElementById('orderSearch').value.trim().toLocaleLowerCase('vi')
    const type = document.getElementById('orderTypeFilter').value
    const available = availableOrders.map((order) => ({ ...order, status: 'AVAILABLE' }))
    const allOrders = [...available, ...orders]
    const filtered = allOrders.filter((order) => {
      const text = `${order.order_code} ${order.customer_name} ${order.customer_phone || ''} ${(order.items || []).map((item) => item.item_name).join(' ')}`.toLocaleLowerCase('vi')
      return text.includes(query) && (!type || orderType(order) === type)
    })

    document.getElementById('availableOrderCount').textContent = `${availableOrders.length} đơn khả dụng`
    document.getElementById('orderBoard').innerHTML = columns.map((column) => {
      const items = filtered.filter((order) => order.status === column.status)
      return `
        <section class="kanban-column ${column.tone}">
          <header class="kanban-column-header"><h2><i class="fa-solid ${column.icon}"></i>${e(column.title)}</h2><span>${items.length}</span></header>
          <div class="kanban-card-list">${items.length ? items.map(orderCard).join('') : '<div class="partner-empty-state">Không có đơn trong trạng thái này.</div>'}</div>
        </section>`
    }).join('')
  }

  async function loadOrders() {
    const board = document.getElementById('orderBoard')
    board.innerHTML = '<div class="partner-empty-state">Đang tải đơn hàng...</div>'
    try {
      const [available, mine] = await Promise.all([
        callServer('/api/partner/orders/available'),
        callServer('/api/partner/orders'),
      ])
      availableOrders = available
      orders = mine.filter((order) => order.status === 'PROCESSING' || order.status === 'SHIPPING')
      renderBoard()
    } catch (error) {
      availableOrders = []
      orders = []
      document.getElementById('availableOrderCount').textContent = 'Không tải được đơn'
      board.innerHTML = `<div class="partner-empty-state text-danger">${e(error.message)}</div>`
      FW.toast(error.message)
    }
  }

  document.getElementById('orderSearch').addEventListener('input', renderBoard)
  document.getElementById('orderTypeFilter').addEventListener('change', renderBoard)
  document.getElementById('refreshOrders').addEventListener('click', () => { void loadOrders() })
  document.getElementById('orderBoard').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-accept-order]')
    if (!button) return
    button.disabled = true
    try {
      await callServer(`/api/partner/orders/${button.dataset.acceptOrder}/accept`, { method: 'POST' })
      FW.toast('Đã nhận đơn. Đơn hàng đã chuyển sang trạng thái Đang chuẩn bị.')
      await loadOrders()
    } catch (error) {
      button.disabled = false
      FW.toast(error.message)
      await loadOrders()
    }
  })

  void loadOrders()
})()
