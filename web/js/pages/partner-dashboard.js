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

  const stats = [
    { label: 'Doanh thu tháng này', value: '68.450.000đ', note: '+18,5% so với tháng trước', icon: 'fa-wallet' },
    { label: 'Đơn hàng hoàn thành', value: '142 đơn', note: '98,7% đúng tiến độ', icon: 'fa-circle-check' },
    { label: 'Yêu cầu đang thực hiện', value: '05 yêu cầu', note: '2 đang chờ xác nhận', icon: 'fa-palette' },
    { label: 'Tỷ lệ phản hồi', value: '99%', note: 'Phản hồi trung bình 12 phút', icon: 'fa-bolt' },
  ]

  function renderStats() {
    document.getElementById('statGrid').innerHTML = stats.map((item) => `
      <article class="partner-stat-card">
        <div class="partner-stat-top"><span class="partner-stat-label">${e(item.label)}</span><span class="partner-stat-icon"><i class="fa-solid ${item.icon}"></i></span></div>
        <strong class="partner-stat-value">${e(item.value)}</strong>
        <span class="partner-stat-note"><i class="fa-solid fa-arrow-trend-up"></i>${e(item.note)}</span>
      </article>
    `).join('')
  }

  function renderChart() {
    const days = [
      { label: 'T2 (19)', amount: '1,4M', point: [36, 128] },
      { label: 'T3 (20)', amount: '2,4M', point: [142, 108] },
      { label: 'T4 (21)', amount: '2,1M', point: [248, 116] },
      { label: 'T5 (22)', amount: '3,0M', point: [354, 85] },
      { label: 'T6 (23)', amount: '4,2M', point: [460, 40] },
      { label: 'T7 (24)', amount: '2,6M', point: [566, 100] },
      { label: 'CN (25)', amount: '2,3M', point: [672, 110] },
    ]
    const points = days.map((day) => day.point.join(',')).join(' ')
    const labels = days.map((day, index) => `
      <g class="${index === 4 ? 'highlight' : ''}">
        <text x="${day.point[0]}" y="164" text-anchor="middle">${day.label}</text>
        <text class="chart-amount" x="${day.point[0]}" y="${day.point[1] - 14}" text-anchor="middle">${day.amount}</text>
      </g>`).join('')
    document.getElementById('revenueChart').innerHTML = `
      <svg viewBox="0 0 710 180" role="img" aria-label="Doanh thu tăng cao nhất vào thứ sáu">
        <defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#86a98a" stop-opacity=".28"/><stop offset="100%" stop-color="#86a98a" stop-opacity="0"/></linearGradient></defs>
        <path class="chart-area" d="M${days[0].point.join(' ')} L${days.slice(1).map((day) => day.point.join(' ')).join(' L')} L672 145 L36 145 Z"></path>
        <polyline class="chart-line" points="${points}"></polyline>
        ${days.map((day, index) => `<circle class="chart-dot ${index === 4 ? 'highlight' : ''}" cx="${day.point[0]}" cy="${day.point[1]}" r="${index === 4 ? 5 : 3.5}"></circle>`).join('')}
        ${labels}
      </svg>`
  }

  function renderOrders(orders) {
    document.getElementById('recentOrders').innerHTML = orders.slice(0, 3).map((order, index) => `
      <article class="dashboard-order-item">
        <img src="${FW.escapeHtml('../images/flowers/' + ['white-tulips.jpg', 'grand-opening.jpg', 'sunshine-basket.jpg'][index])}" alt="">
        <div class="dashboard-order-info">
          <div class="d-flex align-items-center gap-2"><strong>${e(order.id)}</strong><span class="order-status ${order.status.toLowerCase()}">${e(statusLabels[order.status] || order.status)}</span></div>
          <strong class="dashboard-order-product">${e(order.item)}</strong>
          <span class="small text-muted-fw">${e(order.customer)} · ${e(order.time)}</span>
        </div>
        <div class="dashboard-order-action">
          <strong>${FW.formatVnd(order.total)}</strong>
          <a href="orders.html" class="partner-secondary-btn">Xem chi tiết</a>
        </div>
      </article>
    `).join('')
  }

  function renderQuotes() {
    const quotes = [
      { id: 'YC-8921', name: 'Bó hoa kỷ niệm 5 năm ngày cưới tone hồng pastel ngọt ngào', customer: 'Chị Lan Phương', budget: 1500000, status: 'Khách đã chốt 1 báo giá' },
      { id: 'YC-9032', name: 'Kệ hoa khai trương showroom phong cách cắm đặt tối giản', customer: 'Anh Minh Đức', budget: 2800000, status: 'Khách chưa chốt' },
      { id: 'YC-9055', name: 'Lẵng lan hồ điệp trang sang trọng sự kiện VIP', customer: 'Chị Ngọc Hà', budget: 4500000, status: 'Khách chưa chốt' },
    ]
    document.getElementById('quoteList').innerHTML = quotes.map((quote) => `
      <article class="dashboard-quote-item">
        <div class="d-flex justify-content-between gap-2 mb-2"><strong>${e(quote.id)}</strong><span class="quote-status">${e(quote.status)}</span></div>
        <strong class="dashboard-quote-name">${e(quote.name)}</strong>
        <div class="dashboard-quote-foot"><span>${e(quote.customer)}</span><strong>Ngân sách: ${FW.formatVnd(quote.budget)}</strong></div>
        <a href="orders.html#quotes" class="partner-secondary-btn">Xem yêu cầu <i class="fa-solid fa-arrow-right"></i></a>
      </article>
    `).join('')
  }

  async function load() {
    const data = await FW_API.getPartnerDashboard()
    renderStats()
    renderChart()
    renderOrders(data.orders)
    renderQuotes()
  }

  load()
})()
