/* =====================================================================
   common.js — JS dùng chung cho MỌI trang. Gắn ở cuối <body>:
     <script src="(đường dẫn tới)js/common.js"></script>
   Việc nó làm:
     1. Chèn header/footer dùng chung vào #site-header, #site-footer
     2. Đổi data-href="..." thành link đúng, dù trang nằm ở thư mục nào
     3. Tô sáng menu theo <body data-nav="...">
     4. Cung cấp các hàm tiện ích qua đối tượng FW (FW.formatVnd, FW.toast...)
   ===================================================================== */
(function () {
  'use strict'

  // Thư mục gốc của web = thư mục cha của js/. Tính từ chính đường dẫn file này,
  // nên chạy bằng WebStorm (localhost:63342/CK_TMDT/web/...), Live Server hay
  // Spring Boot (localhost:8080/...) đều ra đúng.
  const BASE = new URL('..', document.currentScript.src).href

  const FW = {
    BASE,

    /** Đường dẫn tính từ thư mục gốc web/ → URL đầy đủ. VD: FW.url('shop/cart.html') */
    url(path) {
      return new URL(path, BASE).href
    },

    /** 1450000 → "1.450.000 đ" (giá trong CSDL là DECIMAL(12,0), đơn vị đồng) */
    formatVnd(amount) {
      return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
    },

    /** Chống chèn mã HTML khi đưa dữ liệu (tên sản phẩm, bình luận...) vào innerHTML */
    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    },

    /** Hiện thông báo nhỏ góc dưới bên phải */
    toast(message) {
      let box = document.getElementById('fwToastBox')
      if (!box) {
        box = document.createElement('div')
        box.id = 'fwToastBox'
        box.className = 'toast-container position-fixed bottom-0 end-0 p-3'
        box.setAttribute('aria-live', 'polite')
        document.body.appendChild(box)
      }
      const el = document.createElement('div')
      el.className = 'toast fw-toast align-items-center'
      el.setAttribute('role', 'status')
      el.innerHTML = `<div class="toast-body d-flex align-items-center gap-2">
        <i class="fa-solid fa-circle-check"></i>${FW.escapeHtml(message)}</div>`
      box.appendChild(el)
      const t = new bootstrap.Toast(el, { delay: 2500 })
      el.addEventListener('hidden.bs.toast', () => el.remove())
      t.show()
    },

    /**
     * Vẽ 1 thẻ sản phẩm (HTML string). Dùng ở trang chủ, danh sách sản phẩm...
     * product: { id, name, material, price, discount_price, thumbnail_url, partner_name, rating, badge }
     */
    renderProductCard(p) {
      const e = FW.escapeHtml
      const hasDiscount = p.discount_price != null && p.discount_price < p.price
      const percent = hasDiscount ? Math.round((1 - p.discount_price / p.price) * 100) : 0
      const badgeText = { best: 'Bán chạy nhất', new: 'Mới', sale: `Tiết kiệm ${percent}%` }[p.badge]
      const detailUrl = FW.url(`shop/product-detail.html?id=${encodeURIComponent(p.id)}`)

      return `
        <article class="product-card">
          <a class="product-thumb d-block" href="${detailUrl}">
            <img src="${e(p.thumbnail_url)}" alt="${e(p.name)}" loading="lazy">
            ${badgeText ? `<span class="product-badge ${e(p.badge)}">${badgeText}</span>` : ''}
            <span class="product-rating"><i class="fa-solid fa-star text-rose me-1"></i>${Number(p.rating).toFixed(1)}</span>
          </a>
          <div class="product-body">
            <div class="product-partner d-flex justify-content-between gap-2">
              <span><i class="fa-solid fa-store me-1"></i>${e(p.partner_name)}</span>
              <span>${e(p.material)}</span>
            </div>
            <h3 class="product-name"><a href="${detailUrl}">${e(p.name)}</a></h3>
            <div class="mt-auto d-flex align-items-end justify-content-between gap-2">
              <div>
                <div class="product-price-label">${hasDiscount ? 'Giá ưu đãi' : 'Giá niêm yết'}</div>
                <span class="product-price">${FW.formatVnd(hasDiscount ? p.discount_price : p.price)}</span>
                ${hasDiscount ? `<span class="product-old-price">${FW.formatVnd(p.price)}</span>` : ''}
              </div>
              <!-- KH02 - Thêm vào giỏ hàng -->
              <button type="button" class="btn btn-cart" data-add-to-cart="${e(p.id)}"
                      data-name="${e(p.name)}" aria-label="Thêm ${e(p.name)} vào giỏ">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </article>`
    },

    /**
     * Giỏ hàng TẠM (đếm số lượng trong localStorage) — chỉ để giao diện có phản hồi.
     * Khi có backend: thay bằng gọi API giỏ hàng (KH02), chỉ cần sửa trong đây.
     */
    cart: {
      count() {
        try { return Number(localStorage.getItem('fw_cart_count')) || 0 } catch { return 0 }
      },
      add(productId, name) {
        const next = FW.cart.count() + 1
        try { localStorage.setItem('fw_cart_count', String(next)) } catch { /* trình duyệt chặn lưu → bỏ qua */ }
        FW.cart.renderBadge()
        FW.toast(`Đã thêm "${name}" vào giỏ hàng`)
      },
      renderBadge() {
        const badge = document.getElementById('cartCount')
        if (!badge) return
        const n = FW.cart.count()
        badge.textContent = n
        badge.hidden = n === 0
      },
    },
  }

  // ---------- Header / footer dùng chung ----------
  async function loadPartial(slotId, file) {
    const slot = document.getElementById(slotId)
    if (!slot) return
    try {
      const res = await fetch(FW.url(file))
      if (!res.ok) throw new Error(res.status)
      slot.outerHTML = await res.text()
    } catch (err) {
      console.error(`Không tải được ${file}. Hãy mở trang qua web server (WebStorm / Live Server), không mở trực tiếp file://`, err)
    }
  }

  // Đổi data-href="shop/cart.html" → href đầy đủ
  function resolveLinks(root = document) {
    root.querySelectorAll('[data-href]').forEach((a) => {
      a.href = FW.url(a.dataset.href)
    })
  }

  function highlightNav() {
    const current = document.body.dataset.nav
    if (!current) return
    document.querySelectorAll(`[data-nav="${current}"]`).forEach((a) => {
      a.classList.add('active')
      a.setAttribute('aria-current', 'page')
    })
  }

  function wireHeader() {
    // KH01 - Tìm kiếm bó hoa → trang danh sách kèm từ khoá
    const form = document.getElementById('headerSearch')
    form?.addEventListener('submit', (e) => {
      e.preventDefault()
      const q = form.q.value.trim()
      location.href = FW.url('shop/products.html' + (q ? `?q=${encodeURIComponent(q)}` : ''))
    })

    document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
      e.preventDefault()
      e.target.reset()
      FW.toast('Cảm ơn bạn đã đăng ký nhận tin!')
    })

    FW.cart.renderBadge()
  }

  // Nút "thêm vào giỏ" ở bất kỳ đâu (kể cả thẻ được vẽ sau bằng JS)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]')
    if (btn) FW.cart.add(btn.dataset.addToCart, btn.dataset.name)
  })

  async function init() {
    await Promise.all([
      loadPartial('site-header', 'partials/header.html'),
      loadPartial('site-footer', 'partials/footer.html'),
      loadPartial('sidebar', 'partials/portal-sidebar.html'),
    ])
    resolveLinks()
    highlightNav()
    wireHeader()
  }

  window.FW = FW
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
