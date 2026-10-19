const STATUS = {
  PENDING: '<span class="status-chip pending"><i class="fa-regular fa-hourglass-half me-1"></i>Chờ khách chọn</span>',
  SELECTED: '<span class="status-chip selected"><i class="fa-solid fa-circle-check me-1"></i>Được chọn</span>',
  REJECTED: '<span class="status-chip rejected"><i class="fa-solid fa-circle-xmark me-1"></i>Bị từ chối</span>',
}
const TAB_STATUS = ['', 'PENDING', 'SELECTED', 'REJECTED']

const quoteTable = document.getElementById('quoteTable')
const detailModal = new bootstrap.Modal(document.getElementById('detailModal'))
const searchInput = document.querySelector('.quote-toolbar input[type="search"]')
const e = FW.escapeHtml

let sentQuotes = []
let statusFilter = ''


function formatDay(value) {
  const d = new Date(value)
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
}

function formatDateTime(value) {
  const d = new Date(value)
  return formatDay(value) + ' lúc ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

function renderMessage(message) {
  quoteTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted-fw py-4">' + message + '</td></tr>'
}

function renderTable() {
  document.getElementById('countAll').textContent = sentQuotes.length
  document.getElementById('countPending').textContent = sentQuotes.filter(function (q) { return q.status === 'PENDING' }).length
  document.getElementById('countSelected').textContent = sentQuotes.filter(function (q) { return q.status === 'SELECTED' }).length
  document.getElementById('countRejected').textContent = sentQuotes.filter(function (q) { return q.status === 'REJECTED' }).length

  const keyword = searchInput.value.trim().toLowerCase()
  const list = sentQuotes.filter(function (q) {
    if (statusFilter && q.status !== statusFilter) return false
    return !keyword || ('#yc-' + q.request_id + ' ' + q.request_title).toLowerCase().includes(keyword)
  })
  if (list.length === 0) {
    renderMessage(sentQuotes.length ? 'Không có báo giá nào ở trạng thái này.' : 'Bạn chưa gửi báo giá nào. <a href="forum.html">Vào diễn đàn yêu cầu</a>')
    return
  }

  let html = ''
  list.forEach(function (q) {
    html += `
      <tr>
        <td>
          <div class="request-cell">
            <img src="${e(FW_API.imageUrl(q.reference_image_url))}" alt="">
            <div>
              <div class="code">#YC-${q.request_id} · Khách ${e(q.customer_name)}</div>
              <div class="title">${e(q.request_title)}</div>
            </div>
          </div>
        </td>
        <td class="fw-semibold text-nowrap">${FW.formatVnd(q.price)}</td>
        <td class="d-none d-md-table-cell text-nowrap">${q.estimated_days} ngày</td>
        <td class="d-none d-lg-table-cell text-nowrap">${formatDay(q.created_at)}</td>
        <td>${STATUS[q.status]}</td>
        <td class="text-end">
          <button type="button" class="btn btn-ghost btn-sm text-nowrap" data-id="${q.id}">Xem <i class="fa-solid fa-chevron-right ms-1"></i></button>
        </td>
      </tr>`
  })
  quoteTable.innerHTML = html
}

async function loadQuotes() {
  try {
    sentQuotes = await FW_API.getSentQuotes()
    renderTable()
  } catch (error) {
    renderMessage(e(error.message))
  }
}


function resultText(q) {
  const icon = q.status === 'SELECTED' ? 'fa-solid fa-circle-check text-forest' : q.status === 'REJECTED' ? 'fa-solid fa-circle-xmark text-rose' : 'fa-regular fa-hourglass-half'
  return '<div class="result-box ' + q.status.toLowerCase() + '"><i class="' + icon + ' me-2"></i>' + e(q.result_note) + '</div>'
}

function openDetail(id) {
  const q = sentQuotes.find(function (x) { return x.id === Number(id) })
  const sample = q.sample_image_url
    ? '<div class="col-md-5"><img class="detail-photo" src="' + e(FW_API.imageUrl(q.sample_image_url)) + '" alt="Ảnh mẫu đã gửi"></div>'
    : ''

  document.getElementById('detailTitle').textContent = 'Báo giá cho yêu cầu #YC-' + q.request_id
  document.getElementById('detailBody').innerHTML = `
    <div class="d-flex gap-3 align-items-center mb-3">
      <img src="${e(FW_API.imageUrl(q.reference_image_url))}" alt="" style="width: 72px; height: 72px; object-fit: cover; border-radius: 12px">
      <div>
        <div class="small text-muted-fw">Khách ${e(q.customer_name)}</div>
        <h3 class="h5 mb-1">${e(q.request_title)}</h3>
        ${STATUS[q.status]}
      </div>
    </div>

    <div class="detail-grid row g-3 mx-0 mb-3">
      <div class="col-6 col-md-3"><div class="detail-label">Ngân sách của khách</div><div class="detail-value">${FW.formatVnd(q.budget)}</div></div>
      <div class="col-6 col-md-3"><div class="detail-label">Giá bạn báo</div><div class="detail-value text-rose">${FW.formatVnd(q.price)}</div></div>
      <div class="col-6 col-md-3"><div class="detail-label">Thời gian làm</div><div class="detail-value">${q.estimated_days} ngày</div></div>
      <div class="col-6 col-md-3"><div class="detail-label">Hẹn giao</div><div class="detail-value">${formatDateTime(q.desired_date)}</div></div>
    </div>

    <div class="row g-3 mb-3">
      <div class="${q.sample_image_url ? 'col-md-7' : 'col-12'}">
        <div class="small fw-semibold mb-1">Mô tả cách làm bạn đã gửi</div>
        <p class="fst-italic mb-0">"${e(q.description)}"</p>
        <div class="small text-muted-fw mt-2">Gửi lúc ${formatDateTime(q.created_at)} · Số lượng ${q.quantity} bó</div>
      </div>
      ${sample}
    </div>

    ${resultText(q)}`

  detailModal.show()
}

quoteTable.addEventListener('click', function (event) {
  const button = event.target.closest('[data-id]')
  if (button) openDetail(button.dataset.id)
})

const tabButtons = document.querySelectorAll('.filter-chips button')
tabButtons.forEach(function (button, index) {
  button.addEventListener('click', function () {
    tabButtons.forEach(function (b) { b.classList.remove('active') })
    button.classList.add('active')
    statusFilter = TAB_STATUS[index] || ''
    renderTable()
  })
})

searchInput.addEventListener('input', renderTable)


loadQuotes()
