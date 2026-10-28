const STATUS_BADGE = {
  OPEN: '<span class="badge-soft gold">Đang nhận báo giá</span>',
  CONFIRMED: '<span class="badge-soft green">Đã chốt đơn</span>',
  CANCELLED: '<span class="badge-soft gray">Đã đóng</span>',
}

const QUOTE_BADGE = {
  PENDING: '<span class="badge-soft blue">Chờ khách chọn</span>',
  SELECTED: '<span class="badge-soft green">Được chọn</span>',
  REJECTED: '<span class="badge-soft gray">Không được chọn</span>',
}

const ORDER_TEXT = {
  PENDING: 'Chờ Đối tác nhận',
  PROCESSING: 'Đang thực hiện',
  SHIPPING: 'Đang giao',
  RECEIVED: 'Đã nhận hàng',
  CANCELLED: 'Đã huỷ',
}

const forumTable = document.getElementById('forumTable')
const pagination = document.getElementById('pagination')
const statusFilter = document.getElementById('statusFilter')
const visibilityFilter = document.getElementById('visibilityFilter')
const searchInput = document.getElementById('searchInput')
const detailModal = new bootstrap.Modal(document.getElementById('detailModal'))
const hideModal = new bootstrap.Modal(document.getElementById('hideModal'))
const hideReason = document.getElementById('hideReason')
const hideError = document.getElementById('hideError')

let items = []
let currentPage = 0
let current = null
let hideTarget = null


function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text == null ? '' : text
  return div.innerHTML
}

function formatDate(value) {
  const d = new Date(value)
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
}

function formatDateTime(value) {
  return formatDate(value) + ' ' + new Date(value).toTimeString().slice(0, 5)
}

function hiddenBadge() {
  return '<span class="badge-soft rose"><i class="fa-solid fa-eye-slash me-1"></i>Đã ẩn</span>'
}


function renderMessage(message) {
  forumTable.innerHTML = `<tr><td colspan="6" class="text-center text-muted-fw py-4">${escapeHtml(message)}</td></tr>`
}

function renderTable() {
  if (items.length === 0) {
    renderMessage('Không có yêu cầu nào phù hợp.')
    return
  }
  let html = ''
  items.forEach(function (r) {
    html += `
      <tr class="${r.hidden_at ? 'forum-row-hidden' : ''}">
        <td>
          <div class="fw-semibold">${escapeHtml(r.title)}</div>
          <div class="small text-muted-fw">#YC-${r.id} · ${escapeHtml(r.occasion || '')} · ${formatDate(r.created_at)}</div>
        </td>
        <td class="d-none d-lg-table-cell">
          <div>${escapeHtml(r.customer_name)}</div>
          <div class="small text-muted-fw">${escapeHtml(r.customer_email)}</div>
        </td>
        <td class="d-none d-md-table-cell text-end">${FW.formatVnd(r.budget)}</td>
        <td class="text-center">
          ${r.quote_count}
          ${r.hidden_quote_count > 0 ? '<div class="small text-rose">' + r.hidden_quote_count + ' bị ẩn</div>' : ''}
        </td>
        <td>
          ${STATUS_BADGE[r.status] || escapeHtml(r.status)}
          ${r.hidden_at ? '<div class="mt-1">' + hiddenBadge() + '</div>' : ''}
        </td>
        <td class="text-end">
          <button type="button" class="btn-icon" data-id="${r.id}" title="Xem chi tiết"><i class="fa-solid fa-eye"></i></button>
        </td>
      </tr>`
  })
  forumTable.innerHTML = html
}

function renderStats(stats) {
  document.getElementById('statTotal').textContent = stats.total
  document.getElementById('statOpen').textContent = stats.open
  document.getElementById('statHiddenRequests').textContent = stats.hidden_requests
  document.getElementById('statHiddenQuotes').textContent = stats.hidden_quotes
}

function renderPagination(page, totalPages, totalItems) {
  document.getElementById('pageInfo').textContent = 'Hiển thị ' + items.length + ' / ' + totalItems + ' yêu cầu'
  let html = ''
  for (let i = 0; i < totalPages; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i + 1}</a></li>`
  }
  pagination.innerHTML = html
}

function quoteHtml(q) {
  let action = ''
  if (q.hidden_at) {
    action = `<button type="button" class="btn btn-ghost btn-sm" data-unhide-quote="${q.id}"><i class="fa-solid fa-eye me-1"></i>Hiện lại</button>`
  } else if (!(current.status === 'CONFIRMED' && q.status === 'SELECTED')) {
    action = `<button type="button" class="btn btn-ghost btn-sm text-rose" data-hide-quote="${q.id}"><i class="fa-solid fa-eye-slash me-1"></i>Ẩn</button>`
  }
  return `
    <div class="quote-box ${q.hidden_at ? 'hidden-item' : ''} mb-2">
      <div class="d-flex gap-3">
        ${q.sample_image_url ? `<img src="${escapeHtml(FW_API.imageUrl(q.sample_image_url))}" alt="Ảnh mẫu">` : ''}
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between flex-wrap gap-2">
            <div>
              <strong>${escapeHtml(q.partner_name)}</strong>
              <span class="small text-muted-fw">${escapeHtml(q.partner_email)}</span>
            </div>
            <div>${QUOTE_BADGE[q.status] || ''} ${q.hidden_at ? hiddenBadge() : ''}</div>
          </div>
          <div class="small my-1"><strong class="text-rose">${FW.formatVnd(q.price)}</strong> · ${q.estimated_days} ngày · gửi ${formatDateTime(q.created_at)}</div>
          <div class="small">${escapeHtml(q.description || '')}</div>
          ${q.hidden_at ? `<div class="small text-rose mt-1">Lý do ẩn: ${escapeHtml(q.hidden_reason)}</div>` : ''}
        </div>
        <div class="flex-shrink-0">${action}</div>
      </div>
    </div>`
}

function renderDetail() {
  const r = current
  let requestAction = ''
  if (r.hidden_at) {
    requestAction = '<button type="button" class="btn btn-forest btn-sm" data-unhide-request><i class="fa-solid fa-eye me-1"></i>Hiện lại yêu cầu</button>'
  } else if (r.status !== 'CONFIRMED') {
    requestAction = '<button type="button" class="btn btn-danger btn-sm" data-hide-request><i class="fa-solid fa-eye-slash me-1"></i>Ẩn yêu cầu</button>'
  }

  document.getElementById('detailTitle').textContent = '#YC-' + r.id + ' · ' + r.title
  document.getElementById('detailBody').innerHTML = `
    ${r.hidden_at ? `<div class="alert alert-warning small"><i class="fa-solid fa-eye-slash me-1"></i>Đã ẩn lúc ${formatDateTime(r.hidden_at)}. Lý do: <strong>${escapeHtml(r.hidden_reason)}</strong></div>` : ''}
    <div class="row g-3 mb-3">
      <div class="col-md-5">
        <img class="forum-detail-image" src="${escapeHtml(FW_API.imageUrl(r.reference_image_url))}" alt="Ảnh tham khảo">
      </div>
      <div class="col-md-7">
        <dl class="forum-info">
          <dt>Trạng thái</dt><dd>${STATUS_BADGE[r.status] || ''} ${r.hidden_at ? hiddenBadge() : ''}</dd>
          <dt>Khách hàng</dt><dd>${escapeHtml(r.customer_name)}<br><span class="small text-muted-fw">${escapeHtml(r.customer_email)} ${r.customer_phone ? '· ' + escapeHtml(r.customer_phone) : ''}</span></dd>
          <dt>Dịp</dt><dd>${escapeHtml(r.occasion || '—')}</dd>
          <dt>Chất liệu / màu</dt><dd>${escapeHtml(r.material_preference || '—')} · ${escapeHtml(r.color_preference || '—')}</dd>
          <dt>Ngân sách</dt><dd>${FW.formatVnd(r.budget)} · ${r.quantity} bó</dd>
          <dt>Hẹn giao</dt><dd>${formatDateTime(r.desired_date)}</dd>
          <dt>Đăng lúc</dt><dd>${formatDateTime(r.created_at)}</dd>
          ${r.order_code ? `<dt>Đơn hàng</dt><dd>${escapeHtml(r.order_code)} · ${ORDER_TEXT[r.order_status] || escapeHtml(r.order_status)}</dd>` : ''}
        </dl>
      </div>
    </div>
    <p class="small mb-3">${escapeHtml(r.description)}</p>
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h3 class="h6 mb-0">Báo giá của Đối tác (${r.quotes.length})</h3>
      ${requestAction}
    </div>
    ${r.status === 'CONFIRMED' ? '<p class="small text-muted-fw">Yêu cầu đã chốt thành đơn hàng nên không thể ẩn yêu cầu hay báo giá được chọn. Nếu có vấn đề, xử lý qua khiếu nại.</p>' : ''}
    ${r.quotes.length ? r.quotes.map(quoteHtml).join('') : '<p class="text-muted-fw small">Chưa có báo giá nào.</p>'}`
}


async function loadList(page) {
  currentPage = page
  renderMessage('Đang tải...')
  try {
    const data = await FW_API.getAdminForum({
      status: statusFilter.value,
      visibility: visibilityFilter.value,
      q: searchInput.value.trim(),
      page: page,
      size: 10,
    })
    items = data.items
    renderTable()
    renderStats(data.stats)
    renderPagination(data.page, data.total_pages, data.total_items)
  } catch (error) {
    items = []
    renderMessage(error.message)
    pagination.innerHTML = ''
    document.getElementById('pageInfo').textContent = ''
  }
}

async function openDetail(id) {
  try {
    current = await FW_API.getAdminForumRequest(id)
    renderDetail()
    detailModal.show()
  } catch (error) {
    FW.toast(error.message)
  }
}

async function refreshDetail() {
  current = await FW_API.getAdminForumRequest(current.id)
  renderDetail()
  loadList(currentPage)
}

function askHide(target) {
  hideTarget = target
  hideReason.value = ''
  hideError.textContent = ''
  if (target.type === 'request') {
    document.getElementById('hideTitle').textContent = 'Ẩn yêu cầu #YC-' + current.id
    document.getElementById('hideTarget').textContent = 'Yêu cầu sẽ biến mất khỏi diễn đàn, Đối tác không gửi báo giá được và khách không xác nhận đặt được cho đến khi hiện lại.'
  } else {
    const q = current.quotes.find(function (x) { return x.id === target.id })
    document.getElementById('hideTitle').textContent = 'Ẩn báo giá của ' + q.partner_name
    document.getElementById('hideTarget').textContent = 'Khách sẽ không thấy báo giá này nữa.' + (q.status === 'SELECTED' ? ' Khách đang chọn báo giá này nên sẽ phải chọn lại.' : '')
  }
  hideModal.show()
}


forumTable.addEventListener('click', function (event) {
  const button = event.target.closest('[data-id]')
  if (button) openDetail(Number(button.dataset.id))
})

document.getElementById('detailBody').addEventListener('click', async function (event) {
  const target = event.target.closest('button')
  if (!target) return
  try {
    if (target.hasAttribute('data-hide-request')) {
      askHide({ type: 'request' })
    } else if (target.hasAttribute('data-hide-quote')) {
      askHide({ type: 'quote', id: Number(target.dataset.hideQuote) })
    } else if (target.hasAttribute('data-unhide-request')) {
      target.disabled = true
      FW.toast((await FW_API.unhideAdminForumRequest(current.id)).message)
      await refreshDetail()
    } else if (target.hasAttribute('data-unhide-quote')) {
      target.disabled = true
      FW.toast((await FW_API.unhideAdminForumQuote(Number(target.dataset.unhideQuote))).message)
      await refreshDetail()
    }
  } catch (error) {
    target.disabled = false
    FW.toast(error.message)
  }
})

document.querySelectorAll('.reason-chip').forEach(function (chip) {
  chip.addEventListener('click', function () {
    hideReason.value = chip.textContent
  })
})

document.getElementById('hideConfirm').addEventListener('click', async function () {
  const reason = hideReason.value.trim()
  if (!reason) {
    hideError.textContent = 'Vui lòng nhập lý do ẩn.'
    return
  }
  const button = this
  button.disabled = true
  try {
    const result = hideTarget.type === 'request'
      ? await FW_API.hideAdminForumRequest(current.id, reason)
      : await FW_API.hideAdminForumQuote(hideTarget.id, reason)
    hideModal.hide()
    FW.toast(result.message)
    await refreshDetail()
  } catch (error) {
    hideError.textContent = error.message
  } finally {
    button.disabled = false
  }
})

pagination.addEventListener('click', function (event) {
  const link = event.target.closest('[data-page]')
  if (!link) return
  event.preventDefault()
  loadList(Number(link.dataset.page))
})

document.getElementById('filterButton').addEventListener('click', function () {
  loadList(0)
})

searchInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') loadList(0)
})

loadList(0)
