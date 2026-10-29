(function () {
  'use strict'

  function wirePartnerNavigation() {
    const sidebar = document.querySelector('.sidebar')
    if (!sidebar) return

    const links = [
      { item: '.nav-item.all', label: 'Tổng quan', path: 'partner/dashboard.html', icon: 'fa-border-all', nav: 'dashboard' },
      { item: '.nav-item.order-history', label: 'Quản lý đơn hàng', path: 'partner/orders.html', icon: 'fa-box-archive', nav: 'orders' },
      { item: '.nav-item.design', label: 'Diễn đàn yêu cầu', path: 'design/forum.html', icon: 'fa-palette', nav: 'forum' },
      { item: '.nav-item.sent-quotes', label: 'Báo giá đã gửi', path: 'design/sent-quotes.html', icon: 'fa-file-invoice-dollar', nav: 'sent-quotes' },
      { item: '.nav-item.complaint', label: 'Sản phẩm của tôi', path: 'partner/products.html', icon: 'fa-seedling', nav: 'products' },
      { item: '.nav-item.partner-complaints', label: 'Khiếu nại', path: 'partner/complaints.html', icon: 'fa-solid fa-person-circle-exclamation', nav: 'complaints' },
    ]
    const current = document.body.dataset.partnerNav

    const designRow = sidebar.querySelector('.nav-item.design')
    if (designRow && !sidebar.querySelector('.nav-item.sent-quotes')) {
      designRow.insertAdjacentHTML('afterend', '<li class="nav-item sent-quotes"></li>')
    }

    const complaintRow = sidebar.querySelector('.nav-item.complaint');
    if (complaintRow && !sidebar.querySelector('.nav-item.partner-complaints')) {
      complaintRow.insertAdjacentHTML('afterend', '<li class="nav-item partner-complaints"></li>');
    }

    links.forEach(({ item, label, path, icon, nav }) => {
      const row = sidebar.querySelector(item)
      if (!row) return
      row.classList.toggle('selected', nav === current)
      row.innerHTML = `
        <a href="${FW.url(path)}" ${nav === current ? 'aria-current="page"' : ''}>
          <i class="fa-solid ${icon}" aria-hidden="true"></i>
          <span>${label}</span>
        </a>
      `
    })

    const type = sidebar.querySelector('.user-type')
    if (type) type.textContent = 'Đối tác'
    const username = sidebar.querySelector('.username')
    if (username) username.textContent = 'Florist Thảo Điền'
    const rank = sidebar.querySelector('.user-rank')
    if (rank) rank.textContent = 'Cửa hàng cấp 2'
  }

  document.addEventListener('fw:partials-loaded', wirePartnerNavigation)
  if (document.querySelector('.sidebar')) wirePartnerNavigation()
})()
