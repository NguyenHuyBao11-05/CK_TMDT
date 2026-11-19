(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  let paymentResult = params.get('payment');
  let order = null;
  let pollTimer = null;
  let countdownTimer = null;

  function setStatus(kind, title, message) {
    const map = {
      success: { cls: 'text-forest', icon: 'fa-circle-check' },
      pending: { cls: 'text-muted-fw', icon: 'fa-hourglass-half' },
      action: { cls: 'text-forest', icon: 'fa-store' },
      failed: { cls: 'text-rose', icon: 'fa-circle-xmark' }
    };
    const cfg = map[kind] || map.pending;
    $('statusIcon').className = 'display-4 mb-2 ' + cfg.cls;
    $('statusIcon').innerHTML = '<i class="fa-solid ' + cfg.icon + '"></i>';
    $('statusTitle').textContent = title;
    $('paymentStatusText').textContent = message;
    $('paymentStatusText').classList.toggle('text-rose', kind === 'failed');
  }

  function clearCheckoutCache() {
    try {
      const pending = JSON.parse(localStorage.getItem('fw_pending_order')) || null;
      if (pending && pending.code === code) localStorage.removeItem('fw_pending_order');
    } catch (_) { localStorage.removeItem('fw_pending_order'); }
    localStorage.removeItem('fw_voucher');
    localStorage.removeItem('fw_checkout');
    localStorage.removeItem('fw_cart_items');
  }

  function formatTime(value) {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }

  function showPayBox(o) {
    $('payBox').hidden = false;
    const deadline = new Date(o.payment_deadline);
    clearInterval(countdownTimer);
    const tick = () => {
      const left = deadline - Date.now();
      if (left <= 0) {
        $('payCountdown').textContent = 'Đã quá hạn thanh toán, đơn sẽ tự huỷ.';
        $('payNowBtn').disabled = true;
        clearInterval(countdownTimer);
        return;
      }
      const minutes = Math.floor(left / 60000);
      const seconds = Math.floor((left % 60000) / 1000);
      $('payCountdown').textContent = `Còn ${minutes}:${String(seconds).padStart(2, '0')} để thanh toán (hạn ${formatTime(o.payment_deadline)}).`;
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function render(o) {
    $('payBox').hidden = true;
    $('invoiceForm').hidden = o.payment_status !== 'PAID';
    const shop = o.partner_name ? `Shop ${o.partner_name}` : 'Đối tác';

    if (o.status === 'CANCELLED') {
      setStatus('failed', 'Đơn hàng đã huỷ', o.cancel_reason || 'Đơn hàng đã bị huỷ.');
      return 'done';
    }
    if (o.payment_status === 'PAID') {
      setStatus('success', 'Thanh toán thành công',
          o.partner_name ? `${shop} đã nhận tiền và sẽ bắt đầu chuẩn bị hoa cho bạn.` : 'Đơn hàng đã được thanh toán.');
      clearCheckoutCache();
      return 'done';
    }
    if (o.payment_method === 'CASH') {
      setStatus('success', 'Đặt hàng thành công', o.claim_deadline
          ? `Đơn đã được gửi tới các shop. Nếu đến ${formatTime(o.claim_deadline)} chưa có shop nhận, đơn sẽ tự huỷ. Bạn thanh toán khi nhận hàng.`
          : `${shop} đã nhận đơn. Bạn thanh toán khi nhận hàng.`);
      return o.claim_deadline ? 'claim' : 'done';
    }
    if (o.claim_deadline) {
      setStatus('pending', 'Đã đặt hàng, đang chờ shop nhận',
          `Đơn đã được gửi tới các shop. Khi có shop nhận, bạn sẽ được báo để thanh toán qua VNPAY. Nếu đến ${formatTime(o.claim_deadline)} chưa có shop nhận, đơn tự huỷ và bạn không bị trừ tiền.`);
      return 'claim';
    }
    if (paymentResult === 'pending') {
      setStatus('pending', 'Đang xác nhận thanh toán',
          'Đã quay về từ VNPAY. Hệ thống đang chờ xác nhận giao dịch, vui lòng chờ trong giây lát.');
      return 'waiting';
    }
    if (o.payment_deadline) {
      const retry = o.payment_status === 'FAILED' || paymentResult === 'failed';
      setStatus(retry ? 'failed' : 'action', retry ? 'Thanh toán chưa thành công' : `${shop} đã nhận đơn`,
          retry ? 'Giao dịch VNPAY chưa thành công hoặc đã bị huỷ. Bạn có thể thanh toán lại trước khi hết hạn.'
              : 'Vui lòng thanh toán qua VNPAY để shop bắt đầu chuẩn bị hoa.');
      showPayBox(o);
      return 'pay';
    }
    if (o.payment_status === 'FAILED' || paymentResult === 'failed') {
      setStatus('failed', 'Thanh toán không thành công',
          'Giao dịch VNPAY không thành công hoặc đã bị huỷ. Đơn hàng chưa được thanh toán.');
      return 'done';
    }
    setStatus('pending', 'Đơn hàng đang chờ xử lý', 'Đơn hàng chưa được thanh toán.');
    return 'done';
  }

  function schedulePoll(state) {
    clearTimeout(pollTimer);
    if (state !== 'claim' && state !== 'waiting' && state !== 'pay') return;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const latest = await FW_API.getOrderByCode(code);
        if (state === 'waiting' && latest.payment_status !== 'PAID' && attempts >= 10) paymentResult = null;
        const next = render(latest);
        order = latest;
        if (next !== state) {
          schedulePoll(next);
          return;
        }
      } catch (_) {}
      pollTimer = setTimeout(poll, state === 'waiting' ? 2000 : 10000);
    };
    pollTimer = setTimeout(poll, state === 'waiting' ? 2000 : 10000);
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
      $('oShip').textContent = `${order.recipient_name} · ${order.recipient_phone} · ${order.delivery_address}${order.delivery_note ? ' · ' + order.delivery_note : ''}`;
      schedulePoll(render(order));
    } catch (error) {
      $('noOrder').hidden = false;
      $('noOrder').querySelector('p').textContent = error.message || 'Không tải được thông tin đơn hàng.';
    }
  }

  $('payNowBtn').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    $('payError').hidden = true;
    try {
      const result = await FW_API.startVnptPayment(code);
      if (!result || !result.payment_url) throw new Error('Chưa cấu hình kết nối VNPAY Sandbox.');
      location.href = result.payment_url;
    } catch (error) {
      $('payError').hidden = false;
      $('payError').textContent = error.message || 'Không mở được trang thanh toán VNPAY.';
      button.disabled = false;
    }
  });

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
