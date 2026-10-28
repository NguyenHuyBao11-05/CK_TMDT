(function () {
  'use strict'

  const img = (file) => FW.url(`images/flowers/${file}`)

  const MATERIALS = ['Hoa thật', 'Hoa nhung', 'Hoa giấy']

  const BEST_SELLERS = [
    { id: 1, name: 'Bó Hoa Cưới Mẫu Đơn White Peony & Linh Lan', material: 'Hoa thật', price: 2150000, discount_price: null, thumbnail_url: img('lily-of-valley.jpg'), partner_name: 'Florist Thảo Điền Atelier', rating: 4.9, total_sold: 128, badge: 'best' },
    { id: 2, name: 'Bình Tulip Trắng Hà Lan Royal Classic (15 cành)', material: 'Hoa thật', price: 1870000, discount_price: null, thumbnail_url: img('white-tulips.jpg'), partner_name: 'Florist Thảo Điền Atelier', rating: 4.9, total_sold: 97, badge: 'new' },
    { id: 3, name: 'Giỏ Hoa Để Bàn Sunshine Rose Tone Vàng Cam', material: 'Hoa nhung', price: 1000000, discount_price: 850000, thumbnail_url: img('sunshine-basket.jpg'), partner_name: 'Nhiên Floral Art', rating: 4.8, total_sold: 85, badge: 'sale' },
    { id: 4, name: 'Lẵng Hoa Khai Trương Phát Tài Sang Trọng', material: 'Hoa thật', price: 2450000, discount_price: null, thumbnail_url: img('grand-opening.jpg'), partner_name: "L'Amour Atelier", rating: 5.0, total_sold: 76, badge: 'best' },
    { id: 5, name: "Bó Hoa 'Hương Sắc Mùa Thu'", material: 'Hoa giấy', price: 1450000, discount_price: null, thumbnail_url: img('autumn-bowl.jpg'), partner_name: "Atelier L'Amour", rating: 4.9, total_sold: 64, badge: null },
    { id: 6, name: "Bình Gốm 'Dạ Khúc Bình Yên'", material: 'Hoa thật', price: 1890000, discount_price: null, thumbnail_url: img('pink-vase.jpg'), partner_name: 'Botanica Flora', rating: 5.0, total_sold: 58, badge: null },
    { id: 7, name: "Bó Cưới 'Pure Serenade'", material: 'Hoa nhung', price: 2150000, discount_price: null, thumbnail_url: img('wedding-serenade.jpg'), partner_name: 'Maison de Fleur', rating: 4.9, total_sold: 51, badge: null },
    { id: 8, name: "Lẵng Mây 'Ánh Nắng Ban Mai'", material: 'Hoa giấy', price: 1250000, discount_price: null, thumbnail_url: img('yellow-basket.jpg'), partner_name: 'Florist Hoàng Gia', rating: 4.8, total_sold: 47, badge: null },
  ]

  const NEW_PRODUCTS = [
    { id: 9, name: "Hộp Hoa 'Nồng Nàn Kỷ Niệm'", material: 'Hoa nhung', price: 1680000, discount_price: null, thumbnail_url: img('red-roses.jpg'), partner_name: 'Tiệm Hoa Mộc Lan', rating: 4.9, badge: 'new' },
    { id: 10, name: "Kệ Hoa 'Vươn Tầm Khởi Sắc'", material: 'Hoa thật', price: 3200000, discount_price: null, thumbnail_url: img('event-stand.jpg'), partner_name: 'Florist Atelier K', rating: 5.0, badge: 'new' },
    { id: 11, name: "Bình Thủy Tinh 'Thanh Phong'", material: 'Hoa giấy', price: 1100000, discount_price: 990000, thumbnail_url: img('green-hydrangea.jpg'), partner_name: 'Serene Botanic Studio', rating: 4.9, badge: 'sale' },
    { id: 12, name: "Bó Hoa 'Hương Sắc Mùa Thu' — bản mini", material: 'Hoa thật', price: 890000, discount_price: null, thumbnail_url: img('autumn-bowl.jpg'), partner_name: "Atelier L'Amour", rating: 4.8, badge: 'new' },
  ]

  const fake = (data) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), 150))

  const ALL_PRODUCTS = [...BEST_SELLERS, ...NEW_PRODUCTS]  // NÊN
  //Nên: sau này thay = api backend
  const store = {
    get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch {  } },
  }

  const DEFAULT_VOUCHERS = [
    { code: 'GIAM10', type: 'PERCENT', value: 10, min_order: 500000, is_active: true },
    { code: 'HOA50K', type: 'AMOUNT', value: 50000, min_order: 300000, is_active: true },
  ]
  const loadVouchers = () => store.get('fw_vouchers', DEFAULT_VOUCHERS)
  function checkVoucher(code, subtotal) {
    const v = loadVouchers().find((x) => x.code === String(code).trim().toUpperCase())
    if (!v || !v.is_active) return { ok: false, message: 'Mã voucher không tồn tại hoặc đã tắt.' }
    if (subtotal < v.min_order) return { ok: false, message: `Đơn tối thiểu ${FW.formatVnd(v.min_order)} để dùng mã này.` }
    const discount = v.type === 'PERCENT' ? Math.round(subtotal * v.value / 100) : v.value
    return { ok: true, code: v.code, discount: Math.min(discount, subtotal) }
  }
  const SEED_COMMENTS = {
    1: [{ author: 'Minh Anh', content: 'Hoa tươi, giao đúng giờ, bó rất đẹp.', created_at: '2026-09-20' }],
  }
  const SEED_REVIEWS = [  // Tâm làm phần đánh giá; ở đây chỉ là dữ liệu giả để hiển thị
    { author: 'Thu Hà', rating: 5, content: 'Đúng như hình, mình rất hài lòng.', created_at: '2026-09-18' },
    { author: 'Quốc Bảo', rating: 4, content: 'Hoa đẹp, giao hơi trễ một chút.', created_at: '2026-09-10' },
  ]

  window.FW_API = {
    MATERIALS,

    // Sau này: return fetch('/api/products/best-sellers').then(r => r.json())
    getBestSellers() {
      return fake(BEST_SELLERS)
    },

    // Sau này: return fetch('/api/products/new').then(r => r.json())
    getNewProducts() {
      return fake(NEW_PRODUCTS)
    },

    //Nên — Luồng mua hàng (KH01–KH04, KH08–KH09)
    // Sau này: fetch('/api/products?q=&material=&min=&max=&sort=')
    getProducts({ q = '', materials = [], min = 0, max = Infinity, sort = 'popular' } = {}) {
      const eff = (p) => p.discount_price ?? p.price
      const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      let list = ALL_PRODUCTS.filter((p) =>
          (!q || norm(p.name + ' ' + p.partner_name).includes(norm(q))) &&
          (materials.length === 0 || materials.includes(p.material)) &&
          eff(p) >= min && eff(p) <= max)
      const by = { 'price-asc': (a, b) => eff(a) - eff(b), 'price-desc': (a, b) => eff(b) - eff(a), rating: (a, b) => b.rating - a.rating }[sort]
      if (by) list = list.sort(by)
      return fake(list)
    },
    getProductById(id) {
      return fake(ALL_PRODUCTS.find((p) => p.id === Number(id)) || null)
    },
    getProductsByIds(ids) {
      return fake(ALL_PRODUCTS.filter((p) => ids.map(Number).includes(p.id)))
    },
    // KH03 - Áp voucher. Sau này: fetch('/api/vouchers/validate', { method: 'POST', ... })
    validateVoucher(code, subtotal) {
      return fake(checkVoucher(code, subtotal))
    },

    // Quản lý voucher (admin/vouchers.html). Sau này: GET/POST/PUT/DELETE /api/vouchers
    getVouchers() { return fake(loadVouchers()) },
    saveVoucher(v) {
      const list = loadVouchers()
      const code = String(v.code).trim().toUpperCase()
      if (list.some((x) => x.code === code)) return fake({ ok: false, message: 'Mã này đã tồn tại.' })
      list.push({ code, type: v.type, value: Number(v.value), min_order: Number(v.min_order), is_active: true })
      store.set('fw_vouchers', list)
      return fake({ ok: true })
    },
    toggleVoucher(code) {
      store.set('fw_vouchers', loadVouchers().map((x) => (x.code === code ? { ...x, is_active: !x.is_active } : x)))
      return fake({ ok: true })
    },
    deleteVoucher(code) {
      store.set('fw_vouchers', loadVouchers().filter((x) => x.code !== code))
      return fake({ ok: true })
    },

    // KH04/KH09 - Tóm tắt giỏ hàng (checkout & payment dùng chung)
    // Mỗi dòng: { product_id, quote_id, name, partner_name, thumbnail_url, unit_price, quantity }
    getCartSummary() {
      const lines = FW.cart.items().map((i) => {
        const p = ALL_PRODUCTS.find((x) => x.id === i.product_id)
        return p && { product_id: p.id, quote_id: i.quote_id || null, name: p.name, partner_name: p.partner_name,
          thumbnail_url: p.thumbnail_url, unit_price: p.discount_price ?? p.price, quantity: i.quantity }
      }).filter(Boolean)
      const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0)
      let code = null, discount = 0
      try { code = localStorage.getItem('fw_voucher') } catch { /* bỏ qua */ }
      if (code) {
        const r = checkVoucher(code, subtotal)
        if (r.ok) discount = r.discount; else code = null
      }
      return fake({ lines, subtotal, voucher_code: code, discount, total: subtotal - discount })
    },

    // KH08 - Đơn từ báo giá của Bảo (1 dòng hàng có quote_id). Bảo thay bằng dữ liệu báo giá thật.
    getQuoteForPayment(quoteId) {
      return callServer('/api/design-requests/quotes/' + encodeURIComponent(quoteId) + '/payment')
    },

    // KH09 - Tạo đơn sau khi khách báo đã chuyển khoản. Sau này: POST /api/orders
    newOrderCode() { return 'FW' + String(Date.now()).slice(-6) },
    createOrder({ code, lines, recipient, voucher_code, subtotal, discount, total }) {
      const orders = store.get('fw_orders', [])
      const order = { id: orders.length + 1, code, status: 'PENDING', payment_method: 'BANK_TRANSFER',
        created_at: new Date().toISOString(), lines, recipient, voucher_code, subtotal, discount, total }
      orders.push(order)
      store.set('fw_orders', orders)
      const bought = new Set(store.get('fw_purchased', []))
      lines.forEach((l) => l.product_id && bought.add(l.product_id))
      store.set('fw_purchased', [...bought])
      return fake(order)
    },
    getOrderByCode(code) { return fake(store.get('fw_orders', []).find((o) => o.code === code) || null) },

    // Gui hoa don. Sau này: POST /api/orders/{code}/invoice
    sendInvoice(code, email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return fake({ ok: false, message: 'Email không hợp lệ.' })
      return fake({ ok: true })
    },

    // Comment. Sau này: GET/POST /api/products/{id}/comments
    canComment(productId) { return fake(store.get('fw_purchased', []).includes(Number(productId))) },
    getComments(productId) {
      const mine = store.get('fw_comments', {})[productId] || []
      return fake([...mine, ...(SEED_COMMENTS[productId] || [])])
    },
    addComment(productId, content) {
      const all = store.get('fw_comments', {})
      all[productId] = [{ author: 'Bạn', content, created_at: new Date().toISOString().slice(0, 10) }, ...(all[productId] || [])]
      store.set('fw_comments', all)
      return fake({ ok: true })
    },
    // đợi chuc nang danh gia cua Tam xong roi goi len day
    getReviews() { return fake(SEED_REVIEWS) },

    // Phong — Cổng Đối tác, kiểm duyệt & thống kê
    getPartnerDashboard() {
      return callServer('/api/partner/dashboard')
    },

    getPartnerOrders() {
      return callServer('/api/partner/orders')
    },

    getPartnerProducts() {
      return callServer('/api/partner/products')
    },

    getPartnerApprovals() {
      return callServer('/api/admin/partner-approvals')
    },

    getProductApprovals() {
      return callServer('/api/admin/product-approvals')
    },

  }
})()

// Phong — Cổng Đối tác, kiểm duyệt & thống kê
Object.assign(window.FW_API, {
  getAvailablePartnerOrders() {
    return callServer('/api/partner/orders/available')
  },
  acceptPartnerOrder(orderId) {
    return callServer(`/api/partner/orders/${orderId}/accept`, { method: 'POST' })
  },
  startPartnerOrder(orderId) {
    return callServer(`/api/partner/orders/${orderId}/start`, { method: 'POST' })
  },
  savePartnerOrderProof(orderId, completionImageUrl) {
    return callServer(`/api/partner/orders/${orderId}/proof`, {
      method: 'POST',
      body: JSON.stringify({ completion_image_url: completionImageUrl }),
    })
  },
  shipPartnerOrder(orderId) {
    return callServer(`/api/partner/orders/${orderId}/ship`, { method: 'POST' })
  },
  createPartnerProduct(data) {
    return callServer('/api/partner/products', { method: 'POST', body: JSON.stringify(data) })
  },
  updatePartnerProduct(productId, data) {
    return callServer(`/api/partner/products/${productId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  approvePartnerProduct(productId) {
    return callServer(`/api/admin/product-approvals/${productId}/approve`, { method: 'POST' })
  },
  rejectPartnerProduct(productId, reason) {
    return callServer(`/api/admin/product-approvals/${productId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },
})

// Bảo — Diễn đàn thiết kế riêng, quản trị tài khoản & nhật ký

const BAO_SERVER = 'http://localhost:8080'
const BAO_ADMIN_USER = { admin: 1, manager: 2 }

function mockUserId() {
  try {
    if (document.body.classList.contains('admin-page')) {
      return BAO_ADMIN_USER[localStorage.getItem('fw_admin_role') || 'admin']
    }
    return localStorage.getItem('fw_user_id') || 3
  } catch (e) {
    return 3
  }
}

async function callServer(path, options = {}) {
  let res
  try {
    res = await fetch(BAO_SERVER + path, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        // 'X-User-Id': mockUserId(),
        ...options.headers,
      },
    })
  } catch (e) {
    throw new Error('Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.message) || 'Có lỗi xảy ra, vui lòng thử lại.')
  return data
}

Object.assign(window.FW_API, {
  applyPartner(data) {
    return callServer('/api/partner/apply', { method: 'POST', body: JSON.stringify(data) })
  },

  getPartnerApplications() {
    return callServer('/api/admin/partner-approvals')
  },
  approvePartnerApplication(userId) {
    return callServer('/api/admin/partner-approvals/' + userId + '/approve', { method: 'POST' })
  },
  rejectPartnerApplication(userId, reason) {
    return callServer('/api/admin/partner-approvals/' + userId + '/reject', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  getAdminLogs(params) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value != null) query.set(key, value)
    })
    return callServer('/api/admin/logs?' + query)
  },
  getAdminOrderStats(params) {
    const query = new URLSearchParams(params)
    return callServer('/api/admin/stats/orders?' + query)
  },
  getAdminRevenueStats(params) {
    const query = new URLSearchParams(params)
    return callServer('/api/admin/stats/revenue?' + query)
  },
  getRecommendationModel() {
    return callServer('/api/admin/recommendations')
  },
  trainRecommendationModel() {
    return callServer('/api/admin/recommendations/train', { method: 'POST' })
  },

  getAdminUsers(params) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value != null) query.set(key, value)
    })
    return callServer('/api/admin/users?' + query)
  },
  createUser(data) {
    return callServer('/api/admin/users', { method: 'POST', body: JSON.stringify(data) })
  },
  updateUser(id, data) {
    return callServer('/api/admin/users/' + id, { method: 'PUT', body: JSON.stringify(data) })
  },
  changeUserStatus(id, status) {
    return callServer('/api/admin/users/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status }) })
  },
  resetUserPassword(id) {
    return callServer('/api/admin/users/' + id + '/reset-password', { method: 'POST' })
  },

  uploadImage(file) {
    const data = new FormData()
    data.append('file', file)
    return callServer('/api/uploads', { method: 'POST', body: data })
  },
  imageUrl(url) {
    if (!url) return FW.url('images/flowers/hero-bouquet.jpg')
    if (/^https?:/.test(url)) return url
    return url.startsWith('/uploads/') ? BAO_SERVER + url : FW.url(url)
  },
  createDesignRequest(data) {
    return callServer('/api/design-requests', { method: 'POST', body: JSON.stringify(data) })
  },
  getMyDesignRequests() {
    return callServer('/api/design-requests/mine')
  },
  cancelDesignRequest(id) {
    return callServer('/api/design-requests/' + id + '/cancel', { method: 'POST' })
  },
  getDesignRequest(id) {
    return callServer('/api/design-requests/' + id)
  },
  selectQuote(requestId, quoteId) {
    return callServer('/api/design-requests/' + requestId + '/select', { method: 'POST', body: JSON.stringify({ quote_id: quoteId }) })
  },
  confirmDesignRequest(id) {
    return callServer('/api/design-requests/' + id + '/confirm', { method: 'POST' })
  },
  getForumRequests() {
    return callServer('/api/partner/forum')
  },
  sendQuote(requestId, data) {
    return callServer('/api/partner/forum/' + requestId + '/quotes', { method: 'POST', body: JSON.stringify(data) })
  },
  getSentQuotes() {
    return callServer('/api/partner/quotes')
  },
  getNotifications() {
    return callServer('/api/notifications')
  },
  readNotification(id) {
    return callServer('/api/notifications/' + id + '/read', { method: 'POST' })
  },
  readAllNotifications() {
    return callServer('/api/notifications/read-all', { method: 'POST' })
  },
  getAdminMenuCounts() {
    return callServer('/api/admin/menu-counts')
  },
})

// Tâm — Tài khoản, hậu mãi & khiếu nại
Object.assign(window.FW_API, {
  register(data) {
    return callServer('/api/auth/register', {method: 'POST', body: JSON.stringify(data)});
  },
  verifyRegisterOtp(data) {
    return callServer('/api/auth/register/verify', {method: 'POST', body: JSON.stringify(data)});
  },
  resendRegisterOtp() {
    return callServer('/api/auth/register/resend', {method: 'POST'});
  },
  login({ email, password }) {
    return callServer('/api/auth/login', {method: 'POST', body: JSON.stringify({ email, password })});
  },
  loginGoogle: function ({token}) {
    return callServer("/api/auth/google", {method: "POST", body: JSON.stringify({token})});
  },
  me() {
    return callServer('/api/auth/me');
  },
  logout() {
    return callServer("/api/auth/logout", {method: "POST"});
  },
  forgotPassword({email}) {
    return callServer('/api/auth/forgot-password', {method: 'POST', body: JSON.stringify({ email })});
  },
  resetPassword({email, otp, password}) {
    return callServer('/api/auth/reset-password', {method: 'POST', body: JSON.stringify({email, otp, password})});
  },
})

async function loadAdminMenuCounts() {
  if (!document.querySelector('[data-menu-count]')) return
  try {
    const counts = await FW_API.getAdminMenuCounts()
    document.querySelectorAll('[data-menu-count]').forEach(function (badge) {
      const value = counts[badge.dataset.menuCount] || 0
      badge.textContent = value
      badge.hidden = value === 0
    })
  } catch (e) {}
}

document.addEventListener('fw:partials-loaded', loadAdminMenuCounts)

let currentUser = null

const ROLE_HOME = {
  CUSTOMER: { label: 'Khách hàng', page: 'account/dashboard.html' },
  PARTNER: { label: 'Đối tác', page: 'partner/dashboard.html' },
  ADMIN: { label: 'Admin', page: 'admin/statistics.html' },
  MANAGER: { label: 'Quản lý', page: 'admin/statistics.html' },
}

function isLoggedIn() {
  // return !!currentUser || document.body.classList.contains('admin-page')
  return callServer("/api/auth/me", { method: "GET" }).then(() => true).catch(() => false);
}

async function loadCurrentUser() {
  try {
    currentUser = await FW_API.me()
  } catch (e) {
    currentUser = null
  }
  if (!currentUser) return

  const home = ROLE_HOME[currentUser.role] || ROLE_HOME.CUSTOMER
  try {
    localStorage.setItem('fw_user_id', currentUser.id)
    if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') localStorage.setItem('fw_admin_role', currentUser.role.toLowerCase())
  } catch (e) {}

  document.querySelectorAll('[data-guest-link]').forEach(function (el) { el.hidden = true; el.classList.add('d-none') })
  document.querySelectorAll('[data-user-menu]').forEach(function (el) { el.hidden = false })
  document.querySelectorAll('[data-user-name]').forEach(function (el) { el.textContent = currentUser.full_name })
  document.querySelectorAll('[data-user-role]').forEach(function (el) { el.textContent = 'Đăng nhập với vai trò ' + home.label })
  document.querySelectorAll('[data-user-home]').forEach(function (el) { el.href = FW.url(home.page) })

  const avatarBox = document.getElementById('a-header-avatar')
  const avatar = document.getElementById('headerAvatar')
  if (avatarBox) avatarBox.style.display = 'block'
  if (avatar) {
    avatar.onerror = function () { avatar.onerror = null; avatar.src = FW.url('images/favicon.svg') }
    avatar.src = currentUser.avatar_url ? FW_API.imageUrl(currentUser.avatar_url) : FW.url('images/favicon.svg')
  }

  const sidebarName = document.querySelector('.sidebar .username')
  if (sidebarName) sidebarName.textContent = currentUser.full_name

  if (document.body.classList.contains('admin-page') && home.page === 'admin/statistics.html') {
    const role = currentUser.role.toLowerCase()
    document.body.dataset.role = role
    const roleSwitch = document.getElementById('roleSwitch')
    if (roleSwitch) {
      roleSwitch.value = role
      roleSwitch.closest('label').hidden = true
    }
    ;['adminUserName', 'topbarName'].forEach(function (id) {
      const el = document.getElementById(id)
      if (el) el.textContent = currentUser.full_name
    })
    const roleLabel = document.getElementById('adminUserRole')
    if (roleLabel) roleLabel.textContent = home.label
    const email = document.getElementById('topbarEmail')
    if (email) email.textContent = home.label
  }
}

document.addEventListener('click', async function (event) {
  const button = event.target.closest('[data-logout]')
  if (!button) return
  event.preventDefault()
  try {
    await FW_API.logout()
  } catch (e) {}
  try {
    localStorage.removeItem('fw_user_id')
    localStorage.removeItem('fw_admin_role')
  } catch (e) {}
  location.href = FW.url('account/login.html')
})

function timeAgo(value) {
  const minutes = Math.floor((Date.now() - new Date(value)) / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return minutes + ' phút trước'
  if (minutes < 1440) return Math.floor(minutes / 60) + ' giờ trước'
  return Math.floor(minutes / 1440) + ' ngày trước'
}

function renderNotifications(data) {
  const e = FW.escapeHtml
  document.querySelectorAll('[data-notif-count]').forEach(function (badge) {
    badge.textContent = data.unread_count > 99 ? '99+' : data.unread_count
    badge.hidden = data.unread_count === 0
  })
  const header = '<div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">'
    + '<strong class="small">Thông báo</strong>'
    + (data.unread_count ? '<button type="button" class="btn btn-link btn-sm p-0 text-decoration-none" data-notif-read-all>Đánh dấu đã đọc hết</button>' : '')
    + '</div>'
  const items = data.items.length
    ? data.items.map(function (n) {
      return '<button type="button" class="dropdown-item text-wrap py-2 border-bottom' + (n.read ? '' : ' fw-semibold') + '" data-notif-id="' + n.id + '" data-notif-link="' + e(n.link_url || '') + '"'
        + (n.read ? '' : ' style="background: var(--fw-cream, #fdf8f3)"') + '>'
        + '<div class="small">' + (n.read ? '' : '<i class="fa-solid fa-circle text-rose me-1" style="font-size: 7px; vertical-align: middle"></i>') + e(n.title) + '</div>'
        + (n.content ? '<div class="small text-muted-fw fw-normal">' + e(n.content) + '</div>' : '')
        + '<div class="text-muted-fw fw-normal" style="font-size: 11px">' + timeAgo(n.created_at) + '</div>'
        + '</button>'
    }).join('')
    : '<div class="p-3 small text-muted-fw text-center">Chưa có thông báo nào.</div>'
  document.querySelectorAll('[data-notif-menu]').forEach(function (menu) { menu.innerHTML = header + items })
}

async function loadNotifications() {
  try {
    renderNotifications(await FW_API.getNotifications())
  } catch (e) {
    document.querySelectorAll('[data-notif-menu]').forEach(function (menu) {
      menu.innerHTML = '<div class="p-3 small text-muted-fw">' + FW.escapeHtml(e.message) + '</div>'
    })
  }
}

document.addEventListener('fw:partials-loaded', async function () {
  await loadCurrentUser()
  const boxes = document.querySelectorAll('[data-notif-box]')
  if (!boxes.length || !isLoggedIn()) return
  boxes.forEach(function (box) { box.hidden = false })
  loadNotifications()
  setInterval(loadNotifications, 60000)
})

document.addEventListener('click', async function (event) {
  if (event.target.closest('[data-notif-read-all]')) {
    try {
      await FW_API.readAllNotifications()
    } catch (e) {}
    loadNotifications()
    return
  }
  const item = event.target.closest('[data-notif-id]')
  if (!item) return
  try {
    await FW_API.readNotification(item.dataset.notifId)
  } catch (e) {}
  if (item.dataset.notifLink) location.href = FW.url(item.dataset.notifLink)
  else loadNotifications()
})

document.addEventListener('change', function (event) {
  if (event.target.id === 'roleSwitch') loadNotifications()
})
