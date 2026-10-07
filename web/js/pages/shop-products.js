// KH01 - Xem danh sách mẫu hoa: Lọc (chất liệu, giá), Sắp xếp, Tìm kiếm
(function () {
  'use strict'
  const form = document.getElementById('filterForm')
  const sortSel = document.getElementById('sortSelect')
  const q = new URLSearchParams(location.search).get('q') || ''

  document.getElementById('materialChecks').innerHTML = FW_API.MATERIALS.map((m, i) => `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" name="material" value="${FW.escapeHtml(m)}" id="mat${i}">
      <label class="form-check-label" for="mat${i}">${FW.escapeHtml(m)}</label>
    </div>`).join('')

  async function load() {
    const [min, max] = form.price.value.split('-').map(Number)
    const materials = [...form.querySelectorAll('[name=material]:checked')].map((c) => c.value)
    const list = await FW_API.getProducts({ q, materials, min, max, sort: sortSel.value })
    document.getElementById('resultInfo').textContent =
      (q ? `Kết quả cho "${q}": ` : '') + `${list.length} mẫu hoa`
    document.getElementById('productList').innerHTML = list.length
      ? list.map((p) => `<div class="col-6 col-xl-4">${FW.renderProductCard(p)}</div>`).join('')
      : '<p class="text-muted-fw text-center py-5">Không tìm thấy bó hoa phù hợp. Thử bỏ bớt bộ lọc hoặc đổi từ khoá.</p>'
  }

  form.addEventListener('change', load)
  form.addEventListener('reset', () => setTimeout(load))
  sortSel.addEventListener('change', load)
  load()
})()
