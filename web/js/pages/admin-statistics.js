(function () {
  'use strict'

  const renderBars = (values) => {
    const max = Math.max(...values)
    const bars = values.map((value, index) => `
      <div class="d-flex flex-column align-items-center justify-content-end flex-fill">
        <span class="d-block mb-2 text-muted-fw small">${index + 1}</span>
        <span class="d-block w-100 rounded-top" style="height: ${(value / max) * 150}px; background: linear-gradient(180deg, #86a98a 0%, #3f6b4e 100%); min-height: 30px;"></span>
      </div>
    `).join('')
    document.getElementById('chartBars').innerHTML = bars
  }

  const renderStatus = (stats) => {
    const items = [
      { label: 'Chờ xử lý', value: stats.pending, color: 'var(--fw-peach)' },
      { label: 'Đã xử lý', value: stats.processing, color: 'var(--fw-sage)' },
      { label: 'Đang giao', value: stats.shipping, color: 'var(--fw-forest)' },
      { label: 'Đã nhận', value: stats.received, color: '#8ab8c8' },
      { label: 'Đã huỷ', value: stats.cancelled, color: '#d3a29c' },
    ]
    document.getElementById('statusList').innerHTML = items.map((item) => `
      <div>
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="small fw-semibold">${FW.escapeHtml(item.label)}</span>
          <span class="small text-muted-fw">${FW.escapeHtml(item.value)}%</span>
        </div>
        <div class="progress" style="height: 10px; border-radius: 999px;">
          <div class="progress-bar" style="width: ${item.value}%; background: ${item.color};"></div>
        </div>
      </div>
    `).join('')
  }

  async function render() {
    const stats = await FW_API.getPartnerStats()
    document.getElementById('statRevenue').textContent = FW.formatVnd(stats.gross)
    document.getElementById('statOrders').textContent = stats.orders
    document.getElementById('statCompletion').textContent = `${stats.completion}%`
    document.getElementById('statPending').textContent = stats.pendingApprovals

    renderBars(stats.monthly)
    renderStatus(stats.byStatus)

    document.getElementById('statsTable').innerHTML = [
      { label: 'Doanh thu tháng', value: FW.formatVnd(stats.gross), trend: '+12%', note: 'So với tháng trước' },
      { label: 'Đơn hàng đã giao', value: `${Math.round(stats.orders * 0.74)}`, trend: '+8%', note: 'Đạt tiến độ' },
      { label: 'Sản phẩm chờ duyệt', value: stats.pendingApprovals, trend: '2 mới', note: 'Cần xử lý trong 24h' },
    ].map((row) => `
      <tr>
        <td>${FW.escapeHtml(row.label)}</td>
        <td>${FW.escapeHtml(row.value)}</td>
        <td><span class="badge-soft green">${FW.escapeHtml(row.trend)}</span></td>
        <td class="text-muted-fw">${FW.escapeHtml(row.note)}</td>
      </tr>
    `).join('')
  }

  render()
})()