
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const e = FW.escapeHtml;
  const quoteId = new URLSearchParams(location.search).get('quote_id');

  let summary = null;
  let recipient = null;

  function selectedMethod() {
    return document.querySelector('input[name="paymentMethod"]:checked')?.value || 'CASH';
  }

  function updateMethodInfo() {
    const method = selectedMethod();
    $('cashInfo').hidden = method !== 'CASH';
    $('bankInfo').hidden = method !== 'BANK_TRANSFER';
    $('paidBtn').textContent = method === 'CASH'
        ? 'Xác nhận đặt hàng COD'
        : 'Tiếp tục thanh toán VNPAY';
  }

  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener('change', updateMethodInfo);
  });

  async function init() {
    try {
      summary = quoteId
          ? await FW_API.getQuoteForPayment(quoteId)
          : await FW_API.getCartSummary();

      try {
        recipient = JSON.parse(localStorage.getItem('fw_checkout')) || null;
      } catch (_) {
        recipient = null;
      }

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
          <span>${e(line.name)}
            <span class="text-muted-fw">× ${line.quantity}</span>
          </span>
          <span>${FW.formatVnd(Number(line.unit_price) * Number(line.quantity))}</span>
        </div>
      `).join('');

      $('sSub').textContent = FW.formatVnd(summary.subtotal);
      $('sDisc').textContent = summary.discount
          ? '− ' + FW.formatVnd(summary.discount)
          : '0 đ';
      $('sTotal').textContent = FW.formatVnd(summary.total);

      updateMethodInfo();
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

      try {
        pending = JSON.parse(localStorage.getItem('fw_pending_order')) || null;
      } catch (_) {}

      if (!pending || String(pending.quote_id || '') !== String(quoteId || '')) {
        pending = await FW_API.createOrder({
          recipient,
          quote_id: quoteId,
          voucher_code: quoteId ? null : summary.voucher_code
        });

        localStorage.setItem('fw_pending_order', JSON.stringify({
          code: pending.code,
          quote_id: quoteId || null
        }));
      }

      const method = selectedMethod();

      if (method === 'CASH') {
        const result = await FW_API.placeCashOrder(pending.code);

        localStorage.removeItem('fw_pending_order');
        localStorage.removeItem('fw_voucher');
        localStorage.removeItem('fw_checkout');
        localStorage.removeItem('fw_cart_items');

        location.href = FW.url(
            'shop/payment-success.html?code=' + encodeURIComponent(pending.code)
        );
        return;
      }

      if (method === 'BANK_TRANSFER') {
        const result = await FW_API.startVnptPayment(pending.code);

        if (!result || !result.payment_url) {
          throw new Error(
              result?.message || 'Chưa cấu hình kết nối VNPAY Sandbox. Đơn hàng vẫn chưa được thanh toán.'
          );
        }

        location.href = result.payment_url;
      }
    } catch (error) {
      $('payError').hidden = false;
      $('payError').textContent = error.message || 'Không thể xử lý đơn hàng.';
      button.disabled = false;
    }
  });

  init();
})();
