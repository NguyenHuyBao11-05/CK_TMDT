// Dashboard Đối tác, AD05, QL05 — dùng chung biểu đồ thống kê.
(function () {
  'use strict'

  function dateLabel(value) {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit' }).format(date)
  }

  FW.renderStatsChart = function (containerId, values, format, ariaLabel) {
    const container = document.getElementById(containerId)
    if (!container) return
    if (!values.length) {
      container.textContent = 'Không có dữ liệu.'
      return
    }

    const max = Math.max(...values.map((item) => Number(item.value)), 0)
    const lastIndex = values.length - 1
    const points = values.map((item, index) => {
      const x = values.length === 1 ? 355 : 36 + index * 638 / lastIndex
      const ratio = max ? Number(item.value) / max : 0
      return { x, y: 132 - ratio * 90, item }
    })
    const labelIndexes = new Set(Array.from({ length: Math.min(values.length, 7) }, (_, index) =>
      Math.round(index * lastIndex / (Math.min(values.length, 7) - 1 || 1))))
    const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')
    const areaPath = `M${points[0].x} ${points[0].y} ${points.slice(1).map((point) => `L${point.x} ${point.y}`).join(' ')} L${points[lastIndex].x} 145 L${points[0].x} 145 Z`
    const labels = points.map((point, index) => {
      if (!labelIndexes.has(index)) return ''
      const label = dateLabel(point.item.day)
      const amount = Number(point.item.value) ? format(Number(point.item.value)) : ''
      return `<g>
        <text x="${point.x}" y="164" text-anchor="middle">${FW.escapeHtml(label)}</text>
        <text class="chart-amount" x="${point.x}" y="${Math.max(point.y - 12, 12)}" text-anchor="middle">${FW.escapeHtml(amount)}</text>
      </g>`
    }).join('')

    container.innerHTML = `
      <svg viewBox="0 0 710 180" role="img" aria-label="${FW.escapeHtml(ariaLabel)}" style="display:block;width:100%;height:100%;overflow:visible">
        <defs><linearGradient id="statsChartFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style="stop-color:var(--fw-sage);stop-opacity:.28"></stop>
          <stop offset="100%" style="stop-color:var(--fw-sage);stop-opacity:0"></stop>
        </linearGradient></defs>
        <path d="${areaPath}" style="fill:url(#statsChartFill)"></path>
        <polyline points="${linePoints}" style="fill:none;stroke:var(--fw-forest);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round"></polyline>
        ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3.5" style="fill:var(--fw-surface);stroke:var(--fw-forest);stroke-width:2"></circle>`).join('')}
        <g style="fill:var(--fw-muted);font-family:var(--fw-font-sans);font-size:9px">${labels}</g>
      </svg>`
  }
})()
