(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const code = new URLSearchParams(location.search).get('code');
  let order = null;

  async function init() {
    try {
      order = code ? await FW_API.getOrderByCode(code) : null;
      if (!order) {
        $('noOrder').hidden = false;
        return;
      }
      $('okBody').hidden = false;
      order.code = order.order_code || order.code;
      $('oCode').textContent = order.code;
      $('oCount').textContent = (order.lines || []).reduce((count, line) => count + Number(line.quantity || 0), 0);
      $('oTotal').textContent = FW.formatVnd(order.total_amount ?? order.total);
      const recipient = order.recipient || {
        name: order.recipient_name, phone: order.recipient_phone, address: order.delivery_address, note: order.delivery_note
      };
      $('oShip').textContent = recipient.address
          ? `${recipient.name} · ${recipient.phone} · ${recipient.address}${recipient.note ? ' · ' + recipient.note : ''}`
          : (recipient.note || '—');
    } catch (error) {
      $('noOrder').hidden = false;
      $('noOrder').querySelector('p').textContent = error.message || 'Không tải được thông tin đơn hàng.';
    }
  }

  $('invoiceForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!order) return;
    const button = event.submitter;
    if (button) button.disabled = true;
    try {
      const result = await FW_API.sendInvoice(order.code, event.target.elements.email.value);
      $('invoiceMsg').className = 'small mt-2 mb-0 ' + (result.ok ? 'text-forest' : 'text-rose');
      $('invoiceMsg').textContent = result.message || (result.ok
          ? 'Đã gửi hoá đơn, bạn kiểm tra email nhé.'
          : 'Không gửi được hoá đơn.');
    } catch (error) {
      $('invoiceMsg').className = 'small mt-2 mb-0 text-rose';
      $('invoiceMsg').textContent = error.message || 'Không gửi được hoá đơn. Vui lòng thử lại.';
    } finally {
      if (button) button.disabled = false;
    }
  });

  init();
})();
