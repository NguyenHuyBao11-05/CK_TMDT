// QL02 - Kiểm duyệt sản phẩm do Đối tác đăng.
(function () {
  'use strict'

  const e = FW.escapeHtml
  const statusLabels = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối' }
  const statusBadge = { PENDING: 'gold', APPROVED: 'green', REJECTED: 'rose' }
  const rejectModal = new bootstrap.Modal(document.getElementById('rejectModal'))
  const rejectForm = document.getElementById('rejectForm')
  let products = []
  let activeMaterial = ''
  let rejectingId = null

  function renderStats() {
    const count = (status) => products.filter((product) => product.status === status).length
    document.getElementById('statPending').innerHTML = `${count('PENDING')} <small>mẫu</small>`
    document.getElementById('statApproved').innerHTML = `${count('APPROVED')} <small>mẫu</small>`
    document.getElementById('statRejected').innerHTML = `${count('REJECTED')} <small>mẫu</small>`
    document.getElementById('statTotal').innerHTML = `${products.length} <small>mẫu</small>`
  }

  function renderProducts() {
    const query = document.getElementById('approvalSearch').value.trim().toLocaleLowerCase('vi')
    const visible = products.filter((product) =>
      (!activeMaterial || product.material === activeMaterial) &&
      (!query || `${product.id} ${product.partner_id} ${product.partner_name} ${product.name} ${product.material}`.toLocaleLowerCase('vi').includes(query)))

    document.getElementById('productTable').innerHTML = visible.map((product) => {
      const images = product.image_urls || []
      const thumbnail = product.thumbnail_url || images[0] || '../images/flowers/hero-bouquet.jpg'
      return `
      <article class="review-product-card">
        <div class="review-product-image">
          <img src="${e(FW_API.imageUrl(thumbnail))}" alt="${e(product.name)}">
          <span>${e(product.material)}</span>
        </div>
        <div class="review-product-content">
          ${images.length > 1 ? `<div class="d-flex gap-1 mb-2">${images.map((url) => `<a href="${e(FW_API.imageUrl(url))}" target="_blank" rel="noopener noreferrer"><img src="${e(FW_API.imageUrl(url))}" alt="Ảnh sản phẩm ${e(product.name)}" style="width:42px;height:42px;object-fit:cover;border-radius:6px"></a>`).join('')}</div>` : ''}
          <span class="review-product-shop"><i class="fa-solid fa-store me-1"></i>${e(product.partner_name || `Đối tác #${product.partner_id}`)}</span>
          <h3>${e(product.name)}</h3>
          <div class="review-product-meta"><span>Mã sản phẩm #${e(product.id)}</span><span class="badge-soft ${statusBadge[product.status]}">${e(statusLabels[product.status] || product.status)}</span></div>
          <div class="review-product-meta"><span>Giá</span><strong>${FW.formatVnd(product.price)}</strong></div>
          <div class="review-product-meta"><span>Giá ưu đãi</span><strong>${product.discount_price == null ? '—' : FW.formatVnd(product.discount_price)}</strong></div>
          <div class="review-product-note"><i class="fa-solid fa-align-left me-1"></i>${e(product.description || 'Chưa có mô tả')}</div>
          ${product.reject_reason ? `<div class="review-product-note text-rose"><i class="fa-solid fa-circle-xmark me-1"></i>Lý do: ${e(product.reject_reason)}</div>` : ''}
          ${product.status === 'PENDING' ? `
          <div class="review-product-actions">
            <button type="button" class="approve" data-review-action="approve" data-product-id="${e(product.id)}"><i class="fa-solid fa-circle-check me-1"></i>Phê duyệt</button>
            <button type="button" class="edit" data-review-action="reject" data-product-id="${e(product.id)}"><i class="fa-solid fa-circle-xmark me-1"></i>Từ chối</button>
          </div>` : ''}
        </div>
      </article>`
    }).join('') || '<div class="partner-empty-state">Không có sản phẩm phù hợp với bộ lọc.</div>'
  }

  async function loadProducts() {
    const table = document.getElementById('productTable')
    table.innerHTML = '<div class="partner-empty-state">Đang tải danh sách sản phẩm...</div>'
    try {
      products = await FW_API.getProductApprovals()
      document.querySelectorAll('[data-material]').forEach((button) => {
        const material = button.dataset.material
        const count = material ? products.filter((product) => product.material === material).length : products.length
        button.textContent = material ? `${material} (${count})` : `Tất cả (${count})`
      })
      renderStats()
      renderProducts()
    } catch (error) {
      products = []
      renderStats()
      table.innerHTML = `<div class="partner-empty-state">${e(error.message)}</div>`
      FW.toast(error.message)
    }
  }

  async function approveProduct(product) {
    try {
      await FW_API.approvePartnerProduct(product.id)
      FW.toast(`Đã duyệt "${product.name}", sản phẩm đã hiển thị cho khách.`)
      await loadProducts()
    } catch (error) {
      FW.toast(error.message)
      renderProducts()
    }
  }

  async function init() {
    document.querySelectorAll('[data-material]').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-material]').forEach((item) => item.classList.remove('active'))
        button.classList.add('active')
        activeMaterial = button.dataset.material
        renderProducts()
      })
    })

    document.getElementById('approvalSearch').addEventListener('input', renderProducts)
    document.getElementById('productTable').addEventListener('click', (event) => {
      const button = event.target.closest('[data-review-action]')
      if (!button) return
      const product = products.find((item) => item.id === Number(button.dataset.productId))
      if (!product) return
      if (button.dataset.reviewAction === 'approve') {
        button.disabled = true
        void approveProduct(product)
        return
      }
      rejectingId = product.id
      rejectForm.reset()
      rejectForm.classList.remove('was-validated')
      document.getElementById('rejectProductName').textContent = product.name
      rejectModal.show()
    })

    rejectForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      rejectForm.classList.add('was-validated')
      const reason = document.getElementById('rejectReason').value.trim()
      if (!reason) return
      const submit = rejectForm.querySelector('[type="submit"]')
      submit.disabled = true
      try {
        await FW_API.rejectPartnerProduct(rejectingId, reason)
        rejectModal.hide()
        FW.toast('Đã từ chối sản phẩm và gửi lý do cho Đối tác.')
        await loadProducts()
      } catch (error) {
        FW.toast(error.message)
      } finally {
        submit.disabled = false
      }
    })

    await loadProducts()
  }

  void init()
})()
