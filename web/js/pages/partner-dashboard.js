// Dashboard Đối tác — tổng quan hoạt động và doanh thu 7 ngày.
(function () {
  'use strict'

  const e = FW.escapeHtml
  const statusLabels = {
    PENDING: 'Chờ xác nhận',
    PROCESSING: 'Đang cắm hoa',
    SHIPPING: 'Đang giao',
    RECEIVED: 'Đã nhận',
    CANCELLED: 'Đã huỷ',
  }
  const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPING', 'RECEIVED', 'CANCELLED']
  const money = (value) => FW.formatVnd(Number(value || 0))

  function renderStats(data) {
    const actionCount = (data.orders_by_status.PENDING || 0) + (data.orders_by_status.PROCESSING || 0)
    const cards = [
      { label: 'Doanh thu 7 ngày qua', value: money(data.revenue_last_seven_days), note: 'Chỉ tính đơn đã nhận', icon: 'fa-wallet' },
      { label: 'Sản phẩm chờ duyệt', value: data.pending_product_count + ' sản phẩm', note: 'Đang chờ Quản lý duyệt', icon: 'fa-seedling' },
      { label: 'Đơn cần xử lý', value: actionCount + ' đơn', note: 'Chờ xác nhận hoặc đang thực hiện', icon: 'fa-box-open' },
      { label: 'Tổng đơn hàng', value: Object.values(data.orders_by_status).reduce((sum, count) => sum + count, 0) + ' đơn', note: 'Tất cả trạng thái', icon: 'fa-chart-line' },
    ]
    document.getElementById('statGrid').innerHTML = cards.map((item) => `
      <article class="partner-stat-card">
        <div class="partner-stat-top"><span class="partner-stat-label">${e(item.label)}</span><span class="partner-stat-icon"><i class="fa-solid ${item.icon}"></i></span></div>
        <strong class="partner-stat-value">${e(item.value)}</strong>
        <span class="partner-stat-note">${e(item.note)}</span>
      </article>
    `).join('')
    document.getElementById('orderStatusSummary').innerHTML = statusOrder.map((status) => `
      <span class="badge rounded-pill text-bg-light me-2 mb-2">${e(statusLabels[status])}: ${data.orders_by_status[status] || 0}</span>
    `).join('')
  }

  function renderChart(dailyRevenue) {
    const values = Array.from({ length: 7 }, (_, index) => {
      const day = new Date()
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - (6 - index))
      const date = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0')
      const row = dailyRevenue.find((item) => item.day === date)
      return { day: date, value: Number(row ? row.revenue : 0) }
    })
    FW.renderStatsChart('revenueChart', values, money, 'Doanh thu từng ngày trong 7 ngày gần nhất')
  }

  function renderOrders(orders) {
    const box = document.getElementById('recentOrders')
    if (!orders.length) {
      box.innerHTML = '<p class="small text-muted-fw mb-0">Hiện không có đơn cần xử lý.</p>'
      return
    }
    box.innerHTML = orders.slice(0, 5).map((order) => {
      const firstItem = order.items[0] || {}
      const image = firstItem.thumbnail_url ? FW_API.imageUrl(firstItem.thumbnail_url) : FW.url('images/flowers/hero-bouquet.jpg')
      const summary = order.items.map((item) => item.item_name + ' × ' + item.quantity).join(', ') || 'Đơn hàng'
      const created = new Date(order.created_at)
      const time = Number.isNaN(created.getTime()) ? '' : created.toLocaleString('vi-VN')
      return `
        <article class="dashboard-order-item">
          <img src="${e(image)}" alt="">
          <div class="dashboard-order-info">
            <div class="d-flex align-items-center gap-2"><strong>${e(order.order_code || ('#' + order.id))}</strong><span class="order-status ${e(order.status.toLowerCase())}">${e(statusLabels[order.status] || order.status)}</span></div>
            <strong class="dashboard-order-product">${e(summary)}</strong>
            <span class="small text-muted-fw">${e(order.customer_name)} · ${e(time)}</span>
          </div>
          <div class="dashboard-order-action">
            <strong>${money(order.total_amount)}</strong>
            <a href="orders.html" class="partner-secondary-btn">Xem chi tiết</a>
          </div>
        </article>`
    }).join('')
  }

  function renderQuotes(requests) {
    const list = requests.filter((request) => !request.has_selected).slice(0, 3)
    document.getElementById('quoteList').innerHTML = list.length ? list.map((request) => `
      <article class="dashboard-quote-item">
        <div class="d-flex justify-content-between gap-2 mb-2"><strong>YC-${request.id}</strong><span class="quote-status">${request.quote_count} báo giá</span></div>
        <strong class="dashboard-quote-name">${e(request.title)}</strong>
        <div class="dashboard-quote-foot"><span>${e(request.customer_name)}</span><strong>Ngân sách: ${money(request.budget)}</strong></div>
        <a href="../design/forum.html" class="partner-secondary-btn">Xem yêu cầu <i class="fa-solid fa-arrow-right"></i></a>
      </article>
    `).join('') : '<p class="small text-muted-fw mb-0">Hiện không có yêu cầu thiết kế mới.</p>'
  }

  async function load() {
    try {
      const [data, requests] = await Promise.all([
        FW_API.getPartnerDashboard(),
        FW_API.getForumRequests(),
      ])
      document.getElementById('partnerName').textContent = data.partner_name
      renderStats(data)
      renderChart(data.daily_revenue)
      renderOrders(data.orders_needing_action)
      renderQuotes(requests)
    } catch (error) {
      FW.toast(error.message)
      document.getElementById('statGrid').innerHTML = `<p class="text-danger">${e(error.message)}</p>`
      document.getElementById('revenueChart').textContent = 'Không tải được doanh thu.'
      document.getElementById('recentOrders').textContent = 'Không tải được danh sách đơn hàng.'
      document.getElementById('quoteList').textContent = 'Không tải được yêu cầu thiết kế.'
    }
  }

  load()
})()
