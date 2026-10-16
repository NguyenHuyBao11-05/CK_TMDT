(function () {
  'use strict'

  const e = FW.escapeHtml
  const statusLabels = {
    APPROVED: 'Đang hiển thị',
    PENDING: 'Chờ duyệt',
    REJECTED: 'Bị từ chối',
  }

  const productRows = (products) => products.map((product) => `
    <tr>
      <td><strong>#${e(product.id)}</strong></td>
      <td><div class="partner-product-cell"><img src="${e(product.thumbnail_url || FW.url('images/flowers/hero-bouquet.jpg'))}" alt=""><div><strong>${e(product.name)}</strong><span>${e(product.description || 'Chưa có mô tả')}</span></div></div></td>
      <td><span class="material-pill">${e(product.material)}</span></td>
      <td><strong>${FW.formatVnd(product.price)}</strong></td>
      <td>${product.discount_price == null ? '<span class="text-muted-fw">—</span>' : `<strong>${FW.formatVnd(product.discount_price)}</strong>`}</td>
      <td><span class="stock-indicator ${product.stock_quantity > 0 ? '' : 'empty'}">${product.stock_quantity > 0 ? '●' : '○'} ${e(product.stock_quantity)}</span></td>
      <td><span class="product-status ${statusClass(product.status)}">${e(statusLabels[product.status] || product.status)}</span></td>
      <td class="text-nowrap"><button type="button" class="partner-row-action" aria-label="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button><button type="button" class="partner-row-action" aria-label="Tuỳ chọn"><i class="fa-solid fa-ellipsis"></i></button></td>
    </tr>
  `).join('')

  const statusClass = (status) => {
    if (status === 'APPROVED') return 'active'
    if (status === 'PENDING') return 'pending'
    return 'reject'
  }

  function renderStats(products) {
    const stats = [
      { label: 'Tổng sản phẩm', value: products.length, note: 'Trong danh mục của bạn', icon: 'fa-boxes-stacked', tone: 'forest' },
      { label: 'Đang bán trực tuyến', value: products.filter((p) => p.status === 'APPROVED').length, note: 'Đã được Quản lý duyệt', icon: 'fa-cart-shopping', tone: 'blue' },
      { label: 'Hết hàng', value: products.filter((p) => p.stock_quantity === 0).length, note: 'Cần cập nhật tồn kho', icon: 'fa-box-open', tone: 'gold' },
      { label: 'Chờ kiểm duyệt', value: products.filter((p) => p.status === 'PENDING').length, note: 'Đang chờ phê duyệt', icon: 'fa-clipboard-check', tone: 'rose' },
    ]
    document.getElementById('productStats').innerHTML = stats.map((item) => `
      <div class="partner-stat-card">
        <div class="partner-stat-top">
          <span class="partner-stat-label">${e(item.label)}</span>
          <span class="partner-stat-icon ${item.tone}"><i class="fa-solid ${item.icon}"></i></span>
        </div>
        <div class="partner-stat-value">${e(item.value)}</div>
        <div class="partner-stat-foot"><span class="partner-stat-note">${e(item.note)}</span></div>
      </div>
    `).join('')
  }

  async function load() {
    const products = await FW_API.getPartnerProducts()
    renderStats(products)

    const table = document.getElementById('productList')
    const search = document.getElementById('productSearch')
    const material = document.getElementById('productMaterialFilter')
    const status = document.getElementById('productStatus')
    const stock = document.getElementById('productStockFilter')

    const updateTable = () => {
      const query = search.value.trim().toLocaleLowerCase('vi')
      const filtered = products.filter((product) =>
        (!query || `${product.id} ${product.name} ${product.material}`.toLocaleLowerCase('vi').includes(query)) &&
        (!material.value || product.material === material.value) &&
        (!status.value || product.status === status.value) &&
        (!stock.value || (stock.value === 'empty' ? product.stock_quantity === 0 : product.stock_quantity > 0)))
      table.innerHTML = filtered.length
        ? productRows(filtered)
        : '<tr><td colspan="8" class="text-center text-muted-fw py-5">Không tìm thấy sản phẩm phù hợp.</td></tr>'
    }

    updateTable()
    search.addEventListener('input', updateTable)
    ;[material, status, stock].forEach((input) => input.addEventListener('change', updateTable))
    document.getElementById('refreshProducts').addEventListener('click', () => {
      search.value = ''
      material.value = ''
      status.value = ''
      stock.value = ''
      updateTable()
    })
  }

  document.getElementById('productForm')?.addEventListener('submit', (event) => {
    event.preventDefault()
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide()
    FW.toast('Sản phẩm đã được gửi cho Quản lý kiểm duyệt.')
    event.currentTarget.reset()
  })

  load()
})()
