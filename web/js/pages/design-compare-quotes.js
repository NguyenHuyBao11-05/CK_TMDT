const requestId = Number(new URLSearchParams(location.search).get('id'))
const quoteList = document.getElementById('quoteList')
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'))
const rejectModal = new bootstrap.Modal(document.getElementById('rejectModal'))
const sortSelect = document.getElementById('sortSelect')
const e = FW.escapeHtml

const STATUS_TEXT = {
  OPEN: '<i class="fa-solid fa-circle-check me-1"></i>Đang nhận báo giá',
  CONFIRMED: '<i class="fa-solid fa-handshake me-1"></i>Đã xác nhận đặt',
  CANCELLED: '<i class="fa-solid fa-ban me-1"></i>Đã huỷ',
}

let request = null


function formatDate(value) {
  const d = new Date(value)
  const pad = function (n) { return String(n).padStart(2, '0') }
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ', ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear()
}

function selectedQuote() {
  return request.quotes.find(function (q) { return q.id === request.selected_quote_id })
}

function priceDiffText(price) {
  const budget = request.budget
  if (price < budget) return '<span class="price-diff text-forest"><i class="fa-solid fa-arrow-down me-1"></i>Thấp hơn ngân sách ' + FW.formatVnd(budget - price) + '</span>'
  if (price > budget) return '<span class="price-diff text-rose"><i class="fa-solid fa-arrow-up me-1"></i>Cao hơn ngân sách ' + FW.formatVnd(price - budget) + '</span>'
  return '<span class="price-diff text-forest"><i class="fa-solid fa-check me-1"></i>Khớp ngân sách</span>'
}

function chooseButton(q) {
  if (q.id === request.selected_quote_id) {
    return '<button type="button" class="btn btn-forest w-100" disabled><i class="fa-solid fa-check me-1"></i>Đã chọn</button>'
  }
  if (request.status !== 'OPEN' || q.status === 'REJECTED' || request.hidden_reason) {
    return '<button type="button" class="btn btn-ghost w-100" disabled>Không được chọn</button>'
  }
  return '<button type="button" class="btn btn-peach w-100" data-choose="' + q.id + '">' + (request.selected_quote_id ? 'Chọn báo giá này thay thế' : 'Chọn báo giá này') + ' <i class="fa-solid fa-arrow-right ms-1"></i></button>'
}

function sortedQuotes() {
  const list = request.quotes.slice()
  if (sortSelect.value === 'days') list.sort(function (a, b) { return a.estimated_days - b.estimated_days || a.price - b.price })
  else if (sortSelect.value === 'newest') list.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at) })
  else list.sort(function (a, b) { return a.price - b.price })
  return list
}

function renderSummary() {
  document.querySelectorAll('.request-code-text').forEach(function (el) { el.textContent = '#YC-' + request.id })
  document.getElementById('requestImage').src = FW_API.imageUrl(request.reference_image_url)
  document.getElementById('requestCreated').textContent = formatDate(request.created_at)
  document.getElementById('requestStatus').innerHTML = STATUS_TEXT[request.status]
  document.getElementById('requestTitle').textContent = request.title
  document.getElementById('requestOccasion').textContent = request.occasion
  document.getElementById('requestMaterial').textContent = request.material_preference
  document.getElementById('requestColor').textContent = request.color_preference
  document.getElementById('requestDate').textContent = formatDate(request.desired_date)
  document.getElementById('requestQuantity').textContent = request.quantity
  document.getElementById('requestDescription').textContent = request.description
  document.getElementById('requestBudget').textContent = FW.formatVnd(request.budget)
  document.getElementById('quoteCount').textContent = request.quotes.length + ' đề xuất'
  document.getElementById('rejectAllBtn').disabled = request.status !== 'OPEN' || request.quotes.length === 0 || !!request.hidden_reason
}

function renderBanners() {
  const banner = document.getElementById('selectedBanner')
  const text = document.getElementById('selectedText')
  const action = document.getElementById('selectedAction')
  const q = selectedQuote()
  document.getElementById('cancelledBanner').hidden = request.status !== 'CANCELLED'
  document.getElementById('hiddenBanner').hidden = !request.hidden_reason
  document.getElementById('hiddenReason').textContent = request.hidden_reason || ''
  banner.hidden = !q || request.status === 'CANCELLED' || !!request.hidden_reason
  if (!q) return

  if (request.status === 'OPEN') {
    text.innerHTML = '<i class="fa-solid fa-circle-check me-2"></i>Bạn đã chọn báo giá của <strong>' + e(q.partner_name) + '</strong> (' + FW.formatVnd(q.price) + '). Bạn vẫn có thể chọn lại trước khi xác nhận đặt.'
    action.innerHTML = 'Xác nhận đặt <i class="fa-solid fa-arrow-right ms-1"></i>'
    action.dataset.action = 'confirm'
  } else {
    text.innerHTML = '<i class="fa-solid fa-circle-check me-2"></i>Bạn đã xác nhận đặt theo báo giá của <strong>' + e(q.partner_name) + '</strong>.'
      + (request.order_status ? ' Đơn hàng đã được tạo.' : ' Hãy tiếp tục thanh toán để hoàn tất đơn hàng.')
    action.innerHTML = request.order_status ? 'Xem đơn hàng' : 'Tiếp tục thanh toán <i class="fa-solid fa-arrow-right ms-1"></i>'
    action.dataset.action = request.order_status ? 'orders' : 'payment'
  }
}

function renderQuotes() {
  if (request.quotes.length === 0) {
    quoteList.innerHTML = '<div class="alert alert-light text-center"><i class="fa-regular fa-hourglass-half me-2"></i>Đang chờ Đối tác báo giá. Bạn sẽ nhận được thông báo khi có shop gửi đề xuất.</div>'
    return
  }
  const cheapest = Math.min.apply(null, request.quotes.map(function (q) { return q.price }))
  let html = ''
  sortedQuotes().forEach(function (q) {
    const best = q.price === cheapest && request.status === 'OPEN' && !request.selected_quote_id
    let cardClass = 'quote-card'
    if (best) cardClass += ' best'
    if (q.id === request.selected_quote_id) cardClass += ' selected'
    if (q.id !== request.selected_quote_id && (request.status !== 'OPEN' || q.status === 'REJECTED')) cardClass += ' faded'

    html += `
      <article class="${cardClass}">
        ${best ? '<div class="best-label"><i class="fa-solid fa-star me-1"></i>Giá tốt nhất</div>' : ''}
        <div class="quote-body">
          <div class="row g-4">
            <div class="col-lg-3">
              <div class="shop-avatar">${e(q.partner_name.charAt(0))}</div>
              <div class="shop-name">${e(q.partner_name)}</div>
              <div class="small text-forest mb-2"><i class="fa-solid fa-certificate me-1"></i>Đối tác đã được duyệt</div>
              <div class="shop-meta">
                <div><i class="fa-regular fa-clock"></i>Gửi lúc ${formatDate(q.created_at)}</div>
              </div>
            </div>

            <div class="col-lg-5">
              <div class="d-flex flex-wrap gap-2 align-items-center">
                <span class="plan-chip">Báo giá #${q.id}</span>
                <span class="small text-muted-fw"><i class="fa-regular fa-clock me-1"></i>Hoàn thành trong ${q.estimated_days} ngày</span>
              </div>
              <p class="plan-text">"${e(q.description || 'Đối tác không ghi thêm mô tả.')}"</p>
            </div>

            <div class="col-lg-4">
              <div class="price-box">
                ${q.sample_image_url ? '<div class="small text-muted-fw mb-2">Ảnh mẫu minh hoạ</div><img src="' + e(FW_API.imageUrl(q.sample_image_url)) + '" alt="Mẫu hoa của ' + e(q.partner_name) + '">' : ''}
                <div class="d-flex justify-content-between align-items-end mt-3 mb-3">
                  <div>
                    <div class="quote-price">${FW.formatVnd(q.price)}</div>
                    ${priceDiffText(q.price)}
                  </div>
                  <div class="small text-muted-fw text-end">Tổng giá<br>cho cả yêu cầu</div>
                </div>
                ${chooseButton(q)}
              </div>
            </div>
          </div>
        </div>
      </article>`
  })
  quoteList.innerHTML = html
}

function render() {
  renderSummary()
  renderBanners()
  renderQuotes()
}

async function loadRequest() {
  if (!requestId) {
    quoteList.innerHTML = '<div class="alert alert-light text-center">Không tìm thấy yêu cầu. <a href="my-requests.html">Quay lại danh sách</a></div>'
    return
  }
  try {
    request = await FW_API.getDesignRequest(requestId)
    render()
  } catch (error) {
    quoteList.innerHTML = '<div class="alert alert-light text-center text-rose">' + e(error.message) + ' <a href="my-requests.html">Quay lại danh sách</a></div>'
  }
}


quoteList.addEventListener('click', async function (event) {
  const button = event.target.closest('[data-choose]')
  if (!button) return
  try {
    await FW_API.selectQuote(requestId, Number(button.dataset.choose))
    await loadRequest()
    FW.toast('Đã chọn báo giá của ' + selectedQuote().partner_name)
    window.scrollTo({ top: document.getElementById('selectedBanner').offsetTop - 100, behavior: 'smooth' })
  } catch (error) {
    FW.toast(error.message)
  }
})

document.getElementById('selectedAction').addEventListener('click', function () {
  const action = this.dataset.action
  const q = selectedQuote()
  if (action === 'orders') {
    location.href = '../account/orders.html'
    return
  }
  if (action === 'payment') {
    location.href = '../shop/payment.html?quote_id=' + q.id
    return
  }
  document.getElementById('confirmBody').innerHTML = `
    <p class="small text-muted-fw">Kiểm tra lại thông tin trước khi đặt. Sau khi xác nhận, các báo giá khác sẽ không còn hiệu lực.</p>
    <div class="confirm-row"><span>Shop thực hiện</span><strong>${e(q.partner_name)}</strong></div>
    <div class="confirm-row"><span>Thời gian hoàn thành</span><strong>${q.estimated_days} ngày</strong></div>
    <div class="confirm-row"><span>Số lượng</span><strong>${request.quantity}</strong></div>
    <div class="confirm-row"><span>Hẹn giao</span><strong>${formatDate(request.desired_date)}</strong></div>
    <div class="confirm-row"><span>Tổng giá</span><strong class="text-rose">${FW.formatVnd(q.price)}</strong></div>`
  confirmModal.show()
})

document.getElementById('confirmBtn').addEventListener('click', async function () {
  try {
    const result = await FW_API.confirmDesignRequest(requestId)
    confirmModal.hide()
    FW.toast('Đã xác nhận đặt, chuyển sang thanh toán...')
    setTimeout(function () {
      location.href = '../shop/payment.html?quote_id=' + result.quote_id
    }, 1000)
  } catch (error) {
    confirmModal.hide()
    FW.toast(error.message)
  }
})

document.getElementById('rejectAllBtn').addEventListener('click', function () {
  rejectModal.show()
})

document.getElementById('rejectConfirmBtn').addEventListener('click', async function () {
  try {
    await FW_API.cancelDesignRequest(requestId)
    rejectModal.hide()
    FW.toast('Đã huỷ yêu cầu #YC-' + requestId)
    loadRequest()
  } catch (error) {
    rejectModal.hide()
    FW.toast(error.message)
  }
})

sortSelect.addEventListener('change', renderQuotes)


loadRequest()
