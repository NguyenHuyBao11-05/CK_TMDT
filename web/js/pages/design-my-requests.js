const ORDER_STEPS = ['Chờ xử lý', 'Đã xử lý', 'Đang giao', 'Đã nhận']
const ORDER_STEP_INDEX = { PENDING: 0, PROCESSING: 1, SHIPPING: 2, RECEIVED: 3 }
const AVATAR_COLORS = ['#3f6b4e', '#b5452f', '#86a98a', '#c08a3e', '#5a7ea6']

const requestList = document.getElementById('requestList')
const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'))
const e = FW.escapeHtml

let requests = []
let cancelId = null


function formatDate(value) {
  const d = new Date(value)
  const pad = function (n) { return String(n).padStart(2, '0') }
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' lúc ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function timeLeft(value) {
  const hours = Math.floor((new Date(value) - new Date()) / 3600000)
  if (hours < 0) return 'Đã quá hạn'
  if (hours < 24) return 'Còn ' + hours + ' giờ'
  return 'Còn ' + Math.floor(hours / 24) + ' ngày'
}

function initials(name) {
  const words = name.trim().split(/\s+/)
  return (words[0].charAt(0) + (words.length > 1 ? words[words.length - 1].charAt(0) : '')).toUpperCase()
}

function infoRow(items) {
  let html = '<div class="info-row row g-2 mx-0">'
  items.forEach(function (item) {
    html += '<div class="col-sm-4"><div class="info-label">' + item[0] + '</div><div class="info-value">' + item[1] + '</div></div>'
  })
  return html + '</div>'
}

function basicInfo(r) {
  return infoRow([['Ngân sách dự kiến', FW.formatVnd(r.budget)], ['Dịp tặng', e(r.occasion)], ['Hẹn giao', formatDate(r.desired_date)]])
}

function cancelButton(r) {
  return '<button type="button" class="btn btn-link text-rose btn-sm ms-auto" data-cancel="' + r.id + '"><i class="fa-regular fa-circle-xmark me-1"></i>Huỷ yêu cầu</button>'
}

function openContent(r) {
  if (r.quote_count === 0) {
    return basicInfo(r)
      + '<div class="waiting-box"><i class="fa-regular fa-hourglass-half me-2 text-forest"></i>Đang chờ Đối tác báo giá. Bạn sẽ nhận được thông báo khi có shop gửi đề xuất.</div>'
      + '<div class="d-flex flex-wrap gap-2 align-items-center">'
      + '<button type="button" class="btn btn-ghost btn-sm" disabled><i class="fa-solid fa-scale-balanced me-1"></i>Chưa có báo giá</button>'
      + cancelButton(r)
      + '</div>'
  }

  let avatars = ''
  r.partner_names.forEach(function (name, index) {
    avatars += '<span style="background:' + AVATAR_COLORS[index % AVATAR_COLORS.length] + '">' + e(initials(name)) + '</span>'
  })
  const chosen = r.selected_partner_name
    ? '<div class="waiting-box"><i class="fa-solid fa-circle-check me-2 text-forest"></i>Bạn đã chọn <strong>' + e(r.selected_partner_name) + '</strong> (' + FW.formatVnd(r.selected_price) + '). Hãy xác nhận đặt để chuyển sang thanh toán.</div>'
    : ''

  return basicInfo(r)
    + '<div class="d-flex flex-wrap align-items-center gap-3 mb-3">'
    + '<div class="quote-avatars">' + avatars + '</div>'
    + '<div class="small"><strong>' + r.quote_count + ' shop đã gửi báo giá</strong><br><span class="text-muted-fw">' + e(r.partner_names.join(', ')) + '</span></div>'
    + '<span class="ms-auto small text-forest fw-semibold">Giá từ ' + FW.formatVnd(r.min_price) + '</span>'
    + '</div>'
    + chosen
    + '<div class="d-flex flex-wrap gap-2 align-items-center">'
    + '<a href="compare-quotes.html?id=' + r.id + '" class="btn btn-peach btn-sm"><i class="fa-solid fa-scale-balanced me-1"></i>So sánh &amp; chọn báo giá (' + r.quote_count + ')</a>'
    + cancelButton(r)
    + '</div>'
}

function confirmedContent(r) {
  const step = r.order_status in ORDER_STEP_INDEX ? ORDER_STEP_INDEX[r.order_status] : 0
  let steps = ''
  ORDER_STEPS.forEach(function (name, index) {
    const done = index <= step
    steps += '<span class="' + (done ? 'done' : '') + '"><i class="fa-' + (done ? 'solid fa-circle-check' : 'regular fa-circle') + ' me-1"></i>' + name + '</span>'
  })
  const percent = (step + 1) / ORDER_STEPS.length * 100

  return infoRow([['Shop thực hiện', '<i class="fa-solid fa-store me-1 text-forest"></i>' + e(r.selected_partner_name || '—')], ['Giá đã chốt', '<span class="text-forest">' + FW.formatVnd(r.selected_price) + '</span>'], ['Dự kiến giao', formatDate(r.desired_date)]])
    + '<div class="progress-steps">' + steps + '</div>'
    + '<div class="progress"><div class="progress-bar" style="width: ' + percent + '%"></div></div>'
    + '<div class="d-flex flex-wrap gap-2">'
    + '<a href="../account/orders.html" class="btn btn-forest btn-sm"><i class="fa-solid fa-box me-1"></i>Xem đơn hàng</a>'
    + '<a href="compare-quotes.html?id=' + r.id + '" class="btn btn-ghost btn-sm">Xem báo giá đã chọn</a>'
    + '</div>'
}

function cancelledContent(r) {
  return basicInfo(r)
    + '<div class="small text-muted-fw"><i class="fa-solid fa-ban me-1"></i>Yêu cầu đã đóng do bạn huỷ hoặc đã quá thời gian giao.</div>'
}

function renderList() {
  document.getElementById('countOpen').textContent = requests.filter(function (r) { return r.status === 'OPEN' }).length
  document.getElementById('countConfirmed').textContent = requests.filter(function (r) { return r.status === 'CONFIRMED' }).length
  document.getElementById('countCancelled').textContent = requests.filter(function (r) { return r.status === 'CANCELLED' }).length

  if (requests.length === 0) {
    requestList.innerHTML = '<div class="waiting-box text-center">Bạn chưa có yêu cầu thiết kế nào. <a href="create-request.html">Tạo yêu cầu đầu tiên</a></div>'
    return
  }

  let html = ''
  requests.forEach(function (r) {
    let badge = ''
    let chip = ''
    let content = ''

    if (r.status === 'OPEN' && r.quote_count > 0) {
      badge = '<span class="state-badge open">' + (r.selected_quote_id ? 'Đã chọn, chờ xác nhận' : 'Đang nhận báo giá') + '</span>'
      chip = '<span class="deadline-chip"><i class="fa-regular fa-clock me-1"></i>' + timeLeft(r.desired_date) + '</span>'
      content = openContent(r)
    } else if (r.status === 'OPEN') {
      badge = '<span class="state-badge waiting">Chờ báo giá</span>'
      chip = '<span class="deadline-chip soft"><i class="fa-regular fa-clock me-1"></i>' + timeLeft(r.desired_date) + '</span>'
      content = openContent(r)
    } else if (r.status === 'CONFIRMED') {
      badge = '<span class="state-badge confirmed">Đã chọn shop</span>'
      chip = '<span class="deadline-chip soft"><i class="fa-solid fa-truck me-1"></i>Đơn: ' + (r.order_status ? ORDER_STEPS[ORDER_STEP_INDEX[r.order_status]] || 'Đã huỷ' : 'Chờ thanh toán') + '</span>'
      content = confirmedContent(r)
    } else {
      badge = '<span class="state-badge cancelled">Đã huỷ</span>'
      content = cancelledContent(r)
    }

    if (r.hidden_reason) {
      badge = '<span class="state-badge cancelled">Đã bị ẩn</span>'
      content = '<div class="alert alert-warning small py-2"><i class="fa-solid fa-eye-slash me-1"></i>Yêu cầu đã bị Quản lý ẩn khỏi diễn đàn. Lý do: ' + e(r.hidden_reason) + '</div>' + content
    }

    html += `
      <article class="my-request ${r.status === 'CANCELLED' ? 'cancelled' : ''}">
        <div class="row g-4">
          <div class="col-md-4">
            <div class="my-request-image">
              <img src="${e(FW_API.imageUrl(r.reference_image_url))}" alt="${e(r.title)}">
              ${badge}
            </div>
          </div>
          <div class="col-md-8">
            <div class="d-flex justify-content-between align-items-center gap-2">
              <span class="request-code">MÃ YÊU CẦU: #YC-${r.id}</span>
              ${chip}
            </div>
            <h3 class="my-request-title">${e(r.title)}</h3>
            ${content}
          </div>
        </div>
      </article>`
  })
  requestList.innerHTML = html
}

async function loadRequests() {
  try {
    requests = await FW_API.getMyDesignRequests()
    renderList()
  } catch (error) {
    requestList.innerHTML = '<div class="waiting-box text-center text-rose">' + e(error.message) + '</div>'
  }
}


requestList.addEventListener('click', function (event) {
  const button = event.target.closest('[data-cancel]')
  if (!button) return
  cancelId = Number(button.dataset.cancel)
  document.getElementById('cancelCode').textContent = '#YC-' + cancelId
  cancelModal.show()
})

document.getElementById('cancelConfirmBtn').addEventListener('click', async function () {
  try {
    await FW_API.cancelDesignRequest(cancelId)
    cancelModal.hide()
    FW.toast('Đã huỷ yêu cầu #YC-' + cancelId)
    loadRequests()
  } catch (error) {
    cancelModal.hide()
    FW.toast(error.message)
  }
})


loadRequests()
