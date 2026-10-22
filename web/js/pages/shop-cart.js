(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  let cart = { lines: [], subtotal: 0 };
  let voucherCode = null;
  let discount = 0;

  function price(line) {
    return Number(line.unit_price || 0);
  }

  async function refreshVoucher() {
    discount = 0;
    if (!voucherCode || !cart.lines.length) return;
    const result = await FW_API.validateVoucher(voucherCode);
    if (result.ok) {
      voucherCode = result.code;
      discount = Number(result.discount || 0);
      $('voucherMsg').className = 'small mb-3 text-forest';
      $('voucherMsg').textContent = `Đã áp mã ${result.code}, giảm ${FW.formatVnd(discount)}.`;
    } else {
      voucherCode = null;
      $('voucherMsg').className = 'small mb-3 text-rose';
      $('voucherMsg').textContent = result.message;
    }
  }

  async function render() {
    $('cartLines').innerHTML = '<p class="text-muted-fw text-center py-4">Đang tải giỏ hàng...</p>';
    try {
      cart = await FW_API.getCart();
      $('cartEmpty').hidden = cart.lines.length > 0;
      $('cartBody').hidden = cart.lines.length === 0;
      if (!cart.lines.length) {
        $('cartLines').innerHTML = '';
        $('subtotal').textContent = FW.formatVnd(0);
        $('discount').textContent = '0 đ';
        $('total').textContent = FW.formatVnd(0);
        return;
      }

      try { voucherCode = localStorage.getItem('fw_voucher'); } catch (_) { voucherCode = null; }
      await refreshVoucher();

      $('cartLines').innerHTML = cart.lines.map((line) => {
        const name = FW.escapeHtml(line.name);
        const image = FW.escapeHtml(FW_API.imageUrl ? FW_API.imageUrl(line.thumbnail_url) : line.thumbnail_url);
        const id = Number(line.product_id);
        return `<div class="d-flex gap-3 p-3 bg-white border rounded-4 align-items-center">
          <img src="${image}" alt="${name}" width="88" height="88" class="rounded-3 object-fit-cover">
          <div class="flex-grow-1">
            <div class="font-serif">${name}</div>
            <div class="small text-muted-fw">${FW.escapeHtml(line.partner_name)}</div>
            <div class="text-rose fw-bold">${FW.formatVnd(price(line))}</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-ghost px-3" data-qty="${id}" data-d="-1" aria-label="Giảm số lượng" ${line.quantity <= 1 ? 'disabled' : ''}>−</button>
            <span aria-label="Số lượng">${line.quantity}</span>
            <button class="btn btn-ghost px-3" data-qty="${id}" data-d="1" aria-label="Tăng số lượng" ${line.quantity >= 50 ? 'disabled' : ''}>+</button>
          </div>
          <button class="btn btn-ghost" data-del="${id}" aria-label="Xoá ${name} khỏi giỏ"><i class="fa-solid fa-trash"></i></button>
        </div>`;
      }).join('');

      await totals();
    } catch (error) {
      $('cartEmpty').hidden = true;
      $('cartBody').hidden = false;
      $('cartLines').innerHTML = `<p class="text-rose text-center py-4">${FW.escapeHtml(error.message || 'Không tải được giỏ hàng.')}</p>`;
    }
  }

  async function totals() {
    await refreshVoucher();
    const subtotal = Number(cart.subtotal || 0);
    const totalDiscount = Math.min(discount, subtotal);
    $('subtotal').textContent = FW.formatVnd(subtotal);
    $('discount').textContent = totalDiscount ? '− ' + FW.formatVnd(totalDiscount) : '0 đ';
    $('total').textContent = FW.formatVnd(Math.max(0, subtotal - totalDiscount));
    try {
      voucherCode ? localStorage.setItem('fw_voucher', voucherCode) : localStorage.removeItem('fw_voucher');
    } catch (_) {}
  }

  $('cartLines').addEventListener('click', async (event) => {
    const qtyButton = event.target.closest('[data-qty]');
    const deleteButton = event.target.closest('[data-del]');
    try {
      if (qtyButton) {
        const line = cart.lines.find((x) => Number(x.product_id) === Number(qtyButton.dataset.qty));
        if (!line) return;
        const next = Number(line.quantity) + Number(qtyButton.dataset.d);
        if (next < 1) return;
        cart = await FW_API.updateCartQuantity(line.product_id, next);
      } else if (deleteButton) {
        cart = await FW_API.removeCartItem(deleteButton.dataset.del);
      } else return;
      await render();
    } catch (error) {
      FW.toast(error.message || 'Không cập nhật được giỏ hàng.');
    }
  });

  $('voucherForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = event.target.elements.code.value.trim();
    const result = await FW_API.validateVoucher(code);
    if (result.ok) {
      voucherCode = result.code;
      discount = Number(result.discount || 0);
      $('voucherMsg').className = 'small mb-3 text-forest';
      $('voucherMsg').textContent = `Đã áp mã ${result.code}, giảm ${FW.formatVnd(discount)}.`;
    } else {
      voucherCode = null;
      discount = 0;
      $('voucherMsg').className = 'small mb-3 text-rose';
      $('voucherMsg').textContent = result.message;
    }
    await totals();
  });

  render();
})();
