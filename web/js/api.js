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
  }
})()
