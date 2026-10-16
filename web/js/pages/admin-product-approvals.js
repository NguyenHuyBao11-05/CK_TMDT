(function () {
  'use strict'

  const e = FW.escapeHtml
  const statusLabels = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối' }
  let products = []
  let activeMaterial = ''

  function renderProducts() {
    const query = document.getElementById('approvalSearch').value.trim().toLocaleLowerCase('vi')
    const visible = products.filter((product) =>
      (!activeMaterial || product.material === activeMaterial) &&
      (!query || `${product.id} ${product.partner_id} ${product.name} ${product.material}`.toLocaleLowerCase('vi').includes(query)))

    document.getElementById('productTable').innerHTML = visible.map((product) => `
      <article class="review-product-card">
        <div class="review-product-image">
          <img src="${e(product.thumbnail_url || '../images/flowers/hero-bouquet.jpg')}" alt="${e(product.name)}">
          <span>${e(product.material)}</span>
        </div>
        <div class="review-product-content">
          <span class="review-product-shop"><i class="fa-solid fa-store me-1"></i>Đối tác #${e(product.partner_id)}</span>
          <h3>${e(product.name)}</h3>
          <div class="review-product-meta"><span>Mã sản phẩm #${e(product.id)}</span><span>${e(statusLabels[product.status] || product.status)}</span></div>
          <div class="review-product-meta"><span>Giá</span><strong>${FW.formatVnd(product.price)}</strong></div>
          <div class="review-product-meta"><span>Giá ưu đãi</span><strong>${product.discount_price == null ? '—' : FW.formatVnd(product.discount_price)}</strong></div>
          <div class="review-product-note"><i class="fa-solid fa-box me-1"></i>Tồn kho: ${e(product.stock_quantity)} · ${e(product.description || 'Chưa có mô tả')}</div>
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
    document.getElementById('statPending').innerHTML = `${products.filter((product) => product.status === 'PENDING').length.toString().padStart(2, '0')} <small>mẫu</small>`
    document.getElementById('statNeedsEdit').innerHTML = `${products.filter((product) => product.status === 'REJECTED').length.toString().padStart(2, '0')} <small>mẫu</small>`
    document.querySelectorAll('[data-material]').forEach((button) => {
      const material = button.dataset.material
      const count = material ? products.filter((product) => product.material === material).length : products.length
      button.textContent = material ? `${material} (${count})` : `Tất cả (${count})`
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-material]').forEach((item) => item.classList.remove('active'))
        button.classList.add('active')
        activeMaterial = material
        renderProducts()
      })
    })
    document.getElementById('approvalSearch').addEventListener('input', renderProducts)
    document.getElementById('productTable').addEventListener('click', (event) => {
      const button = event.target.closest('[data-review-action]')
      if (!button) return
      const product = products.find((item) => item.id === Number(button.dataset.productId))
      if (!product) return
      FW.toast(button.dataset.reviewAction === 'approve'
        ? `Đã duyệt "${product.name}" cho phép mở bán.`
        : `Đã ghi nhận yêu cầu chỉnh sửa "${product.name}".`)
    })
    renderProducts()
  }

  init()
})()
