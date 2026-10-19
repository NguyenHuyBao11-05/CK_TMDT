const ACTION_LABEL = {
  USER_LOCK: 'Khoá tài khoản',
  USER_UNLOCK: 'Mở khoá tài khoản',
  USER_ROLE: 'Phân quyền',
  USER_CREATE: 'Tạo tài khoản',
  USER_UPDATE: 'Sửa thông tin tài khoản',
  USER_RESET_PASSWORD: 'Đặt lại mật khẩu',
  PRODUCT_APPROVE: 'Duyệt sản phẩm',
  PARTNER_APPROVE: 'Duyệt hồ sơ Đối tác',
  LOGIN: 'Đăng nhập',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  LOGOUT: 'Đăng xuất',
  QUOTE_CREATE: 'Gửi báo giá',
  QUOTE_SELECT: 'Chọn báo giá',
  REQUEST_CONFIRM: 'Xác nhận đặt theo báo giá',
  REQUEST_CREATE: 'Đăng yêu cầu thiết kế',
  REQUEST_CANCEL: 'Huỷ yêu cầu thiết kế',
  ORDER_STATUS: 'Cập nhật trạng thái đơn',
  ORDER_CANCEL: 'Huỷ đơn hàng',
  ORDER_AUTO_RECEIVED: 'Tự động xác nhận đã nhận',
  COMPLAINT_CREATE: 'Gửi khiếu nại',
}

const ROLE_BADGE = {
  ADMIN: '<span class="badge-soft rose">Admin</span>',
  MANAGER: '<span class="badge-soft gold">Quản lý</span>',
  PARTNER: '<span class="badge-soft green">Đối tác</span>',
  CUSTOMER: '<span class="badge-soft blue">Khách hàng</span>',
  SYSTEM: '<span class="badge-soft gray">Hệ thống</span>',
}

const logTable = document.getElementById('logTable')
const logModal = new bootstrap.Modal(document.getElementById('logModal'))
const fromDate = document.getElementById('fromDate')
const toDate = document.getElementById('toDate')
const actionType = document.getElementById('actionType')
const actorSearch = document.getElementById('actorSearch')
const pagination = document.getElementById('pagination')

let logs = []
let currentPage = 0


function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text == null ? '' : text
  return div.innerHTML
}

function toInputDate(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
}

function formatDate(value) {
  const d = new Date(value)
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
}

function formatTime(value) {
  return new Date(value).toTimeString().slice(0, 8)
}

function actionLabel(action) {
  return ACTION_LABEL[action] || action
}

function actorName(log) {
  return log.actor_name ? escapeHtml(log.actor_name) : 'Hệ thống'
}

function targetText(log) {
  return log.target_table ? escapeHtml(log.target_table) + (log.target_id ? ' #' + log.target_id : '') : '—'
}


function renderMessage(message) {
  logTable.innerHTML = `<tr><td colspan="6" class="text-center text-muted-fw py-4">${escapeHtml(message)}</td></tr>`
}

function renderTable() {
  if (logs.length === 0) {
    renderMessage('Không có nhật ký nào phù hợp.')
    return
  }
  let html = ''
  logs.forEach(function (log) {
    html += `
      <tr class="${log.warning ? 'log-warning' : ''}">
        <td class="log-time">
          <div class="date">${formatDate(log.created_at)}</div>
          <div class="hour">${formatTime(log.created_at)}</div>
        </td>
        <td>
          <div class="fw-semibold">${actorName(log)}</div>
          <div class="small text-muted-fw">${escapeHtml(log.actor_email) || '—'}</div>
        </td>
        <td>
          <div class="log-action">
            ${log.warning ? '<i class="fa-solid fa-triangle-exclamation text-rose me-1"></i>' : ''}${actionLabel(log.action)}
          </div>
          <span class="log-action-code">${escapeHtml(log.action)}</span>
        </td>
        <td class="d-none d-lg-table-cell log-target">${targetText(log)}</td>
        <td class="d-none d-xxl-table-cell log-detail">${escapeHtml(log.detail)}</td>
        <td class="text-end">
          <button type="button" class="btn-icon" data-id="${log.id}" title="Xem chi tiết"><i class="fa-solid fa-eye"></i></button>
        </td>
      </tr>`
  })
  logTable.innerHTML = html
}

function renderStats(stats) {
  document.getElementById('statToday').textContent = stats.today
  document.getElementById('statLogin').textContent = stats.login
  document.getElementById('statChange').textContent = stats.change
  document.getElementById('statWarning').textContent = stats.warning
}

function renderPagination(page, totalPages, totalItems) {
  document.getElementById('pageInfo').textContent = 'Hiển thị ' + logs.length + ' / ' + totalItems + ' bản ghi'
  let html = ''
  for (let i = 0; i < totalPages; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i + 1}</a></li>`
  }
  pagination.innerHTML = html
}


async function loadLogs(page) {
  currentPage = page
  renderMessage('Đang tải...')
  try {
    const data = await FW_API.getAdminLogs({
      from: fromDate.value,
      to: toDate.value,
      group: actionType.value,
      q: actorSearch.value.trim(),
      page: page,
      size: 10,
    })
    logs = data.items
    renderTable()
    renderStats(data.stats)
    renderPagination(data.page, data.total_pages, data.total_items)
  } catch (error) {
    logs = []
    renderMessage(error.message)
    pagination.innerHTML = ''
    document.getElementById('pageInfo').textContent = ''
  }
}


logTable.addEventListener('click', function (event) {
  const button = event.target.closest('[data-id]')
  if (!button) return
  const log = logs.find(function (l) { return l.id === Number(button.dataset.id) })

  document.getElementById('logModalTitle').textContent = 'Nhật ký #' + log.id
  document.getElementById('logModalBody').innerHTML = `
    <div class="log-row-detail"><span>Thời gian</span><span>${formatDate(log.created_at)} ${formatTime(log.created_at)}</span></div>
    <div class="log-row-detail"><span>Người thực hiện</span><span>${actorName(log)}${log.actor_email ? '<br><small class="text-muted-fw fw-normal">' + escapeHtml(log.actor_email) + '</small>' : ''}</span></div>
    <div class="log-row-detail"><span>Vai trò</span><span>${ROLE_BADGE[log.actor_role] || '—'}</span></div>
    <div class="log-row-detail"><span>Thao tác</span><span>${actionLabel(log.action)}<br><span class="log-action-code fw-normal">${escapeHtml(log.action)}</span></span></div>
    <div class="log-row-detail"><span>Đối tượng</span><span class="log-target">${targetText(log)}</span></div>
    <div class="log-row-detail"><span>Chi tiết</span><span>${escapeHtml(log.detail) || '—'}</span></div>`
  logModal.show()
})

pagination.addEventListener('click', function (event) {
  const link = event.target.closest('[data-page]')
  if (!link) return
  event.preventDefault()
  loadLogs(Number(link.dataset.page))
})

document.getElementById('filterButton').addEventListener('click', function () {
  loadLogs(0)
})

actorSearch.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') loadLogs(0)
})

document.addEventListener('change', function (event) {
  if (event.target.id === 'roleSwitch') loadLogs(currentPage)
})


const today = new Date()
const weekAgo = new Date()
weekAgo.setDate(today.getDate() - 6)
fromDate.value = toInputDate(weekAgo)
toDate.value = toInputDate(today)

loadLogs(0)
