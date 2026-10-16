(function () {
  'use strict'

  const PARTNERS = ['Florist Thảo Điền Atelier', 'Tiệm Hoa Nắng Ban Mai', 'Nhiên Floral Art']

  const ORDER_SEED = [
    [0, 'PENDING', null, 850000], [0, 'PENDING', null, 1450000], [0, 'PROCESSING', 0, 1890000],
    [1, 'PROCESSING', 1, 2100000], [1, 'SHIPPING', 0, 1250000], [1, 'RECEIVED', 2, 990000],
    [2, 'RECEIVED', 0, 2150000], [2, 'RECEIVED', 1, 1680000], [2, 'CANCELLED', null, 750000],
    [3, 'SHIPPING', 2, 3200000], [3, 'RECEIVED', 0, 1870000], [4, 'RECEIVED', 1, 2450000],
    [4, 'RECEIVED', 0, 1100000], [5, 'RECEIVED', 2, 1450000], [5, 'CANCELLED', null, 890000],
    [6, 'RECEIVED', 0, 2950000], [6, 'RECEIVED', 1, 1800000], [8, 'RECEIVED', 0, 1600000],
    [9, 'RECEIVED', 2, 2200000], [10, 'CANCELLED', null, 1300000], [12, 'RECEIVED', 1, 3950000],
  ]

  const STATUS = [
    { key: 'PENDING', label: 'Chờ xử lý', color: 'var(--fw-peach)' },
    { key: 'PROCESSING', label: 'Đã xử lý', color: 'var(--fw-sage)' },
    { key: 'SHIPPING', label: 'Đang giao', color: 'var(--fw-forest)' },
    { key: 'RECEIVED', label: 'Đã nhận', color: '#8ab8c8' },
    { key: 'CANCELLED', label: 'Đã huỷ', color: '#d3a29c' },
  ]

  const toInputDate = (date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
  const daysAgo = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d }

  const orders = ORDER_SEED.map(([ago, status, partner, total], index) => ({
    id: 1100 + index,
    date: toInputDate(daysAgo(ago)),
    status,
    partner_name: partner === null ? null : PARTNERS[partner],
    total,
  }))

  const fromDate = document.getElementById('fromDate')
  const toDate = document.getElementById('toDate')
  const partnerFilter = document.getElementById('partnerFilter')

  const emptyRow = (cols) => `<tr><td colspan="${cols}" class="text-center text-muted-fw py-4">Không có dữ liệu</td></tr>`
  const shortDate = (value) => value.slice(8, 10) + '/' + value.slice(5, 7)

  function daysInRange() {
    const days = []
    const d = new Date(fromDate.value)
    const end = new Date(toDate.value)
    while (d <= end && days.length < 62) {
      days.push(toInputDate(d))
      d.setDate(d.getDate() + 1)
    }
    return days
  }

  function renderBars(id, values, format) {
    const box = document.getElementById(id)
    const max = Math.max(...values.map((v) => v.value))
    if (!values.length || max === 0) {
      box.innerHTML = '<div class="w-100 text-center text-muted-fw align-self-center">Không có dữ liệu</div>'
      return
    }
    box.innerHTML = values.map((v) => `
      <div class="d-flex flex-column align-items-center justify-content-end flex-fill" title="${FW.escapeHtml(shortDate(v.day) + ': ' + format(v.value))}">
        <span class="d-block mb-1 text-muted-fw" style="font-size: 11px;">${v.value ? FW.escapeHtml(format(v.value)) : ''}</span>
        <span class="d-block w-100 rounded-top" style="height: ${(v.value / max) * 150}px; background: linear-gradient(180deg, #86a98a 0%, #3f6b4e 100%);"></span>
        <span class="d-block mt-1 text-muted-fw" style="font-size: 11px;">${shortDate(v.day)}</span>
      </div>
    `).join('')
  }

  function inRange(list) {
    return list.filter((o) => o.date >= fromDate.value && o.date <= toDate.value)
  }

  function renderOrderStats() {
    let list = inRange(orders)
    if (partnerFilter.value) list = list.filter((o) => o.partner_name === partnerFilter.value)
    const count = (status) => list.filter((o) => o.status === status).length

    document.getElementById('statTotal').textContent = list.length
    document.getElementById('statPending').textContent = count('PENDING')
    document.getElementById('statReceived').textContent = count('RECEIVED')
    document.getElementById('statCancelled').textContent = count('CANCELLED')

    renderBars('orderChart', daysInRange().map((day) => ({ day, value: list.filter((o) => o.date === day).length })), (v) => String(v))

    document.getElementById('statusList').innerHTML = list.length ? STATUS.map((s) => {
      const value = count(s.key)
      const percent = Math.round((value / list.length) * 100)
      return `
        <div>
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="small fw-semibold">${s.label}</span>
            <span class="small text-muted-fw">${value} đơn · ${percent}%</span>
          </div>
          <div class="progress" style="height: 10px; border-radius: 999px;">
            <div class="progress-bar" style="width: ${percent}%; background: ${s.color};"></div>
          </div>
        </div>`
    }).join('') : '<p class="text-muted-fw mb-0">Không có dữ liệu</p>'

    const groups = [...PARTNERS, null].map((name) => {
      const own = list.filter((o) => o.partner_name === name)
      return {
        name: name || 'Chưa có Đối tác nhận',
        total: own.length,
        working: own.filter((o) => o.status === 'PROCESSING' || o.status === 'SHIPPING').length,
        received: own.filter((o) => o.status === 'RECEIVED').length,
        cancelled: own.filter((o) => o.status === 'CANCELLED').length,
      }
    }).filter((g) => g.total > 0)

    document.getElementById('orderTable').innerHTML = groups.length ? groups.map((g) => `
      <tr>
        <td class="fw-semibold">${FW.escapeHtml(g.name)}</td>
        <td>${g.total}</td>
        <td>${g.working}</td>
        <td>${g.received}</td>
        <td>${g.cancelled}</td>
      </tr>`).join('') : emptyRow(5)
  }

  function renderRevenueStats() {
    const done = inRange(orders).filter((o) => o.status === 'RECEIVED')
    const revenue = done.reduce((sum, o) => sum + o.total, 0)

    document.getElementById('statRevenue').textContent = FW.formatVnd(revenue)
    document.getElementById('statDone').textContent = done.length
    document.getElementById('statAverage').textContent = FW.formatVnd(done.length ? Math.round(revenue / done.length) : 0)

    renderBars('revenueChart', daysInRange().map((day) => ({
      day,
      value: done.filter((o) => o.date === day).reduce((sum, o) => sum + o.total, 0),
    })), (v) => (v / 1000000).toFixed(1) + 'tr')

    const rows = PARTNERS.map((name) => {
      const own = done.filter((o) => o.partner_name === name)
      const total = own.reduce((sum, o) => sum + o.total, 0)
      return { name, count: own.length, total, share: revenue ? Math.round((total / revenue) * 100) : 0 }
    }).filter((r) => r.count > 0).sort((a, b) => b.total - a.total)

    document.getElementById('revenueTable').innerHTML = rows.length ? rows.map((r) => `
      <tr>
        <td class="fw-semibold">${FW.escapeHtml(r.name)}</td>
        <td>${r.count}</td>
        <td>${FW.formatVnd(r.total)}</td>
        <td>${r.share}%</td>
      </tr>`).join('') : emptyRow(4)
  }

  function render() {
    if (fromDate.value > toDate.value) {
      FW.toast('Ngày bắt đầu phải trước ngày kết thúc.')
      return
    }
    renderOrderStats()
    renderRevenueStats()
  }

  partnerFilter.innerHTML = '<option value="">Tất cả Đối tác</option>' + PARTNERS.map((p) => `<option>${FW.escapeHtml(p)}</option>`).join('')
  fromDate.value = toInputDate(daysAgo(6))
  toDate.value = toInputDate(daysAgo(0))

  document.getElementById('filterButton').addEventListener('click', render)

  render()
})()
