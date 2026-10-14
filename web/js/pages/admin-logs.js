const logs = [
  { id: 120, date: '14/10/2026', time: '09:42:15', actor: 'Quản trị viên', email: 'admin@nhanh.vn', role: 'ADMIN', action: 'USER_LOCK', group: 'account', target: 'users', targetId: 7, detail: 'Khoá tài khoản haiyen.do@gmail.com do vi phạm điều khoản.', ip: '113.161.42.10' },
  { id: 119, date: '14/10/2026', time: '09:15:02', actor: 'Quản lý vận hành', email: 'manager@nhanh.vn', role: 'MANAGER', action: 'PRODUCT_APPROVE', group: 'product', target: 'products', targetId: 24, detail: 'Duyệt sản phẩm "Bình Tulip Trắng Hà Lan Royal Classic".', ip: '14.232.18.77' },
  { id: 118, date: '14/10/2026', time: '08:58:41', actor: 'Không xác định', email: 'lanphuong@gmail.com', role: '', action: 'LOGIN_FAILED', group: 'auth', target: 'users', targetId: 5, detail: 'Đăng nhập sai mật khẩu 3 lần liên tiếp.', ip: '27.72.105.4', warning: true },
  { id: 117, date: '14/10/2026', time: '08:30:09', actor: 'Trần Thị Lan Phương', email: 'lanphuong@gmail.com', role: 'CUSTOMER', action: 'LOGIN', group: 'auth', target: 'users', targetId: 5, detail: 'Đăng nhập bằng Google.', ip: '27.72.105.4' },
  { id: 116, date: '13/10/2026', time: '21:10:33', actor: 'Nguyễn Thảo Vy', email: 'thaodien.atelier@gmail.com', role: 'PARTNER', action: 'QUOTE_CREATE', group: 'design', target: 'design_quotes', targetId: 31, detail: 'Gửi báo giá 1.450.000 đ cho yêu cầu #YC-8921.', ip: '171.244.9.21' },
  { id: 115, date: '13/10/2026', time: '19:47:20', actor: 'Trần Thị Lan Phương', email: 'lanphuong@gmail.com', role: 'CUSTOMER', action: 'REQUEST_CREATE', group: 'design', target: 'design_requests', targetId: 8921, detail: 'Đăng yêu cầu thiết kế "Bó hoa kỷ niệm 5 năm ngày cưới".', ip: '27.72.105.4' },
  { id: 114, date: '13/10/2026', time: '16:05:12', actor: 'Lê Văn Hưng', email: 'nangbanmai.hoa@gmail.com', role: 'PARTNER', action: 'ORDER_STATUS', group: 'order', target: 'orders', targetId: 1042, detail: 'Chuyển đơn #FW-1042 sang "Đang giao".', ip: '42.113.60.8' },
  { id: 113, date: '13/10/2026', time: '14:22:48', actor: 'Quản lý vận hành', email: 'manager@nhanh.vn', role: 'MANAGER', action: 'PARTNER_APPROVE', group: 'account', target: 'partner_profiles', targetId: 4, detail: 'Duyệt hồ sơ Đối tác "Tiệm Hoa Nắng Ban Mai".', ip: '14.232.18.77' },
  { id: 112, date: '12/10/2026', time: '11:40:57', actor: 'Phạm Minh Tuấn', email: 'minhtuan.pm@gmail.com', role: 'CUSTOMER', action: 'COMPLAINT_CREATE', group: 'complaint', target: 'complaints', targetId: 9, detail: 'Gửi khiếu nại cho đơn #FW-1031: hoa bị dập khi nhận.', ip: '115.79.33.2', warning: true },
  { id: 111, date: '12/10/2026', time: '10:02:30', actor: 'Quản trị viên', email: 'admin@nhanh.vn', role: 'ADMIN', action: 'USER_ROLE', group: 'account', target: 'users', targetId: 4, detail: 'Đổi vai trò tài khoản nangbanmai.hoa@gmail.com: CUSTOMER → PARTNER.', ip: '113.161.42.10' },
  { id: 110, date: '11/10/2026', time: '18:15:44', actor: 'Võ Đăng Khoa', email: 'dangkhoa@gmail.com', role: 'CUSTOMER', action: 'ORDER_CANCEL', group: 'order', target: 'orders', targetId: 1029, detail: 'Huỷ đơn #FW-1029 khi đơn đang "Chờ xử lý".', ip: '58.186.71.90' },
  { id: 109, date: '11/10/2026', time: '08:00:01', actor: 'Hệ thống', email: '', role: 'SYSTEM', action: 'ORDER_AUTO_RECEIVED', group: 'order', target: 'orders', targetId: 1015, detail: 'Tự chuyển đơn #FW-1015 sang "Đã nhận" sau 3 ngày đang giao.', ip: '' },
]

const ACTION_LABEL = {
  USER_LOCK: 'Khoá tài khoản',
  USER_ROLE: 'Phân quyền',
  PRODUCT_APPROVE: 'Duyệt sản phẩm',
  PARTNER_APPROVE: 'Duyệt hồ sơ Đối tác',
  LOGIN: 'Đăng nhập',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  QUOTE_CREATE: 'Gửi báo giá',
  REQUEST_CREATE: 'Đăng yêu cầu thiết kế',
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


function renderTable() {
  let html = ''
  logs.forEach(function (log) {
    html += `
      <tr class="${log.warning ? 'log-warning' : ''}">
        <td class="log-time">
          <div class="date">${log.date}</div>
          <div class="hour">${log.time}</div>
        </td>
        <td>
          <div class="fw-semibold">${log.actor}</div>
          <div class="small text-muted-fw">${log.email || '—'}</div>
        </td>
        <td>
          <div class="log-action">
            ${log.warning ? '<i class="fa-solid fa-triangle-exclamation text-rose me-1"></i>' : ''}${ACTION_LABEL[log.action]}
          </div>
          <span class="log-action-code">${log.action}</span>
        </td>
        <td class="d-none d-lg-table-cell log-target">${log.target} #${log.targetId}</td>
        <td class="d-none d-xxl-table-cell log-detail">${log.detail}</td>
        <td class="text-end">
          <button type="button" class="btn-icon" data-id="${log.id}" title="Xem chi tiết"><i class="fa-solid fa-eye"></i></button>
        </td>
      </tr>`
  })
  logTable.innerHTML = html

  document.getElementById('pageInfo').textContent = 'Hiển thị ' + logs.length + ' bản ghi'
  document.getElementById('statToday').textContent = logs.filter(function (l) { return l.date === '14/10/2026' }).length
  document.getElementById('statLogin').textContent = logs.filter(function (l) { return l.group === 'auth' }).length
  document.getElementById('statChange').textContent = logs.filter(function (l) { return l.group !== 'auth' }).length
  document.getElementById('statWarning').textContent = logs.filter(function (l) { return l.warning }).length
}


logTable.addEventListener('click', function (event) {
  const button = event.target.closest('[data-id]')
  if (!button) return
  const log = logs.find(function (l) { return l.id === Number(button.dataset.id) })

  document.getElementById('logModalTitle').textContent = 'Nhật ký #' + log.id
  document.getElementById('logModalBody').innerHTML = `
    <div class="log-row-detail"><span>Thời gian</span><span>${log.date} ${log.time}</span></div>
    <div class="log-row-detail"><span>Người thực hiện</span><span>${log.actor}${log.email ? '<br><small class="text-muted-fw fw-normal">' + log.email + '</small>' : ''}</span></div>
    <div class="log-row-detail"><span>Vai trò</span><span>${ROLE_BADGE[log.role] || '—'}</span></div>
    <div class="log-row-detail"><span>Thao tác</span><span>${ACTION_LABEL[log.action]}<br><span class="log-action-code fw-normal">${log.action}</span></span></div>
    <div class="log-row-detail"><span>Đối tượng</span><span class="log-target">${log.target} #${log.targetId}</span></div>
    <div class="log-row-detail"><span>Địa chỉ IP</span><span>${log.ip || '—'}</span></div>
    <div class="log-row-detail"><span>Chi tiết</span><span>${log.detail}</span></div>`
  logModal.show()
})


renderTable()
