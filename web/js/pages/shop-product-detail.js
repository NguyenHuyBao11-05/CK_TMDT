(function () {
  'use strict'
  const $ = (id) => document.getElementById(id)
  const e = FW.escapeHtml
  const id = new URLSearchParams(location.search).get('id')
  let product = null
  let qty = 1

  async function init() {
    product = id ? await FW_API.getProductById(id) : null
    if (!product) { $('notFound').hidden = false; return }
    const hasDiscount = product.discount_price != null && product.discount_price < product.price
    document.title = product.name + ' — Fw12 Floral'
    $('crumbName').textContent = product.name
    $('pImg').src = product.thumbnail_url
    $('pImg').alt = product.name
    $('pName').textContent = product.name
    $('pPartner').textContent = product.partner_name
    $('pMaterial').textContent = product.material
    $('pRating').textContent = Number(product.rating).toFixed(1)
    $('pSold').textContent = product.total_sold ? `· Đã bán ${product.total_sold}` : ''
    $('pPrice').textContent = FW.formatVnd(hasDiscount ? product.discount_price : product.price)
    $('pOld').textContent = hasDiscount ? FW.formatVnd(product.price) : ''
    $('detail').hidden = false
    $('extra').hidden = false
    loadReviews()
    loadComments()
  }

  async function loadReviews() {
    const list = await FW_API.getReviews(product.id)
    $('reviewList').innerHTML = list.length ? list.map((r) => `
      <div class="p-3 bg-white border rounded-4">
        <div class="d-flex justify-content-between"><strong>${e(r.author)}</strong>
          <span class="text-rose">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></div>
        <p class="mb-1">${e(r.content)}</p><div class="small text-muted-fw">${e(r.created_at)}</div>
      </div>`).join('') : '<p class="text-muted-fw">Chưa có đánh giá.</p>'
  }

  async function loadComments() {
    const can = await FW_API.canComment(product.id)
    $('commentForm').hidden = !can
    $('commentLock').hidden = can
    const list = await FW_API.getComments(product.id)
    $('commentList').innerHTML = list.length ? list.map((c) => `
      <div class="p-3 bg-white border rounded-4">
        <strong>${e(c.author)}</strong> <span class="small text-muted-fw ms-1">${e(c.created_at)}</span>
        <p class="mb-0">${e(c.content)}</p>
      </div>`).join('') : '<p class="text-muted-fw">Chưa có bình luận.</p>'
  }

  $('qtyMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('qtyVal').textContent = qty })
  $('qtyPlus').addEventListener('click', () => { qty = Math.min(99, qty + 1); $('qtyVal').textContent = qty })
  $('addBtn').addEventListener('click', () => FW.cart.add(product.id, product.name, qty))
  $('buyBtn').addEventListener('click', () => {
    FW.cart.add(product.id, product.name, qty)
    location.href = FW.url('shop/cart.html')
  })
  $('commentForm').addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const content = ev.target.content.value.trim()
    if (!content) return
    await FW_API.addComment(product.id, content)
    ev.target.reset()
    loadComments()
  })

  init()
})()
