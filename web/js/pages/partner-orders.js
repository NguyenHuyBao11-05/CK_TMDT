(function () {
  'use strict'

  const e = FW.escapeHtml
  const columns = [
    { status: 'AVAILABLE', title: 'Đơn khả dụng', icon: 'fa-inbox', tone: 'pending' },
    { status: 'PENDING', title: 'Chờ bắt đầu', icon: 'fa-hourglass-half', tone: 'pending' },
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
    let action
    if (order.status === 'AVAILABLE') {
      action = `<button type="button" class="partner-primary-btn" data-accept-order="${e(order.id)}"><i class="fa-solid fa-check"></i> Nhận đơn</button>`
    } else if (order.status === 'PENDING') {
      action = order.payment_status === 'PAID'
        ? `<button type="button" class="partner-primary-btn" data-start-order="${e(order.id)}"><i class="fa-solid fa-play"></i> Bắt đầu làm</button>`
        : '<span class="order-status pending">Chờ khách thanh toán</span>'
    } else if (order.status === 'PROCESSING') {
      action = `${order.completion_image_url
          ? `<a href="${e(FW_API.imageUrl(order.completion_image_url))}" target="_blank" rel="noopener">Xem ảnh minh chứng đã lưu</a>`
          : '<span class="small text-muted-fw">Chưa có ảnh minh chứng</span>'}
        <label class="small w-100">Ảnh hoa hoàn thành (JPG/PNG, tối đa 2 MB)
          <input class="form-control form-control-sm mt-1" type="file" accept="image/jpeg,image/png" data-completion-image="${e(order.id)}">
        </label>
        <button type="button" class="partner-secondary-btn" data-save-proof="${e(order.id)}"><i class="fa-regular fa-image"></i> Lưu ảnh hoàn thành</button>
        <button type="button" class="partner-primary-btn" data-ship-order="${e(order.id)}" data-proof-saved="${order.completion_image_url ? 'true' : 'false'}"><i class="fa-solid fa-truck"></i> Bắt đầu giao</button>`
    } else {
      action = `<span class="order-status shipping"><i class="fa-solid fa-truck"></i> Đang vận chuyển</span>
        ${order.completion_image_url ? `<a href="${e(FW_API.imageUrl(order.completion_image_url))}" target="_blank" rel="noopener">Xem ảnh hoàn thành</a>` : ''}`
    }
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
      orders = mine.filter((order) => order.status === 'PENDING' || order.status === 'PROCESSING' || order.status === 'SHIPPING')
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
    if (button) {
      button.disabled = true
      try {
        await callServer(`/api/partner/orders/${button.dataset.acceptOrder}/accept`, { method: 'POST' })
        FW.toast('Đã nhận đơn. Đơn hàng đã chuyển sang trạng thái Đang chuẩn bị.')
      } catch (error) {
        FW.toast(error.message)
      }
      await loadOrders()
      return
    }

    const startButton = event.target.closest('[data-start-order]')
    if (startButton) {
      startButton.disabled = true
      try {
        await callServer(`/api/partner/orders/${startButton.dataset.startOrder}/start`, { method: 'POST' })
        FW.toast('Đã bắt đầu thực hiện đơn thiết kế riêng.')
      } catch (error) {
        FW.toast(error.message)
      }
      await loadOrders()
      return
    }

    const proofButton = event.target.closest('[data-save-proof]')
    if (proofButton) {
      const fileInput = document.querySelector(`[data-completion-image="${proofButton.dataset.saveProof}"]`)
      const file = fileInput.files[0]
      if (!file) {
        FW.toast('Chọn ảnh hoa hoàn thành trước khi lưu.')
        fileInput.focus()
        return
      }
      if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) {
        FW.toast('Ảnh minh chứng phải là JPG hoặc PNG và không vượt quá 2 MB.')
        return
      }
      proofButton.disabled = true
      try {
        const upload = await FW_API.uploadImage(file)
        await callServer(`/api/partner/orders/${proofButton.dataset.saveProof}/proof`, {
          method: 'POST',
          body: JSON.stringify({ completion_image_url: upload.url }),
        })
        FW.toast('Đã lưu ảnh hoa hoàn thành.')
      } catch (error) {
        FW.toast(error.message)
      }
      await loadOrders()
      return
    }

    const shipButton = event.target.closest('[data-ship-order]')
    if (!shipButton) return
    if (shipButton.dataset.proofSaved !== 'true') {
      FW.toast('Chưa có minh chứng hoàn thành.')
      return
    }
    shipButton.disabled = true
    try {
      await callServer(`/api/partner/orders/${shipButton.dataset.shipOrder}/ship`, { method: 'POST' })
      FW.toast('Đã bàn giao đơn cho đơn vị vận chuyển.')
    } catch (error) {
      FW.toast(error.message)
    }
    await loadOrders()
  })

  void loadOrders()
})()
