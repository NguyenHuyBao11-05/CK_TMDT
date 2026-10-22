// AD05, QL05 — thống kê đơn hàng và doanh thu.
(function () {
  'use strict'

  const STATUS = [
    { key: 'PENDING', label: 'Chờ xử lý', color: 'var(--fw-peach)' },
    { key: 'PROCESSING', label: 'Đã xử lý', color: 'var(--fw-sage)' },
    { key: 'SHIPPING', label: 'Đang giao', color: 'var(--fw-forest)' },
    { key: 'RECEIVED', label: 'Đã nhận', color: 'var(--fw-sage-soft)' },
    { key: 'CANCELLED', label: 'Đã huỷ', color: 'var(--fw-peach-dark)' },
  ]
  const fromDate = document.getElementById('fromDate')
  const toDate = document.getElementById('toDate')
  const partnerFilter = document.getElementById('partnerFilter')
  const emptyRow = (cols) => `<tr><td colspan="${cols}" class="text-center text-muted-fw py-4">Không có dữ liệu</td></tr>`
  const toInputDate = (date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
  const parseInputDate = (value) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  function daysInRange() {
    const days = []
    const day = parseInputDate(fromDate.value)
    const end = parseInputDate(toDate.value)
    while (day <= end) {
      days.push(toInputDate(day))
      day.setDate(day.getDate() + 1)
    }
    return days
  }

  function renderOrderStats(data) {
    const counts = Object.fromEntries(data.status_counts.map((item) => [item.status, item.count]))
    document.getElementById('statTotal').textContent = data.total_orders
    document.getElementById('statPending').textContent = counts.PENDING || 0
    document.getElementById('statReceived').textContent = counts.RECEIVED || 0
    document.getElementById('statCancelled').textContent = counts.CANCELLED || 0

    const dailyCounts = Object.fromEntries(data.daily_counts.map((item) => [item.day, item.count]))
    FW.renderStatsChart('orderChart', daysInRange().map((day) => ({ day, value: dailyCounts[day] || 0 })),
      String, 'Số đơn hàng theo ngày')

    document.getElementById('statusList').innerHTML = data.total_orders ? STATUS.map((status) => {
      const value = counts[status.key] || 0
      const percent = Math.round((value / data.total_orders) * 100)
      return `
        <div>
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="small fw-semibold">${status.label}</span>
            <span class="small text-muted-fw">${value} đơn · ${percent}%</span>
          </div>
          <div class="progress" style="height: 10px; border-radius: 999px;">
            <div class="progress-bar" style="width: ${percent}%; background: ${status.color};"></div>
          </div>
        </div>`
    }).join('') : '<p class="text-muted-fw mb-0">Không có dữ liệu</p>'

    document.getElementById('orderTable').innerHTML = data.partner_counts.length ? data.partner_counts.map((partner) => `
      <tr>
        <td class="fw-semibold">${FW.escapeHtml(partner.partner_name)}</td>
        <td>${partner.total_orders}</td>
        <td>${partner.processing_orders}</td>
        <td>${partner.received_orders}</td>
        <td>${partner.cancelled_orders}</td>
      </tr>`).join('') : emptyRow(5)

    const selected = partnerFilter.value
    partnerFilter.innerHTML = '<option value="">Tất cả Đối tác</option>' + data.partners.map((partner) =>
      `<option value="${partner.id}">${FW.escapeHtml(partner.name)}</option>`).join('')
    if (data.partners.some((partner) => String(partner.id) === selected)) partnerFilter.value = selected
  }

  function renderRevenueStats(data) {
    document.getElementById('statRevenue').textContent = FW.formatVnd(Number(data.total_revenue))
    document.getElementById('statDone').textContent = data.order_count
    document.getElementById('statAverage').textContent = FW.formatVnd(Number(data.average_order_value))

    const dailyRevenue = Object.fromEntries(data.daily_revenue.map((item) => [item.day, Number(item.revenue)]))
    FW.renderStatsChart('revenueChart', daysInRange().map((day) => ({ day, value: dailyRevenue[day] || 0 })),
      (value) => (value / 1000000).toFixed(1) + 'tr', 'Doanh thu theo ngày')

    document.getElementById('revenueTable').innerHTML = data.partner_revenue.length ? data.partner_revenue.map((partner) => {
      const share = data.total_revenue ? Math.round((Number(partner.revenue) / Number(data.total_revenue)) * 100) : 0
      return `
        <tr>
          <td class="fw-semibold">${FW.escapeHtml(partner.partner_name)}</td>
          <td>${partner.order_count}</td>
          <td>${FW.formatVnd(Number(partner.revenue))}</td>
          <td>${share}%</td>
        </tr>`
    }).join('') : emptyRow(4)
  }

  async function load() {
    if (fromDate.value > toDate.value) {
      FW.toast('Ngày bắt đầu phải trước ngày kết thúc.')
      return
    }
    const params = { from: fromDate.value, to: toDate.value }
    try {
      if (document.body.dataset.role === 'manager') {
        renderRevenueStats(await FW_API.getAdminRevenueStats(params))
      } else {
        if (partnerFilter.value) params.partnerId = partnerFilter.value
        renderOrderStats(await FW_API.getAdminOrderStats(params))
      }
    } catch (error) {
      FW.toast(error.message)
    }
  }

  const today = new Date()
  const start = new Date()
  start.setDate(today.getDate() - 6)
  fromDate.value = toInputDate(start)
  toDate.value = toInputDate(today)

  document.getElementById('filterButton').addEventListener('click', load)
  document.addEventListener('change', (event) => {
    if (event.target.id === 'roleSwitch') setTimeout(load, 0)
  })
  load()
})()
