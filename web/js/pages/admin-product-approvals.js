(function () {
  'use strict'

  const e = FW.escapeHtml
  let products = []
  let activeCategory = ''

  function renderProducts() {
    const query = document.getElementById('approvalSearch').value.trim().toLowerCase()
    const visible = products.filter((product) =>
      (!activeCategory || product.category === activeCategory) &&
      (!query || `${product.id} ${product.sku} ${product.name} ${product.shop}`.toLowerCase().includes(query)))

    document.getElementById('productTable').innerHTML = visible.map((product) => `
      <article class="review-product-card">
        <div class="review-product-image">
          <img src="../images/flowers/${e(product.thumbnail)}" alt="${e(product.name)}">
          <span>${e(product.category)}</span>
        </div>
        <div class="review-product-content">
          <span class="review-product-shop"><i class="fa-solid fa-store me-1"></i>${e(product.shop)}</span>
          <h3>${e(product.name)}</h3>
          <div class="review-product-meta"><span>${e(product.sku)}</span><span>${product.images} ảnh</span></div>
          <div class="review-product-meta"><span>Giá niêm yết</span><strong>${FW.formatVnd(product.price)}</strong></div>
          <div class="review-product-meta"><span>Giá sỉ tham khảo</span><strong>${FW.formatVnd(product.wholesale_price)}</strong></div>
          <div class="review-product-note"><i class="fa-solid fa-circle-check me-1"></i>Ảnh sản phẩm rõ nét · Thông tin cửa hàng đã xác thực · ${e(product.material)}</div>
          <div class="review-product-actions">
            <button type="button" class="approve" data-review-action="approve" data-product-id="${e(product.id)}"><i class="fa-solid fa-circle-check me-1"></i>Cho phép mở bán</button>
            <button type="button" class="edit" data-review-action="edit" data-product-id="${e(product.id)}"><i class="fa-solid fa-pen me-1"></i>Yêu cầu sửa</button>
          </div>
        </div>
      </article>
    `).join('') || '<div class="partner-empty-state">Không có sản phẩm phù hợp với bộ lọc.</div>'
  }

  async function init() {
    products = await FW_API.getProductApprovals()
    document.getElementById('statPending').innerHTML = `${products.filter((product) => product.status === 'Chờ duyệt').length.toString().padStart(2, '0')} <small>mẫu</small>`
    document.getElementById('statApproved').innerHTML = '24 <small>mẫu</small>'
    document.getElementById('statNeedsEdit').innerHTML = `${products.filter((product) => product.status === 'Cần chỉnh sửa').length.toString().padStart(2, '0')} <small>mẫu</small>`
    document.querySelectorAll('[data-filter]').forEach((button) => {
      const category = button.dataset.filter
      const count = category ? products.filter((product) => product.category === category).length : products.length
      const label = category === 'Hoa sinh nhật' ? 'Sinh nhật' : category === 'Hoa khai trương' ? 'Sự kiện & Doanh nghiệp' : category || 'Tất cả'
      button.textContent = `${label} (${count})`
    })
    document.getElementById('approvalSearch').addEventListener('input', renderProducts)
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'))
      button.classList.add('active')
      activeCategory = button.dataset.filter
      renderProducts()
    }))
    document.getElementById('productTable').addEventListener('click', (event) => {
      const button = event.target.closest('[data-review-action]')
      if (!button) return
      const product = products.find((item) => item.id === button.dataset.productId)
      if (!product) return
      FW.toast(button.dataset.reviewAction === 'approve'
        ? `Đã duyệt "${product.name}" cho phép mở bán.`
        : `Đã ghi nhận yêu cầu chỉnh sửa "${product.name}".`)
    })
    renderProducts()
  }

  init()
})()
