(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const e = FW.escapeHtml;
  const voucherModal = new bootstrap.Modal($('voucherModal'));
  const deleteModal = new bootstrap.Modal($('deleteModal'));
  let deletingCode = null;
  let editingId = null;

  function showError(message) {
    FW.toast(message || 'Có lỗi xảy ra khi xử lý voucher.');
  }

  async function render() {
    try {
      const list = await FW_API.getVouchers();
      $('statTotal').textContent = list.length;
      $('statActive').textContent = list.filter((v) => v.is_active).length;
      $('statOff').textContent = list.filter((v) => !v.is_active).length;
      $('voucherTable').innerHTML = list.length ? list.map((v) => `
        <tr>
          <td class="fw-bold">${e(v.code)}</td>
          <td>${v.type === 'PERCENT' ? Number(v.value) + '%' : FW.formatVnd(v.value)}</td>
          <td>${FW.formatVnd(v.min_order)}</td>
          <td>${v.is_active ? '<span class="badge-soft green">Đang bật</span>' : '<span class="badge-soft rose">Đã tắt</span>'}</td>
          <td class="text-end text-nowrap">
            <button type="button" class="btn-icon" data-action="edit" data-id="${v.id}" data-code="${e(v.code)}" title="Sửa">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="btn-icon" data-action="toggle" data-code="${e(v.code)}" title="${v.is_active ? 'Tắt' : 'Bật'}">
              <i class="fa-solid ${v.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
            </button>
            <button type="button" class="btn-icon danger" data-action="delete" data-code="${e(v.code)}" title="Xoá">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>`).join('') : '<tr><td colspan="5" class="text-center text-muted-fw py-4">Chưa có voucher nào.</td></tr>';
    } catch (error) {
      $('voucherTable').innerHTML = `<tr><td colspan="5" class="text-center text-rose py-4">${e(error.message || 'Không tải được voucher.')}</td></tr>`;
      showError(error.message);
    }
  }

  $('addBtn').addEventListener('click', () => {
    editingId = null;
    $('voucherForm').reset();
    $('voucherForm').querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    $('voucherModalTitle').textContent = 'Thêm voucher';
    $('vCode').disabled = false;
    $('vCodeMsg').textContent = 'Mã gồm 3–20 chữ hoặc số, không dấu, không khoảng trắng.';
    voucherModal.show();
  });

  $('voucherTable').addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;
    const code = btn.dataset.code;
    if (btn.dataset.action === 'edit') {
      try {
        const list = await FW_API.getVouchers();
        const voucher = list.find((item) => Number(item.id) === Number(btn.dataset.id));
        if (!voucher) throw new Error('Không tìm thấy voucher cần sửa.');
        editingId = Number(voucher.id);
        $('voucherForm').reset();
        $('voucherForm').querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
        $('voucherModalTitle').textContent = 'Sửa voucher';
        $('vCode').value = voucher.code;
        $('vCode').disabled = true;
        $('vType').value = voucher.type;
        $('vValue').value = voucher.value;
        $('vMin').value = voucher.min_order;
        voucherModal.show();
      } catch (error) {
        showError(error.message);
      }
    } else if (btn.dataset.action === 'toggle') {
      btn.disabled = true;
      try {
        await FW_API.toggleVoucher(code);
        await render();
      } catch (error) {
        showError(error.message);
      } finally {
        btn.disabled = false;
      }
    } else {
      deletingCode = code;
      $('deleteCode').textContent = code;
      deleteModal.show();
    }
  });

  $('confirmDelete').addEventListener('click', async () => {
    const button = $('confirmDelete');
    button.disabled = true;
    try {
      await FW_API.deleteVoucher(deletingCode);
      deleteModal.hide();
      FW.toast('Đã xoá voucher.');
      await render();
    } catch (error) {
      showError(error.message);
    } finally {
      button.disabled = false;
    }
  });

  $('voucherForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const code = $('vCode').value.trim().toUpperCase();
    const type = $('vType').value;
    const value = Number($('vValue').value);
    const minOrder = Number($('vMin').value || 0);
    const okCode = /^[A-Za-z0-9]{3,20}$/.test(code);
    const okValue = Number.isFinite(value) && value > 0 && !(type === 'PERCENT' && value > 100);
    const okMin = Number.isFinite(minOrder) && minOrder >= 0;
    $('vCodeMsg').textContent = 'Mã gồm 3–20 chữ hoặc số, không dấu, không khoảng trắng.';
    $('vValueMsg').textContent = type === 'PERCENT' ? 'Phần trăm từ 1 đến 100.' : 'Số tiền phải lớn hơn 0.';
    $('vCode').classList.toggle('is-invalid', !okCode);
    $('vValue').classList.toggle('is-invalid', !okValue);
    $('vMin').classList.toggle('is-invalid', !okMin);
    if (!okCode || !okValue || !okMin) return;

    const submit = $('voucherForm').querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const res = await FW_API.saveVoucher({ id: editingId, code, type, value, min_order: minOrder });
      if (!res.ok) {
        $('vCodeMsg').textContent = res.message;
        $('vCode').classList.add('is-invalid');
        return;
      }
      voucherModal.hide();
      FW.toast(editingId ? 'Đã cập nhật voucher.' : 'Đã thêm voucher.');
      editingId = null;
      $('vCode').disabled = false;
      await render();
    } catch (error) {
      $('vCodeMsg').textContent = error.message || 'Không lưu được voucher.';
      $('vCode').classList.add('is-invalid');
    } finally {
      submit.disabled = false;
    }
  });

  render();
})();
