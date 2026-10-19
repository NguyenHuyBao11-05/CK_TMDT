const requestList = document.getElementById('requestList')
const requestDetail = document.getElementById('requestDetail')
const budgetHint = document.getElementById('budgetHint')
const quoteForm = document.getElementById('quoteForm')
const quoteNotice = document.getElementById('quoteNotice')
const searchInput = document.getElementById('searchInput')
const occasionFilter = document.getElementById('occasionFilter')
const sortSelect = document.getElementById('sortSelect')
const modal = new bootstrap.Modal(document.getElementById('quoteModal'))
const e = FW.escapeHtml

let requests = []
let currentRequest = null


function formatDate(value) {
  const d = new Date(value)
  const pad = function (n) { return String(n).padStart(2, '0') }
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' lúc ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function timeLeft(value) {
  const hours = Math.floor((new Date(value) - new Date()) / 3600000)
  if (hours < 24) return 'Còn ' + Math.max(hours, 0) + ' giờ'
  return 'Còn ' + Math.floor(hours / 24) + ' ngày'
}

function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
}

function statusBadge(r) {
  if (r.my_quote_id) return '<span class="status-badge">Bạn đã báo giá</span>'
  if (r.has_selected) return '<span class="status-badge">Đã có shop được chọn</span>'
  return '<span class="status-badge">Đang nhận báo giá</span>'
}

function visibleRequests() {
  const keyword = normalize(searchInput.value.trim())
  const list = requests.filter(function (r) {
    if (occasionFilter.value && r.occasion !== occasionFilter.value) return false
    if (!keyword) return true
    return normalize(r.title + ' ' + r.color_preference + ' ' + r.material_preference + ' ' + r.description).includes(keyword)
  })
  if (sortSelect.value === 'deadline') list.sort(function (a, b) { return new Date(a.desired_date) - new Date(b.desired_date) })
  else if (sortSelect.value === 'budget') list.sort(function (a, b) { return b.budget - a.budget })
  else list.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at) })
  return list
}

function renderList() {
  const list = visibleRequests()
  if (list.length === 0) {
    requestList.innerHTML = '<div class="col-12"><div class="alert alert-light text-center mb-0">'
      + (requests.length ? 'Không có yêu cầu nào phù hợp với bộ lọc.' : 'Hiện chưa có yêu cầu thiết kế nào đang mở.') + '</div></div>'
    return
  }
  let html = ''
  list.forEach(function (r) {
    html += `
      <div class="col-md-6 col-lg-4">
        <article class="request-card">
          <div class="request-thumb">
            <img src="${e(FW_API.imageUrl(r.reference_image_url))}" alt="${e(r.title)}">
            ${statusBadge(r)}
            <span class="deadline-badge"><i class="fa-regular fa-clock me-1"></i>${timeLeft(r.desired_date)}</span>
          </div>
          <div class="request-body">
            <div class="request-code">#YC-${r.id} · Khách ${e(r.customer_name)}</div>
            <h2 class="request-title">${e(r.title)}</h2>
            <div>
              <span class="tag green">${e(r.occasion)}</span>
              <span class="tag">${e(r.material_preference)}</span>
              <span class="tag">${e(r.color_preference)}</span>
              <span class="tag">${r.quantity} bó</span>
            </div>
            <div class="request-info">
              <div class="d-flex justify-content-between align-items-end">
                <div>
                  <div class="label-small">Ngân sách dự kiến</div>
                  <div class="request-budget">${FW.formatVnd(r.budget)}</div>
                </div>
                <div class="small text-forest"><i class="fa-solid fa-store me-1"></i>${r.quote_count} shop đã báo</div>
              </div>
              <div class="small text-muted-fw mt-2"><i class="fa-regular fa-calendar me-1"></i>Giao: ${formatDate(r.desired_date)}</div>
              <button type="button" class="btn btn-forest w-100 mt-3" data-id="${r.id}">
                Xem chi tiết${r.my_quote_id || r.has_selected ? '' : ' &amp; Báo giá'} <i class="fa-solid fa-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </article>
      </div>`
  })
  requestList.innerHTML = html
}

async function loadRequests() {
  try {
    requests = await FW_API.getForumRequests()
    renderList()
  } catch (error) {
    requestList.innerHTML = '<div class="col-12"><div class="alert alert-light text-center text-rose mb-0">' + e(error.message) + '</div></div>'
  }
}


function setFormEnabled(enabled) {
  quoteForm.querySelectorAll('input, textarea, button').forEach(function (el) { el.disabled = !enabled })
}

function openModal(id) {
  currentRequest = requests.find(function (r) { return r.id === Number(id) })

  requestDetail.innerHTML = `
    <span class="badge text-bg-dark mb-2">Yêu cầu #YC-${currentRequest.id}</span>
    <div class="small text-muted-fw mb-2"><i class="fa-regular fa-user me-1"></i>Khách ${e(currentRequest.customer_name)}</div>
    <h3 class="h4 mb-3">${e(currentRequest.title)}</h3>
    <div class="detail-box row g-3 mx-0 mb-3">
      <div class="col-6"><div class="label-small">Ngân sách mong muốn</div><div class="request-budget text-forest">${FW.formatVnd(currentRequest.budget)}</div></div>
      <div class="col-6"><div class="label-small">Dịp tặng hoa</div><div class="fw-semibold">${e(currentRequest.occasion)}</div></div>
      <div class="col-6"><div class="label-small">Thời gian giao</div><div class="fw-semibold text-rose">${formatDate(currentRequest.desired_date)}</div></div>
      <div class="col-6"><div class="label-small">Tông màu</div><div class="fw-semibold">${e(currentRequest.color_preference)}</div></div>
      <div class="col-6"><div class="label-small">Chất liệu</div><div class="fw-semibold">${e(currentRequest.material_preference)}</div></div>
      <div class="col-6"><div class="label-small">Số lượng</div><div class="fw-semibold">${currentRequest.quantity} bó / lẵng</div></div>
    </div>
    <img class="detail-image mb-3" src="${e(FW_API.imageUrl(currentRequest.reference_image_url))}" alt="Ảnh khách tham khảo">
    <div class="detail-box">
      <div class="small fw-semibold mb-2"><i class="fa-regular fa-comment me-1"></i>Mô tả của khách</div>
      <p class="detail-note mb-0">${e(currentRequest.description)}</p>
    </div>`

  budgetHint.textContent = 'Khách đặt: ' + FW.formatVnd(currentRequest.budget)
  quoteForm.reset()
  quoteForm.classList.remove('was-validated')

  if (currentRequest.my_quote_id) {
    quoteNotice.innerHTML = '<i class="fa-solid fa-circle-check text-forest me-1"></i>Bạn đã gửi báo giá cho yêu cầu này. Xem trạng thái ở <a href="sent-quotes.html">Báo giá đã gửi</a>.'
  } else if (currentRequest.has_selected) {
    quoteNotice.innerHTML = '<i class="fa-solid fa-lock me-1"></i>Yêu cầu đã có Đối tác được chọn, không nhận thêm báo giá.'
  }
  quoteNotice.hidden = !currentRequest.my_quote_id && !currentRequest.has_selected
  setFormEnabled(quoteNotice.hidden)
  modal.show()
}

requestList.addEventListener('click', function (event) {
  const button = event.target.closest('[data-id]')
  if (button) openModal(button.dataset.id)
})


quoteForm.addEventListener('submit', async function (event) {
  event.preventDefault()
  quoteForm.classList.add('was-validated')
  if (!quoteForm.checkValidity()) return

  const imageFile = document.getElementById('quoteImage').files[0]
  if (imageFile && imageFile.size > 2 * 1024 * 1024) {
    FW.toast('Ảnh vượt quá 2MB, vui lòng chọn ảnh nhỏ hơn.')
    return
  }

  setFormEnabled(false)
  try {
    let sampleImageUrl = ''
    if (imageFile) {
      sampleImageUrl = (await FW_API.uploadImage(imageFile)).url
    }
    await FW_API.sendQuote(currentRequest.id, {
      price: Number(document.getElementById('quotePrice').value),
      estimated_days: Number(document.getElementById('quoteDays').value),
      description: document.getElementById('quoteDescription').value.trim(),
      sample_image_url: sampleImageUrl,
    })
  } catch (error) {
    setFormEnabled(true)
    FW.toast(error.message)
    return
  }

  modal.hide()
  FW.toast('Đã gửi báo giá cho yêu cầu #YC-' + currentRequest.id)
  loadRequests()
})


searchInput.addEventListener('input', renderList)
occasionFilter.addEventListener('change', renderList)
sortSelect.addEventListener('change', renderList)


loadRequests()
