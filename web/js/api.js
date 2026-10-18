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
      const line = { product_id: null, quote_id: quoteId, name: 'Thiết kế riêng theo yêu cầu', partner_name: 'Florist Thảo Điền Atelier',
        thumbnail_url: img('lily-of-valley.jpg'), unit_price: 1800000, quantity: 1 }
      return fake({ lines: [line], subtotal: 1800000, voucher_code: null, discount: 0, total: 1800000 })
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
      return fake({
        summary: [
          { label: 'Đơn đang xử lý', value: 28, unit: 'đơn', trend: '+6%', icon: 'fa-box-open', tone: 'forest' },
          { label: 'Doanh thu tháng', value: 182000000, unit: 'đ', trend: '+12%', icon: 'fa-wallet', tone: 'rose' },
          { label: 'Mẫu hoa đang bán', value: 36, unit: 'sản phẩm', trend: '+4%', icon: 'fa-seedling', tone: 'gold' },
          { label: 'Tỷ lệ hoàn thành', value: 94, unit: '%', trend: '+3%', icon: 'fa-chart-line', tone: 'blue' },
        ],
        orders: [
          { id: '#FW-1014', customer: 'Nguyễn Thị Lan', item: 'Bó hoa cưới pastel', total: 1800000, status: 'PENDING', time: '20 phút trước' },
          { id: '#FW-1015', customer: 'Lê Gia Huy', item: 'Lẵng hoa khai trương', total: 2950000, status: 'PROCESSING', time: '1 giờ trước' },
          { id: '#FW-1016', customer: 'Trần Minh Anh', item: 'Giỏ hoa sự kiện', total: 2200000, status: 'SHIPPING', time: '2 giờ trước' },
        ],
      })
    },

    getPartnerOrders() {
      return fake([
        { id: '#FW-1008', customer: 'Phạm Thu Hảo', item: 'Bó hoa cưới hồng pastel', total: 1850000, status: 'PENDING', date: '14/10/2026', action: 'Xác nhận đơn' },
        { id: '#FW-1007', customer: 'Minh Khang', item: 'Giỏ hoa sinh nhật tone vàng', total: 750000, status: 'PENDING', date: '14/10/2026', action: 'Xác nhận đơn' },
        { id: '#FW-1006', customer: 'Ngọc Trâm', item: 'Bình hoa Tulip Cát tường', total: 2100000, status: 'PENDING', date: '14/10/2026', action: 'Xác nhận đơn' },
        { id: '#FW-1009', customer: 'Nguyễn Huy Bảo', item: 'Lẵng hoa sinh nhật', total: 2100000, status: 'PROCESSING', date: '15/10/2026', action: 'Đang thực hiện' },
        { id: '#FW-1013', customer: 'Lê Minh Phương', item: 'Bó Tulip Trắng Serenity 21 cành', total: 1450000, status: 'PROCESSING', date: '15/10/2026', action: 'Cập nhật ảnh hoàn thành' },
        { id: '#FW-1010', customer: 'Võ Minh Tâm', item: 'Bình hoa tươi', total: 1320000, status: 'SHIPPING', date: '15/10/2026', action: 'Cập nhật giao hàng' },
        { id: '#FW-1011', customer: 'Đặng Thảo My', item: 'Giỏ hoa khai trương', total: 2600000, status: 'RECEIVED', date: '12/10/2026', action: 'Xem chi tiết' },
        { id: '#FW-1012', customer: 'Trần Thanh Tùng', item: 'Bó hoa mừng thành công', total: 1500000, status: 'CANCELLED', date: '10/10/2026', action: 'Xem lý do' },
      ])
    },

    getPartnerProducts() {
      return fake([
        { id: 21, partner_id: 2, name: 'Bó Hoa Tulip Pastel Mơ Mộng', material: 'Hoa thật', description: 'Bó tulip tone pastel tươi mới, thích hợp làm quà tặng.', price: 850000, discount_price: null, stock_quantity: 15, thumbnail_url: img('white-tulips.jpg'), status: 'APPROVED', approved_by: 1, approved_at: '2026-10-10 10:00:00', reject_reason: null, created_at: '2026-10-01 09:00:00', updated_at: '2026-10-10 10:00:00' },
        { id: 22, partner_id: 2, name: 'Giỏ Hoa Hồng Juliet Quý Phái', material: 'Hoa thật', description: 'Giỏ hoa hồng Juliet thanh lịch.', price: 1450000, discount_price: 1290000, stock_quantity: 8, thumbnail_url: img('sunshine-basket.jpg'), status: 'APPROVED', approved_by: 1, approved_at: '2026-10-10 10:00:00', reject_reason: null, created_at: '2026-10-02 09:00:00', updated_at: '2026-10-10 10:00:00' },
        { id: 23, partner_id: 2, name: 'Kệ Khai Trương Cam Có Hội Sunburst', material: 'Hoa thật', description: 'Kệ hoa khai trương màu cam vàng rực rỡ.', price: 2800000, discount_price: null, stock_quantity: 3, thumbnail_url: img('grand-opening.jpg'), status: 'APPROVED', approved_by: 1, approved_at: '2026-10-11 10:00:00', reject_reason: null, created_at: '2026-10-03 09:00:00', updated_at: '2026-10-11 10:00:00' },
        { id: 24, partner_id: 2, name: 'Bình Cắm Tú Cầu Xanh Lam Nhật Bản', material: 'Hoa nhung', description: 'Bình hoa xanh lam dùng trang trí không gian.', price: 1890000, discount_price: null, stock_quantity: 20, thumbnail_url: img('green-hydrangea.jpg'), status: 'APPROVED', approved_by: 1, approved_at: '2026-10-11 10:00:00', reject_reason: null, created_at: '2026-10-04 09:00:00', updated_at: '2026-10-11 10:00:00' },
        { id: 25, partner_id: 2, name: 'Bó Cúc Tana Tinh Khôi & Baby Trắng', material: 'Hoa giấy', description: 'Bó hoa giấy trắng phong cách nhẹ nhàng.', price: 420000, discount_price: null, stock_quantity: 0, thumbnail_url: img('yellow-basket.jpg'), status: 'APPROVED', approved_by: 1, approved_at: '2026-10-12 10:00:00', reject_reason: null, created_at: '2026-10-05 09:00:00', updated_at: '2026-10-12 10:00:00' },
        { id: 26, partner_id: 2, name: 'Chậu Lan Hồ Điệp Hoàng Gia 9 Cành VIP', material: 'Hoa thật', description: 'Chậu lan hồ điệp sang trọng.', price: 3950000, discount_price: null, stock_quantity: 3, thumbnail_url: img('lily-of-valley.jpg'), status: 'PENDING', approved_by: null, approved_at: null, reject_reason: null, created_at: '2026-10-14 09:00:00', updated_at: '2026-10-14 09:00:00' },
      ])
    },

    getPartnerApprovals() {
      return fake([
        { id: 'PT-014', shop: 'Florist Thảo Điền Atelier', owner: 'Nguyễn Huy Bảo', city: 'TP.HCM', submitted: '12/10/2026', score: 'Rất tốt', risk: 'Thấp' },
        { id: 'PT-015', shop: 'Lan Tỏa Floral', owner: 'Trần Hoài My', city: 'Đà Nẵng', submitted: '13/10/2026', score: 'Đạt', risk: 'Trung bình' },
        { id: 'PT-016', shop: 'Mộc Lan Studio', owner: 'Lý Gia Hân', city: 'Hà Nội', submitted: '14/10/2026', score: 'Cần bổ sung', risk: 'Cao' },
      ])
    },

    getProductApprovals() {
      return fake([
        { id: 81, partner_id: 2, name: 'Bình Tulip Trắng Hà Lan', material: 'Hoa thật', description: 'Bình tulip trắng cắm thủ công.', price: 1850000, discount_price: null, stock_quantity: 10, thumbnail_url: img('white-tulips.jpg'), status: 'PENDING', approved_by: null, approved_at: null, reject_reason: null, created_at: '2026-10-14 09:00:00', updated_at: '2026-10-14 09:00:00' },
        { id: 82, partner_id: 3, name: 'Hộp Hoa Mùa Điệp Lên Đèn', material: 'Hoa thật', description: 'Hộp hoa phối màu mùa thu.', price: 1250000, discount_price: null, stock_quantity: 8, thumbnail_url: img('red-roses.jpg'), status: 'PENDING', approved_by: null, approved_at: null, reject_reason: null, created_at: '2026-10-14 10:00:00', updated_at: '2026-10-14 10:00:00' },
        { id: 83, partner_id: 4, name: 'Kệ Khai Trương Tường 2 Tầng', material: 'Hoa thật', description: 'Kệ hoa khai trương tông màu rực rỡ.', price: 2700000, discount_price: null, stock_quantity: 5, thumbnail_url: img('grand-opening.jpg'), status: 'PENDING', approved_by: null, approved_at: null, reject_reason: null, created_at: '2026-10-13 09:00:00', updated_at: '2026-10-13 09:00:00' },
        { id: 84, partner_id: 5, name: 'Hoa Cưới Cổ Điển Pure Peony', material: 'Hoa thật', description: 'Hoa cưới phong cách cổ điển.', price: 2100000, discount_price: null, stock_quantity: 6, thumbnail_url: img('lily-of-valley.jpg'), status: 'PENDING', approved_by: null, approved_at: null, reject_reason: null, created_at: '2026-10-13 11:00:00', updated_at: '2026-10-13 11:00:00' },
        { id: 85, partner_id: 6, name: 'Giỏ Hoa Nắng Ban Mai', material: 'Hoa nhung', description: 'Giỏ hoa tone vàng cam.', price: 950000, discount_price: null, stock_quantity: 4, thumbnail_url: img('sunshine-basket.jpg'), status: 'REJECTED', approved_by: 1, approved_at: '2026-10-12 11:00:00', reject_reason: 'Vui lòng bổ sung ảnh đại diện rõ nét.', created_at: '2026-10-12 09:00:00', updated_at: '2026-10-12 11:00:00' },
      ])
    },

    getPartnerStats() {
      return fake({
        gross: 182000000,
        orders: 726,
        completion: 94,
        pendingApprovals: 12,
        monthly: [42, 58, 66, 71, 83, 78, 91],
        byStatus: {
          pending: 18,
          processing: 26,
          shipping: 21,
          received: 63,
          cancelled: 7,
        },
      })
    },
  }
})()

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
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        'X-User-Id': mockUserId(),
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
  getAdminLogs(params) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value != null) query.set(key, value)
    })
    return callServer('/api/admin/logs?' + query)
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
})
