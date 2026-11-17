(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const paymentResult = params.get('payment'); // chỉ là gợi ý từ Return URL, KHÔNG phải nguồn sự thật
  let order = null;

  function setStatus(kind, title, message) {
    const icon = $('statusIcon');
    const heading = $('statusTitle');
    const text = $('paymentStatusText');
    const map = {
      success: { cls: 'text-forest', icon: 'fa-circle-check' },
      pending: { cls: 'text-muted-fw', icon: 'fa-hourglass-half' },
      failed:  { cls: 'text-rose', icon: 'fa-circle-xmark' }
    };
    const cfg = map[kind] || map.pending;
    icon.className = 'display-4 mb-2 ' + cfg.cls;
    icon.innerHTML = '<i class="fa-solid ' + cfg.icon + '"></i>';
    heading.textContent = title;
    text.textContent = message;
    text.classList.toggle('text-rose', kind === 'failed');
  }

  // Dọn dữ liệu tạm sau khi đơn đã thanh toán, tránh lần mua sau dùng lại mã đơn cũ
  function clearCheckoutCache() {
    try {
      const pending = JSON.parse(localStorage.getItem('fw_pending_order')) || null;
      if (pending && pending.code === code) localStorage.removeItem('fw_pending_order');
    } catch (_) { localStorage.removeItem('fw_pending_order'); }
    localStorage.removeItem('fw_voucher');
    localStorage.removeItem('fw_checkout');
    localStorage.removeItem('fw_cart_items');
  }

  // Hiển thị theo dữ liệu THẬT từ backend (payment_method + payment_status)
  function render(o) {
    if (o.payment_method === 'BANK_TRANSFER') {
      if (o.payment_status === 'PAID') {
        setStatus('success', 'Thanh toán thành công',
            'Thanh toán VNPAY thành công. Đơn hàng đang chờ đối tác xác nhận.');
        clearCheckoutCache();
        return 'done';
      }
      if (o.payment_status === 'FAILED') {
        setStatus('failed', 'Thanh toán không thành công',
            'Giao dịch VNPAY không thành công hoặc đã bị huỷ. Đơn hàng chưa được thanh toán, bạn có thể quay lại thanh toán lại.');
        return 'done';
      }
      if (paymentResult === 'failed') {
        setStatus('failed', 'Thanh toán chưa thành công',
            'VNPAY báo giao dịch chưa thành công hoặc đã bị huỷ. Đơn hàng chưa được xác nhận thanh toán.');
        return 'done';
      }
      setStatus('pending', 'Đang xác nhận thanh toán',
          'Đã quay về từ VNPAY. Hệ thống đang chờ xác nhận giao dịch, vui lòng chờ trong giây lát.');
      return 'waiting';
    }
    // COD
    setStatus('success', 'Đặt hàng thành công',
        'Cảm ơn bạn! Đơn đang ở trạng thái Chờ xử lý, thanh toán khi nhận hàng.');
    return 'done';
  }

  function startPolling() {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const latest = await FW_API.getOrderByCode(code);
        const state = render(latest);
        if (state === 'done') { clearInterval(timer); order = latest; return; }
      } catch (_) { /* thử lại ở lần sau */ }
      if (attempts >= 10) {
        clearInterval(timer);
        setStatus('pending', 'Giao dịch đang được đối soát',
            'Hệ thống chưa nhận được xác nhận từ VNPAY. Vui lòng kiểm tra lại trong mục "Đơn hàng của tôi" sau ít phút.');
      }
    }, 2000);
  }

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

      if (render(order) === 'waiting') startPolling();
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