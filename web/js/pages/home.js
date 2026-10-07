(function () {
  'use strict'

  const ALL = 'Tất cả'
  let bestSellers = []
  let currentMaterial = ALL

  function renderList(containerId, products) {
    const box = document.getElementById(containerId)
    if (products.length === 0) {
      box.innerHTML = '<p class="text-muted-fw text-center py-5 mb-0">Không tìm thấy bó hoa phù hợp.</p>'
      return
    }
    box.innerHTML = products
      .map((p) => `<div class="col-6 col-lg-3">${FW.renderProductCard(p)}</div>`)
      .join('')
  }

  function renderMaterialTabs() {
    const tabs = document.getElementById('materialTabs')
    tabs.innerHTML = [ALL, ...FW_API.MATERIALS]
      .map((m) => `<button type="button" role="tab" class="btn btn-ghost${m === currentMaterial ? ' active' : ''}"
                    aria-selected="${m === currentMaterial}" data-material="${FW.escapeHtml(m)}">${FW.escapeHtml(m)}</button>`)
      .join('')
  }

  function applyFilter() {
    const filtered = currentMaterial === ALL
      ? bestSellers
      : bestSellers.filter((p) => p.material === currentMaterial)
    renderList('bestSellerList', filtered)
  }

  document.getElementById('materialTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-material]')
    if (!btn) return
    currentMaterial = btn.dataset.material
    renderMaterialTabs()
    applyFilter()
  })

  async function init() {
    renderMaterialTabs()
    try {
      const [best, fresh] = await Promise.all([FW_API.getBestSellers(), FW_API.getNewProducts()])
      bestSellers = best
      applyFilter()
      renderList('newProductList', fresh)
    } catch (err) {
      console.error(err)
      document.getElementById('bestSellerList').innerHTML =
        '<p class="text-rose text-center py-5 mb-0">Không tải được sản phẩm, vui lòng thử lại.</p>'
    }
  }

  init()
})()
