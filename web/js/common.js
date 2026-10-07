(function () {
  'use strict'

  const BASE = new URL('..', document.currentScript.src).href

  const FW = {
    BASE,

    url(path) {
      return new URL(path, BASE).href
    },

    formatVnd(amount) {
      return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
    },

    escapeHtml(value) {
      return String(value ?? '')
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    },

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
              <button type="button" class="btn btn-cart" data-add-to-cart="${e(p.id)}"
                      data-name="${e(p.name)}" aria-label="Thêm ${e(p.name)} vào giỏ">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </article>`
    },

    cart: {
      items() {
        try { return JSON.parse(localStorage.getItem('fw_cart_items')) || [] } catch { return [] }
      },
      save(items) {
        try { localStorage.setItem('fw_cart_items', JSON.stringify(items)) } catch {}
        FW.cart.renderBadge()
      },
      count() {
        return FW.cart.items().reduce((n, i) => n + i.quantity, 0)
      },
      add(productId, name, quantity = 1) {
        const items = FW.cart.items()
        const line = items.find((i) => i.product_id === Number(productId) && !i.quote_id)
        if (line) line.quantity += quantity
        else items.push({ product_id: Number(productId), quantity })
        FW.cart.save(items)
        FW.toast(`Đã thêm "${name}" vào giỏ hàng`)
      },
      setQty(productId, quantity) {
        FW.cart.save(FW.cart.items().map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i)))
      },
      remove(productId) {
        FW.cart.save(FW.cart.items().filter((i) => i.product_id !== productId))
      },
      clear() { FW.cart.save([]) },
      renderBadge() {
        const badge = document.getElementById('cartCount')
        if (!badge) return
        const n = FW.cart.count()
        badge.textContent = n
        badge.hidden = n === 0
      },
    },
  }

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
