(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const e = FW.escapeHtml;
  const form = $('checkoutForm');
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $('fDate').min = today.toISOString().slice(0, 10);

  try {
    const saved = JSON.parse(localStorage.getItem('fw_checkout')) || {};
    Object.entries(saved).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
  } catch (_) {}

  const quoteId = new URLSearchParams(location.search).get('quote_id');

  async function init() {
    try {
      const summary = quoteId ? await FW_API.getQuoteForPayment(quoteId) : await FW_API.getCartSummary();
      if (!summary.lines.length) {
        location.replace(FW.url('shop/cart.html'));
        return;
      }
      $('orderLines').innerHTML = summary.lines.map((line) => `
        <div class="d-flex justify-content-between gap-2 small">
          <span>${e(line.name)} <span class="text-muted-fw">× ${line.quantity}</span></span>
          <span>${FW.formatVnd(Number(line.unit_price) * Number(line.quantity))}</span>
        </div>`).join('');
      $('sSub').textContent = FW.formatVnd(summary.subtotal);
      $('sDisc').textContent = summary.discount ? '− ' + FW.formatVnd(summary.discount) : '0 đ';
      $('sCode').textContent = summary.voucher_code ? `(${e(summary.voucher_code)})` : '';
      $('sTotal').textContent = FW.formatVnd(summary.total);
    } catch (error) {
      $('orderLines').innerHTML = `<p class="text-rose">${e(error.message || 'Không tải được thông tin giỏ hàng.')}</p>`;
      const submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = true;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = form.elements;
    const name = fields.name.value.trim();
    const phone = fields.phone.value.replace(/\s/g, '');
    const address = fields.address.value.trim();
    const note = fields.note.value.trim();
    const ok = {
      name: name.length > 0 && name.length <= 150,
      phone: /^0\d{9}$/.test(phone),
      address: address.length > 0 && address.length <= 500,
      note: note.length <= 300,
      date: fields.date.value !== '' && fields.date.value >= fields.date.min
    };

    Object.entries(ok).forEach(([key, valid]) => fields[key].classList.toggle('is-invalid', !valid));
    const firstBad = Object.keys(ok).find((key) => !ok[key]);
    if (firstBad) {
      fields[firstBad].scrollIntoView({ block: 'center', behavior: 'smooth' });
      fields[firstBad].focus({ preventScroll: true });
      return;
    }

    const dateAndSlot = `Ngày giao: ${fields.date.value}; khung giờ: ${fields.slot.value}`;
    const deliveryNote = [dateAndSlot, note].filter(Boolean).join(' — ').slice(0, 300);
    const data = {
      name,
      phone,
      address,
      date: fields.date.value,
      slot: fields.slot.value,
      note: deliveryNote
    };
    try { localStorage.setItem('fw_checkout', JSON.stringify(data)); } catch (_) {}
    if (quoteId) data.quote_id = quoteId;
    location.href = FW.url('shop/payment.html' + (quoteId ? '?quote_id=' + encodeURIComponent(quoteId) : ''));
  });

  init();
})();
