(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const e = FW.escapeHtml;
  const quoteId = new URLSearchParams(location.search).get('quote_id');
  let summary = null;
  let recipient = null;

  async function init() {
    try {
      if (quoteId) {
        summary = await FW_API.getQuoteForPayment(quoteId);
      } else {
        summary = await FW_API.getCartSummary();
      }
      try { recipient = JSON.parse(localStorage.getItem('fw_checkout')) || null; } catch (_) { recipient = null; }

      if (quoteId && (!recipient || !recipient.name || !recipient.phone || !recipient.address)) {
        location.replace(FW.url('shop/checkout.html?quote_id=' + encodeURIComponent(quoteId)));
        return;
      }
      if (!quoteId && (!recipient || !summary.lines.length)) {
        location.replace(FW.url(summary.lines.length ? 'shop/checkout.html' : 'shop/cart.html'));
        return;
      }
      if (!summary.lines.length) {
        $('emptyMsg').hidden = false;
        return;
      }

      $('payBody').hidden = false;
      $('orderLines').innerHTML = summary.lines.map((line) => `
        <div class="d-flex justify-content-between gap-2 small">
          <span>${e(line.name)} <span class="text-muted-fw">× ${line.quantity}</span>
            ${line.quote_id ? '<span class="badge text-bg-light">Báo giá</span>' : ''}</span>
          <span>${FW.formatVnd(Number(line.unit_price) * Number(line.quantity))}</span>
        </div>`).join('');
      $('sSub').textContent = FW.formatVnd(summary.subtotal);
      $('sDisc').textContent = summary.discount ? '− ' + FW.formatVnd(summary.discount) : '0 đ';
      $('sTotal').textContent = FW.formatVnd(summary.total);
      $('payAmount').textContent = FW.formatVnd(summary.total);
      $('payCode').textContent = 'Mã đơn sẽ được tạo khi xác nhận thanh toán';
    } catch (error) {
      $('emptyMsg').hidden = false;
      $('emptyMsg').textContent = error.message || 'Không tải được thông tin thanh toán.';
    }
  }

  $('paidBtn').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    $('payError').hidden = true;
    try {
      let pending = null;
      try { pending = JSON.parse(localStorage.getItem('fw_pending_order')) || null; } catch (_) {}
      if (!pending || String(pending.quote_id || '') !== String(quoteId || '')) {
        pending = await FW_API.createOrder({
          recipient,
          quote_id: quoteId,
          voucher_code: quoteId ? null : summary.voucher_code
        });
        try {
          localStorage.setItem('fw_pending_order', JSON.stringify({
            code: pending.code,
            quote_id: quoteId || null
          }));
        } catch (_) {}
      }
      $('payCode').textContent = pending.code;
      await FW_API.payOrder(pending.code);
      try {
        localStorage.removeItem('fw_pending_order');
        localStorage.removeItem('fw_voucher');
        localStorage.removeItem('fw_checkout');
        localStorage.removeItem('fw_cart_items');
      } catch (_) {}
      location.href = FW.url('shop/payment-success.html?code=' + encodeURIComponent(pending.code));
    } catch (error) {
      $('payError').hidden = false;
      $('payError').textContent = error.message || 'Thanh toán chưa thành công. Vui lòng thử lại.';
      button.disabled = false;
    }
  });

  init();
})();
