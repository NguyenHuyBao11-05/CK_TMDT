(function () {
  'use strict';

  const API = window.FW_API;
  const money = (v) => Number(v || 0);
  const normalizeProduct = (p) => p && ({
    ...p,
    id: Number(p.id),
    price: money(p.price),
    discount_price: p.discount_price == null ? null : money(p.discount_price),
    rating: money(p.rating),
    total_sold: Number(p.total_sold || 0),
    partner_name: p.partner_name || p.full_name || '',
    thumbnail_url: p.thumbnail_url || '',
    badge: p.badge || null
  });

  const queryString = (values) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    return params.toString();
  };

  function mapCartLine(line) {
    return {
      ...line,
      product_id: Number(line.product_id),
      name: line.name || line.item_name || '',
      unit_price: money(line.unit_price ?? line.discount_price ?? line.price),
      quantity: Number(line.quantity || 1),
      price: money(line.price),
      discount_price: line.discount_price == null ? null : money(line.discount_price),
      partner_name: line.partner_name || ''
    };
  }

  async function getCart() {
    const data = await callServer('/api/cart');
    return {
      ...data,
      lines: (data.lines || []).map(mapCartLine),
      subtotal: money(data.subtotal)
    };
  }

  API.getBestSellers = async function () {
    const list = await callServer('/api/products/best-sellers');
    return (list || []).map(normalizeProduct);
  };

  API.getNewProducts = async function () {
    const list = await callServer('/api/products/new');
    return (list || []).map(normalizeProduct);
  };

  API.getProducts = async function ({
    q = '',
    materials = [],
    min = 0,
    max = Infinity,
    sort = 'popular',
    page = 0
  } = {}) {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (materials.length) params.set('materials', materials.join(','));
    if (Number.isFinite(Number(min)) && Number(min) > 0) params.set('min', String(min));
    if (max !== Infinity && Number.isFinite(Number(max))) params.set('max', String(max));
    params.set('sort', sort === 'rating' ? 'popular' : sort);
    params.set('page', String(Math.max(0, Number(page) || 0)));

    const list = await callServer('/api/products?' + params.toString());
    return (list || []).map(normalizeProduct);
  };

  API.getProductById = async function (id) {
    try {
      return normalizeProduct(await callServer('/api/products/' + encodeURIComponent(id)));
    } catch (error) {
      if (/Không tìm thấy sản phẩm/i.test(error.message)) return null;
      throw error;
    }
  };

  API.getProductsByIds = async function (ids) {
    const results = await Promise.all((ids || []).map((id) => API.getProductById(id)));
    return results.filter(Boolean);
  };

  API.getRecommendations = async function () {
    const list = await callServer('/api/products/recommendations');
    return (list || []).map(normalizeProduct);
  };

  API.getRelatedProducts = async function (id) {
    const list = await callServer('/api/products/' + encodeURIComponent(id) + '/related');
    return (list || []).map(normalizeProduct);
  };

  API.getReviews = async function (productId) {
    const list = await callServer('/api/products/' + encodeURIComponent(productId) + '/reviews');
    return (list || []).map((r) => ({ ...r, rating: Number(r.rating), content: r.content || '' }));
  };

  API.getComments = async function (productId) {
    return callServer('/api/products/' + encodeURIComponent(productId) + '/comments');
  };

  API.canComment = async function (productId) {
    const result = await callServer('/api/products/' + encodeURIComponent(productId) + '/comments/can-comment');
    return !!result.can_comment;
  };

  API.addComment = async function (productId, content) {
    return callServer('/api/products/' + encodeURIComponent(productId) + '/comments', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  };

  API.getCart = getCart;

  API.addCartItem = async function (productId, quantity = 1, note = '') {
    const result = await callServer('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: Number(productId), quantity: Number(quantity), note })
    });
    const cart = { ...result, lines: (result.lines || []).map(mapCartLine), subtotal: money(result.subtotal) };
    try { localStorage.removeItem('fw_pending_order'); } catch (_) {}
    try {
      localStorage.setItem('fw_cart_items', JSON.stringify(cart.lines.map((line) => ({
        product_id: line.product_id, quantity: line.quantity
      }))));
    } catch (_) {}
    updateCartBadge(cart.lines);
    return cart;
  };

  API.updateCartQuantity = async function (productId, quantity) {
    const result = await callServer('/api/cart/items/' + encodeURIComponent(productId), {
      method: 'PUT',
      body: JSON.stringify({ quantity: Number(quantity) })
    });
    const cart = { ...result, lines: (result.lines || []).map(mapCartLine), subtotal: money(result.subtotal) };
    try { localStorage.removeItem('fw_pending_order'); } catch (_) {}
    try {
      localStorage.setItem('fw_cart_items', JSON.stringify(cart.lines.map((line) => ({
        product_id: line.product_id, quantity: line.quantity
      }))));
    } catch (_) {}
    updateCartBadge(cart.lines);
    return cart;
  };

  API.removeCartItem = async function (productId) {
    const result = await callServer('/api/cart/items/' + encodeURIComponent(productId), { method: 'DELETE' });
    const cart = { ...result, lines: (result.lines || []).map(mapCartLine), subtotal: money(result.subtotal) };
    try { localStorage.removeItem('fw_pending_order'); } catch (_) {}
    try {
      localStorage.setItem('fw_cart_items', JSON.stringify(cart.lines.map((line) => ({
        product_id: line.product_id, quantity: line.quantity
      }))));
    } catch (_) {}
    updateCartBadge(cart.lines);
    return cart;
  };

  API.validateVoucher = async function (code) {
    try {
      const result = await callServer('/api/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({ code: String(code || '').trim() })
      });
      return { ...result, ok: true, discount: money(result.discount), subtotal: money(result.subtotal), total: money(result.total) };
    } catch (error) {
      return { ok: false, message: error.message || 'Không thể kiểm tra voucher.' };
    }
  };

  API.getCartSummary = async function () {
    const cart = await getCart();
    let voucherCode = null;
    let discount = 0;
    try { voucherCode = localStorage.getItem('fw_voucher'); } catch (_) {}

    if (voucherCode && cart.lines.length) {
      const validation = await API.validateVoucher(voucherCode);
      if (validation.ok) {
        voucherCode = validation.code;
        discount = validation.discount;
      } else {
        voucherCode = null;
        try { localStorage.removeItem('fw_voucher'); } catch (_) {}
      }
    } else {
      voucherCode = null;
    }

    return {
      lines: cart.lines,
      subtotal: cart.subtotal,
      voucher_code: voucherCode,
      discount,
      total: Math.max(0, cart.subtotal - discount)
    };
  };

  API.getQuoteForPayment = async function (quoteId) {
    const data = await callServer('/api/design-requests/quotes/' + encodeURIComponent(quoteId) + '/payment');
    const lines = (data.lines || []).map((line) => ({
      product_id: line.product_id ?? line.productId ?? null,
      quote_id: line.quote_id ?? line.quoteId ?? null,
      design_request_id: line.design_request_id ?? line.designRequestId ?? null,
      partner_id: line.partner_id ?? line.partnerId ?? null,
      name: line.name || '',
      item_description: line.item_description || line.itemDescription || '',
      partner_name: line.partner_name || line.partnerName || '',
      thumbnail_url: line.thumbnail_url || line.thumbnailUrl || '',
      unit_price: money(line.unit_price ?? line.unitPrice),
      quantity: Number(line.quantity || 1)
    }));
    return {
      lines,
      subtotal: money(data.subtotal),
      voucher_code: data.voucher_code ?? data.voucherCode ?? null,
      discount: money(data.discount),
      total: money(data.total)
    };
  };

  API.createOrder = async function ({ recipient = {}, quote_id = null, voucher_code = null } = {}) {
    const body = {
      recipient_name: String(recipient.name || recipient.recipient_name || '').trim(),
      recipient_phone: String(recipient.phone || recipient.recipient_phone || '').replace(/\s/g, ''),
      delivery_address: String(recipient.address || recipient.delivery_address || '').trim(),
      delivery_note: String(recipient.note || recipient.delivery_note || '').trim(),
      voucher_code: voucher_code || '',
      quote_id: quote_id || recipient.quote_id || null
    };
    return callServer('/api/orders', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  API.payOrder = async function (orderCode) {
    return callServer('/api/orders/' + encodeURIComponent(orderCode) + '/pay', { method: 'POST' });
  };

  API.getOrderByCode = async function (code) {
    return callServer('/api/orders/by-code/' + encodeURIComponent(code));
  };

  API.sendInvoice = async function (code, email) {
    try {
      return await callServer('/api/orders/' + encodeURIComponent(code) + '/invoice', {
        method: 'POST',
        body: JSON.stringify({ email: String(email || '').trim() })
      });
    } catch (error) {
      return { ok: false, message: error.message || 'Không gửi được hoá đơn.' };
    }
  };

  function updateCartBadge(lines) {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    const count = (lines || []).reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  document.addEventListener('fw:partials-loaded', async function () {
    if (!document.getElementById('cartCount')) return;
    try {
      const cart = await getCart();
      try {
        localStorage.setItem('fw_cart_items', JSON.stringify(cart.lines.map((line) => ({
          product_id: line.product_id, quantity: line.quantity
        }))));
      } catch (_) {}
      updateCartBadge(cart.lines);
    } catch (_) {
      // Header vẫn hoạt động khi khách chưa đăng nhập/backend chưa chạy.
    }
  });
})();
