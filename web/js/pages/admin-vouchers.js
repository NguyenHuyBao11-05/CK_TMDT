(function () {
  'use strict'
  const $ = (id) => document.getElementById(id)
  const e = FW.escapeHtml
  const voucherModal = new bootstrap.Modal($('voucherModal'))
  const deleteModal = new bootstrap.Modal($('deleteModal'))
  let deletingCode = null

  async function render() {
    const list = await FW_API.getVouchers()
    $('statTotal').textContent = list.length
    $('statActive').textContent = list.filter((v) => v.is_active).length
    $('statOff').textContent = list.filter((v) => !v.is_active).length
    $('voucherTable').innerHTML = list.length ? list.map((v) => `
      <tr>
        <td class="fw-bold">${e(v.code)}</td>
        <td>${v.type === 'PERCENT' ? v.value + '%' : FW.formatVnd(v.value)}</td>
        <td>${FW.formatVnd(v.min_order)}</td>
        <td>${v.is_active ? '<span class="badge-soft green">Đang bật</span>' : '<span class="badge-soft rose">Đã tắt</span>'}</td>
        <td class="text-end text-nowrap">
          <button type="button" class="btn-icon" data-action="toggle" data-code="${e(v.code)}" title="${v.is_active ? 'Tắt' : 'Bật'}">
            <i class="fa-solid ${v.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
          </button>
          <button type="button" class="btn-icon danger" data-action="delete" data-code="${e(v.code)}" title="Xoá">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>`).join('') : '<tr><td colspan="5" class="text-center text-muted-fw py-4">Chưa có voucher nào.</td></tr>'
  }

  $('addBtn').addEventListener('click', () => {
    $('voucherForm').reset()
    $('voucherForm').querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'))
    voucherModal.show()
  })

  $('voucherTable').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-action]')
    if (!btn) return
    const code = btn.dataset.code
    if (btn.dataset.action === 'toggle') {
      await FW_API.toggleVoucher(code)
      render()
    } else {
      deletingCode = code
      $('deleteCode').textContent = code
      deleteModal.show()
    }
  })

  $('confirmDelete').addEventListener('click', async () => {
    await FW_API.deleteVoucher(deletingCode)
    deleteModal.hide()
    FW.toast('Đã xoá voucher')
    render()
  })

  $('voucherForm').addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const code = $('vCode').value.trim()
    const type = $('vType').value
    const value = Number($('vValue').value)
    const okCode = /^[A-Za-z0-9]{3,20}$/.test(code)
    const okValue = value > 0 && !(type === 'PERCENT' && value > 100)
    $('vCodeMsg').textContent = 'Mã gồm 3–20 chữ hoặc số, không dấu, không khoảng trắng.'
    $('vValueMsg').textContent = type === 'PERCENT' ? 'Phần trăm từ 1 đến 100.' : 'Số tiền phải lớn hơn 0.'
    $('vCode').classList.toggle('is-invalid', !okCode)
    $('vValue').classList.toggle('is-invalid', !okValue)
    if (!okCode || !okValue) return
    const res = await FW_API.saveVoucher({ code, type, value, min_order: $('vMin').value || 0 })
    if (!res.ok) { $('vCodeMsg').textContent = res.message; $('vCode').classList.add('is-invalid'); return }
    voucherModal.hide()
    FW.toast('Đã thêm voucher')
    render()
  })

  render()
})()
