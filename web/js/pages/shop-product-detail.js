(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const e = FW.escapeHtml;
  const id = new URLSearchParams(location.search).get('id');
  let product = null;
  let qty = 1;

  function imageUrl(url) {
    return FW_API.imageUrl ? FW_API.imageUrl(url) : url;
  }

  async function init() {
    try {
      product = id ? await FW_API.getProductById(id) : null;
      if (!product) {
        $('notFound').hidden = false;
        return;
      }

      const discounted = product.discount_price != null && product.discount_price < product.price;
      document.title = product.name + ' — Fw12 Floral';
      $('crumbName').textContent = product.name;
      $('pImg').src = imageUrl((product.images && product.images[0]) || product.thumbnail_url);
      $('pImg').alt = product.name;
      $('pName').textContent = product.name;
      $('pPartner').textContent = product.partner_name || 'Đối tác Fw12';
      $('pMaterial').textContent = product.material || '';
      $('pRating').textContent = Number(product.rating || 0).toFixed(1);
      $('pSold').textContent = product.total_sold ? `· Đã bán ${product.total_sold}` : '';
      $('pPrice').textContent = FW.formatVnd(discounted ? product.discount_price : product.price);
      $('pOld').textContent = discounted ? FW.formatVnd(product.price) : '';
      $('pDescription').textContent = product.description || 'Chưa có mô tả cho sản phẩm này.';
      $('pStock').textContent = 'Đặt theo mẫu, Đối tác sẽ nhận đơn và cắm hoa cho bạn.';
      $('detail').hidden = false;
      $('extra').hidden = false;

      $('qtyPlus').disabled = false;

      await Promise.allSettled([loadReviews(), loadComments(), loadRelated()]);
    } catch (error) {
      console.error(error);
      $('notFound').hidden = false;
      $('notFound').querySelector('p').textContent =
          error.message || 'Không tải được sản phẩm. Vui lòng thử lại.';
    }
  }

  async function loadReviews() {
    const list = await FW_API.getReviews(product.id);
    $('reviewList').innerHTML = list.length ? list.map((r) => `
      <div class="p-3 bg-white border rounded-4">
        <div class="d-flex justify-content-between">
          <strong>${e(r.author || 'Khách hàng')}</strong>
          <span class="text-rose">${'★'.repeat(Number(r.rating || 0))}${'☆'.repeat(5 - Number(r.rating || 0))}</span>
        </div>
        <p class="mb-1">${e(r.content || '')}</p>
        <div class="small text-muted-fw">${e(r.created_at || '')}</div>
      </div>`).join('') : '<p class="text-muted-fw">Chưa có đánh giá.</p>';
  }

  async function loadComments() {
    let can = false;
    try {
      can = await FW_API.canComment(product.id);
    } catch (_) {
      can = false;
    }
    $('commentForm').hidden = !can;
    $('commentLock').hidden = can;
    const list = await FW_API.getComments(product.id);
    $('commentList').innerHTML = list.length ? list.map((c) => `
      <div class="p-3 bg-white border rounded-4">
        <strong>${e(c.author || 'Khách hàng')}</strong>
        <span class="small text-muted-fw ms-1">${e(c.created_at || '')}</span>
        <p class="mb-0">${e(c.content || '')}</p>
      </div>`).join('') : '<p class="text-muted-fw">Chưa có bình luận.</p>';
  }

  async function loadRelated() {
    const list = await FW_API.getRelatedProducts(product.id);
    $('relatedList').innerHTML = list.length
        ? list.map((p) => `<div class="col-6 col-lg-3">${FW.renderProductCard(p)}</div>`).join('')
        : '<p class="text-muted-fw">Chưa có sản phẩm liên quan.</p>';
    $('relatedSection').hidden = false;
  }

  $('qtyMinus').addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    $('qtyVal').textContent = qty;
  });

  $('qtyPlus').addEventListener('click', () => {
    qty = Math.min(50, qty + 1);
    $('qtyVal').textContent = qty;
  });

  async function addToCart(goToCart) {
    if (!product) return;
    try {
      await FW.cart.add(product.id, product.name, qty);
      if (goToCart) location.href = FW.url('shop/cart.html');
    } catch (error) {
      FW.toast(error.message || 'Không thể thêm sản phẩm vào giỏ.');
    }
  }

  $('addBtn').addEventListener('click', () => addToCart(false));
  $('buyBtn').addEventListener('click', () => addToCart(true));

  $('commentForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const content = event.target.content.value.trim();
    if (content.length < 5 || content.length > 1000) {
      FW.toast('Bình luận phải từ 5 đến 1000 ký tự.');
      return;
    }
    const button = event.submitter;
    if (button) button.disabled = true;
    try {
      await FW_API.addComment(product.id, content);
      event.target.reset();
      await loadComments();
      FW.toast('Đã gửi bình luận.');
    } catch (error) {
      FW.toast(error.message || 'Không gửi được bình luận.');
    } finally {
      if (button) button.disabled = false;
    }
  });

  init();
})();
