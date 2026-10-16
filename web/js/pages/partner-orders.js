(function () {
  'use strict'

  const e = FW.escapeHtml
  const imageFor = (index) => `../images/flowers/${['lily-of-valley.jpg', 'white-tulips.jpg', 'pink-vase.jpg', 'sunshine-basket.jpg'][index % 4]}`
  const columns = [
    { status: 'PENDING', title: 'Cần chuẩn bị (Đơn mới)', icon: 'fa-circle', tone: 'pending' },
    { status: 'PROCESSING', title: 'Đang cắm (Đợi duyệt mẫu)', icon: 'fa-circle', tone: 'processing' },
    { status: 'SHIPPING', title: 'Đang giao hàng', icon: 'fa-circle', tone: 'shipping' },
  ]

  function orderCard(order, index) {
    const isCustom = order.item.toLowerCase().includes('cưới') || order.item.toLowerCase().includes('thiết kế')
    return `
      <article class="kanban-order-card">
        <div class="kanban-card-top"><strong>${e(order.id)}</strong><span class="order-status ${order.status.toLowerCase()}">${isCustom ? 'Thiết kế riêng' : 'Mẫu có sẵn'}</span></div>
        ${order.status === 'PROCESSING' ? '<div class="kanban-alert"><i class="fa-solid fa-triangle-exclamation"></i> Chờ khách hàng xác nhận ảnh mẫu trước khi tiếp tục.</div>' : ''}
        <div class="kanban-product">
          <img src="${e(imageFor(index))}" alt="">
          <div><strong>${e(order.item)}</strong><span>${e(order.customer)} · 0903 ••• ••91</span></div>
        </div>
        <div class="kanban-price-row"><span><i class="fa-regular fa-clock me-1"></i>Hạn chót: ${e(order.date)}</span><strong>${FW.formatVnd(order.total)}</strong></div>
        <div class="kanban-order-actions">
          <a class="partner-secondary-btn" href="#${encodeURIComponent(order.id)}">Xem chi tiết</a>
          ${order.status === 'PENDING' ? '<button type="button" class="partner-primary-btn"><i class="fa-solid fa-check"></i> Bắt đầu làm hoa</button>' : ''}
          ${order.status === 'PROCESSING' ? '<button type="button" class="partner-secondary-btn"><i class="fa-solid fa-camera"></i> Cập nhật ảnh hoàn thành</button>' : ''}
          ${order.status === 'SHIPPING' ? '<span class="order-status shipping"><i class="fa-solid fa-truck"></i> Đang vận chuyển</span>' : ''}
        </div>
      </article>
    `
  }

  function renderBoard(orders, query = '', type = '') {
    const filtered = orders.filter((order) => {
      const text = `${order.id} ${order.customer} ${order.item}`.toLowerCase()
      const isCustom = order.item.toLowerCase().includes('cưới') || order.item.toLowerCase().includes('thiết kế')
      return text.includes(query.toLowerCase()) && (!type || (isCustom ? 'Thiết kế riêng' : 'Mẫu có sẵn') === type)
    })

    document.getElementById('orderBoard').innerHTML = columns.map((column) => {
      const items = filtered.filter((order) => order.status === column.status)
      return `
        <section class="kanban-column ${column.tone}">
          <header class="kanban-column-header"><h2><i class="fa-solid ${column.icon}"></i>${e(column.title)}</h2><span>${items.length}</span><button type="button" aria-label="Tuỳ chọn"><i class="fa-solid fa-ellipsis"></i></button></header>
          <div class="kanban-card-list">${items.length ? items.map((order) => orderCard(order, filtered.indexOf(order))).join('') : '<div class="partner-empty-state">Không có đơn trong trạng thái này.</div>'}</div>
        </section>
      `
    }).join('')
  }

  async function init() {
    const orders = await FW_API.getPartnerOrders()
    renderBoard(orders)
    document.getElementById('orderSearch').addEventListener('input', (event) => {
      renderBoard(orders, event.target.value, document.getElementById('orderTypeFilter').value)
    })
    document.getElementById('orderTypeFilter').addEventListener('change', (event) => {
      renderBoard(orders, document.getElementById('orderSearch').value, event.target.value)
    })
  }

  init()
})()
