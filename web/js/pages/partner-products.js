(function () {
  'use strict'

  const productRows = (products) => products.map((product) => `
    <tr>
      <td><span class="partner-sku">${FW.escapeHtml(product.sku)}</span></td>
      <td><div class="partner-product-cell"><img src="${FW.escapeHtml(product.thumbnail)}" alt=""><div><strong>${FW.escapeHtml(product.name)}</strong><span>${FW.escapeHtml(product.category)} · ${FW.escapeHtml(product.material)}</span></div></div></td>
      <td><span class="material-pill">${FW.escapeHtml(product.material)}</span></td>
      <td><strong>${FW.formatVnd(product.price)}</strong><span class="table-subtext">Đã bán ${FW.escapeHtml(product.sold)}</span></td>
      <td><strong>${FW.formatVnd(product.wholesale_price)}</strong><span class="table-subtext">Tối thiểu 5 sản phẩm</span></td>
      <td><span class="stock-indicator ${product.stock > 0 ? '' : 'empty'}">${product.stock > 0 ? '●' : '○'} ${product.stock > 0 ? `Còn ${FW.escapeHtml(product.stock)}` : 'Hết hàng'}</span><span class="table-subtext">${product.stock > 0 ? 'Cập nhật hôm nay' : 'Cần nhập thêm'}</span></td>
      <td><span class="product-status ${statusClass(product.status)}">${FW.escapeHtml(product.status)}</span></td>
      <td class="text-nowrap"><button type="button" class="partner-row-action" aria-label="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button><button type="button" class="partner-row-action" aria-label="Tuỳ chọn"><i class="fa-solid fa-ellipsis"></i></button></td>
    </tr>
  `).join('')

  const statusClass = (status) => {
    if (status === 'Đang hiển thị') return 'active'
    if (status === 'Chờ duyệt') return 'pending'
    return 'reject'
  }

  const renderStats = (products) => {
    const stats = [
      { label: 'Tổng sản phẩm', value: '48', note: '100% hồ sơ đầy đủ', icon: 'fa-boxes-stacked', tone: 'forest' },
      { label: 'Đang bán trực tuyến', value: '42', note: 'Hot shop +5%', icon: 'fa-cart-shopping', tone: 'blue' },
      { label: 'Hết nguyên liệu', value: '04', note: 'Cần nhập ngay', icon: 'fa-box-open', tone: 'gold' },
      { label: 'Chờ kiểm duyệt', value: '02', note: 'Phê duyệt sản phẩm', icon: 'fa-clipboard-check', tone: 'rose' },
    ]

    document.getElementById('productStats').innerHTML = stats.map((item) => `
      <div class="partner-stat-card">
        <div class="partner-stat-top">
          <span class="partner-stat-label">${FW.escapeHtml(item.label)}</span>
          <span class="partner-stat-icon ${item.tone}"><i class="fa-solid ${item.icon}"></i></span>
        </div>
        <div class="partner-stat-value">${FW.escapeHtml(item.value)}</div>
        <div class="partner-stat-foot"><span class="partner-stat-note">${FW.escapeHtml(item.note)}</span></div>
      </div>
    `).join('')
  }

  async function load() {
    const products = await FW_API.getPartnerProducts()
    const mapped = products.map((p, index) => ({
      ...p,
      thumbnail: '../images/flowers/' + ['hero-bouquet.jpg', 'white-tulips.jpg', 'sunshine-basket.jpg', 'grand-opening.jpg'][index % 4],
    }))
    renderStats(mapped)
    const table = document.getElementById('productList')
    const search = document.getElementById('productSearch')
    const category = document.getElementById('productCategory')
    const status = document.getElementById('productStatus')
    const material = document.getElementById('productStockFilter')
    const updateTable = () => {
      const q = search.value.trim().toLowerCase()
      const filtered = mapped.filter((p) =>
        (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q)) &&
        (!category.value || p.category === category.value) &&
        (!status.value || p.status === status.value) &&
        (!material.value || p.material === material.value))
      table.innerHTML = filtered.length ? productRows(filtered) : '<tr><td colspan="8" class="text-center text-muted-fw py-5">Không tìm thấy sản phẩm phù hợp.</td></tr>'
    }
    updateTable()
    ;[search, category, status, material].forEach((input) => {
      input.addEventListener(input === search ? 'input' : 'change', updateTable)
    })
    document.getElementById('refreshProducts').addEventListener('click', () => {
      search.value = ''
      category.value = ''
      status.value = ''
      material.value = ''
      updateTable()
    })
  }

  document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide()
    FW.toast('Sản phẩm đã được gửi cho Quản lý kiểm duyệt.')
    e.target.reset()
  })

  load()
})()