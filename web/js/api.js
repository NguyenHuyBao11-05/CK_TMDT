/* =====================================================================
   api.js — MỌI chỗ lấy dữ liệu đều đi qua đây.
   Hiện tại trả DỮ LIỆU GIẢ. Khi có backend Spring Boot, chỉ cần sửa thân
   từng hàm thành fetch('/api/...') — các trang không phải sửa gì.

   Tên field bám theo docs/schema.sql: view v_best_seller_products / v_new_products
   (id, name, material, price, discount_price, thumbnail_url, ...),
   cộng partner_name & rating mà API sẽ join từ users / reviews.
   Cần load SAU common.js (dùng FW.url).
   ===================================================================== */
(function () {
  'use strict'

  const img = (file) => FW.url(`images/flowers/${file}`)

  // material khớp giá trị gợi ý trong schema: 'Hoa thật' | 'Hoa nhung' | 'Hoa giấy'
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

  // Giả lập độ trễ mạng để giao diện "đang tải" hiện ra giống thật
  const fake = (data) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), 150))

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
  }
})()
