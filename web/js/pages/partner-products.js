// DT02 - Quản lý sản phẩm của Đối tác.
(function () {
  'use strict'

  const e = FW.escapeHtml
  const statusLabels = { APPROVED: 'Đang hiển thị', PENDING: 'Chờ duyệt', REJECTED: 'Bị từ chối' }
  const modalElement = document.getElementById('productModal')
  const modal = bootstrap.Modal.getOrCreateInstance(modalElement)
  const form = document.getElementById('productForm')
  const submitButton = form.querySelector('[type="submit"]')
  const fileInput = document.getElementById('productImages')
  const preview = document.getElementById('productImagePreview')
  let products = []
  let editingProduct = null
  let imageUrls = []
  let imageFiles = []
  const filePreviewUrls = new Map()

  function clearFilePreviews() {
    filePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    filePreviewUrls.clear()
  }

  function statusClass(status) {
    if (status === 'APPROVED') return 'active'
    if (status === 'PENDING') return 'pending'
    return 'reject'
  }

  function renderStats() {
    const stats = [
      { label: 'Tổng sản phẩm', value: products.length, note: 'Trong danh mục của bạn', icon: 'fa-boxes-stacked', tone: 'forest' },
      { label: 'Đang bán trực tuyến', value: products.filter((product) => product.status === 'APPROVED').length, note: 'Đã được Quản lý duyệt', icon: 'fa-cart-shopping', tone: 'blue' },
      { label: 'Bị từ chối', value: products.filter((product) => product.status === 'REJECTED').length, note: 'Sửa lại rồi gửi duyệt lại', icon: 'fa-circle-xmark', tone: 'gold' },
      { label: 'Chờ kiểm duyệt', value: products.filter((product) => product.status === 'PENDING').length, note: 'Đang chờ phê duyệt', icon: 'fa-clipboard-check', tone: 'rose' },
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

  function renderImagePreview() {
    const existing = imageUrls.map((url, index) => `
      <div class="position-relative">
        <img src="${e(FW_API.imageUrl(url))}" alt="Ảnh sản phẩm" style="width:72px;height:72px;object-fit:cover;border-radius:8px">
        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" data-remove-image="${index}" aria-label="Xoá ảnh">×</button>
      </div>`).join('')
    const pending = imageFiles.map((file, index) => {
      if (!filePreviewUrls.has(file)) filePreviewUrls.set(file, URL.createObjectURL(file))
      return `
      <div class="position-relative">
        <img src="${e(filePreviewUrls.get(file))}" alt="${e(file.name)}" style="width:72px;height:72px;object-fit:cover;border-radius:8px">
        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" data-remove-file="${index}" aria-label="Xoá ảnh">×</button>
      </div>`
    }).join('')
    preview.innerHTML = existing + pending
  }

  function productRows(rows) {
    return rows.map((product) => `
      <tr>
        <td><strong>#${e(product.id)}</strong></td>
        <td><div class="partner-product-cell"><img src="${e(FW_API.imageUrl(product.thumbnail_url))}" alt=""><div><strong>${e(product.name)}</strong><span>${e(product.description || 'Chưa có mô tả')}</span></div></div>${product.reject_reason ? `<small class="text-rose">Lý do từ chối: ${e(product.reject_reason)}</small>` : ''}</td>
        <td><span class="material-pill">${e(product.material)}</span></td>
        <td><strong>${FW.formatVnd(product.price)}</strong></td>
        <td>${product.discount_price == null ? '<span class="text-muted-fw">—</span>' : `<strong>${FW.formatVnd(product.discount_price)}</strong>`}</td>
        <td><span class="product-status ${statusClass(product.status)}">${e(statusLabels[product.status] || product.status)}</span></td>
        <td class="text-nowrap"><button type="button" class="partner-row-action" aria-label="Chỉnh sửa" data-edit-product="${e(product.id)}"><i class="fa-solid fa-pen"></i></button></td>
      </tr>
    `).join('')
  }

  function renderProducts() {
    const query = document.getElementById('productSearch').value.trim().toLocaleLowerCase('vi')
    const material = document.getElementById('productMaterialFilter').value
    const status = document.getElementById('productStatus').value
    const filtered = products.filter((product) =>
      (!query || `${product.id} ${product.name} ${product.material}`.toLocaleLowerCase('vi').includes(query)) &&
      (!material || product.material === material) &&
      (!status || product.status === status))
    document.getElementById('productList').innerHTML = filtered.length
      ? productRows(filtered)
      : '<tr><td colspan="7" class="text-center text-muted-fw py-5">Không tìm thấy sản phẩm phù hợp.</td></tr>'
  }

  async function loadProducts() {
    const table = document.getElementById('productList')
    table.innerHTML = '<tr><td colspan="8" class="text-center text-muted-fw py-5">Đang tải sản phẩm...</td></tr>'
    try {
      products = await FW_API.getPartnerProducts()
      renderStats()
      renderProducts()
    } catch (error) {
      products = []
      renderStats()
      table.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-5">${e(error.message)}</td></tr>`
      FW.toast(error.message)
    }
  }

  function resetEditor() {
    editingProduct = null
    imageUrls = []
    imageFiles = []
    clearFilePreviews()
    form.reset()
    form.classList.remove('was-validated')
    document.getElementById('productModalTitle').textContent = 'Đăng sản phẩm mới'
    submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi duyệt'
    fileInput.value = ''
    renderImagePreview()
  }

  function editProduct(product) {
    editingProduct = product
    imageUrls = [...(product.image_urls || [])]
    imageFiles = []
    clearFilePreviews()
    form.reset()
    form.classList.remove('was-validated')
    document.getElementById('productModalTitle').textContent = 'Chỉnh sửa sản phẩm'
    document.getElementById('productName').value = product.name
    document.getElementById('productMaterial').value = product.material
    document.getElementById('productPrice').value = product.price
    document.getElementById('productDiscountPrice').value = product.discount_price ?? ''
    document.getElementById('productDescription').value = product.description || ''
    fileInput.value = ''
    renderImagePreview()
    modal.show()
  }

  async function uploadSelectedImages() {
    const uploaded = []
    for (const file of imageFiles) {
      const result = await FW_API.uploadImage(file)
      uploaded.push(result.url)
    }
    return [...imageUrls, ...uploaded]
  }

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || [])
    fileInput.value = ''
    if (imageUrls.length + imageFiles.length + files.length > 5) {
      FW.toast('Mỗi sản phẩm có tối đa 5 ảnh.')
      return
    }
    const invalid = files.find((file) => !['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024)
    if (invalid) {
      FW.toast('Chỉ nhận ảnh JPG hoặc PNG, tối đa 2MB mỗi ảnh.')
      return
    }
    imageFiles.push(...files)
    renderImagePreview()
  })

  preview.addEventListener('click', (event) => {
    const removeImage = event.target.closest('[data-remove-image]')
    const removeFile = event.target.closest('[data-remove-file]')
    if (removeImage) imageUrls.splice(Number(removeImage.dataset.removeImage), 1)
    if (removeFile) {
      const [file] = imageFiles.splice(Number(removeFile.dataset.removeFile), 1)
      const url = filePreviewUrls.get(file)
      if (url) URL.revokeObjectURL(url)
      filePreviewUrls.delete(file)
    }
    if (removeImage || removeFile) renderImagePreview()
  })

  document.getElementById('productList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit-product]')
    if (!button) return
    const product = products.find((item) => item.id === Number(button.dataset.editProduct))
    if (product) editProduct(product)
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    form.classList.add('was-validated')
    if (!form.reportValidity()) return
    if (imageUrls.length + imageFiles.length < 1) {
      FW.toast('Sản phẩm cần có ít nhất 1 ảnh.')
      return
    }

    const price = Number(document.getElementById('productPrice').value)
    const discountValue = document.getElementById('productDiscountPrice').value
    const discountPrice = discountValue === '' ? null : Number(discountValue)
    if (discountPrice !== null && discountPrice >= price) {
      FW.toast('Giá ưu đãi phải nhỏ hơn giá bán.')
      return
    }

    submitButton.disabled = true
    try {
      const uploadedImages = await uploadSelectedImages()
      const data = {
        name: document.getElementById('productName').value.trim(),
        material: document.getElementById('productMaterial').value,
        description: document.getElementById('productDescription').value.trim(),
        price,
        discount_price: discountPrice,
        image_urls: uploadedImages,
      }
      if (editingProduct) {
        await FW_API.updatePartnerProduct(editingProduct.id, data)
        FW.toast('Đã cập nhật sản phẩm.')
      } else {
        await FW_API.createPartnerProduct(data)
        FW.toast('Sản phẩm đã được gửi cho Quản lý kiểm duyệt.')
      }
      modal.hide()
      resetEditor()
      await loadProducts()
    } catch (error) {
      FW.toast(error.message)
    } finally {
      submitButton.disabled = false
    }
  })

  modalElement.addEventListener('hidden.bs.modal', resetEditor)
  document.getElementById('resetForm').addEventListener('click', (event) => {
    event.preventDefault()
    resetEditor()
  })
  document.getElementById('refreshProducts').addEventListener('click', () => {
    document.getElementById('productSearch').value = ''
    document.getElementById('productMaterialFilter').value = ''
    document.getElementById('productStatus').value = ''
    void loadProducts()
  })
  ;['productSearch', 'productMaterialFilter', 'productStatus'].forEach((id) => {
    const element = document.getElementById(id)
    element.addEventListener(id === 'productSearch' ? 'input' : 'change', renderProducts)
  })
  document.querySelectorAll('[data-bs-target="#productModal"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!editingProduct) resetEditor()
    })
  })

  void loadProducts()
})()
