let users = [
  { id: 1, full_name: 'Quản trị viên', email: 'admin@nhanh.vn', phone: '', role: 'ADMIN', auth_provider: 'LOCAL', status: 'ACTIVE', created_at: '01/09/2026' },
  { id: 2, full_name: 'Quản lý vận hành', email: 'manager@nhanh.vn', phone: '', role: 'MANAGER', auth_provider: 'LOCAL', status: 'ACTIVE', created_at: '01/09/2026' },
  { id: 3, full_name: 'Nguyễn Thảo Vy', email: 'thaodien.atelier@gmail.com', phone: '0903821990', role: 'PARTNER', auth_provider: 'LOCAL', status: 'ACTIVE', created_at: '12/09/2026' },
  { id: 4, full_name: 'Lê Văn Hưng', email: 'nangbanmai.hoa@gmail.com', phone: '0918340120', role: 'PARTNER', auth_provider: 'GOOGLE', status: 'ACTIVE', created_at: '15/09/2026' },
  { id: 5, full_name: 'Trần Thị Lan Phương', email: 'lanphuong@gmail.com', phone: '0908223989', role: 'CUSTOMER', auth_provider: 'GOOGLE', status: 'ACTIVE', created_at: '20/09/2026' },
  { id: 6, full_name: 'Phạm Minh Tuấn', email: 'minhtuan.pm@gmail.com', phone: '0977451880', role: 'CUSTOMER', auth_provider: 'LOCAL', status: 'ACTIVE', created_at: '22/09/2026' },
  { id: 7, full_name: 'Đỗ Hải Yến', email: 'haiyen.do@gmail.com', phone: '0936294110', role: 'CUSTOMER', auth_provider: 'LOCAL', status: 'LOCKED', created_at: '25/09/2026' },
  { id: 8, full_name: 'Võ Đăng Khoa', email: 'dangkhoa@gmail.com', phone: '0912345678', role: 'CUSTOMER', auth_provider: 'GOOGLE', status: 'ACTIVE', created_at: '02/10/2026' },
]

const ROLE_LABEL = {
  ADMIN: '<span class="badge-soft rose">Admin</span>',
  MANAGER: '<span class="badge-soft gold">Quản lý</span>',
  PARTNER: '<span class="badge-soft green">Đối tác</span>',
  CUSTOMER: '<span class="badge-soft blue">Khách hàng</span>',
}

const userTable = document.getElementById('userTable')
const userForm = document.getElementById('userForm')
const userModal = new bootstrap.Modal(document.getElementById('userModal'))
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'))

let editingId = null
let deletingId = null


function renderStats() {
  document.getElementById('statTotal').textContent = users.length
  document.getElementById('statCustomer').textContent = users.filter(function (u) { return u.role === 'CUSTOMER' }).length
  document.getElementById('statPartner').textContent = users.filter(function (u) { return u.role === 'PARTNER' }).length
  document.getElementById('statLocked').textContent = users.filter(function (u) { return u.status === 'LOCKED' }).length
}

function renderTable() {
  let html = ''
  users.forEach(function (u) {
    const locked = u.status === 'LOCKED'
    html += `
      <tr>
        <td>
          <div class="user-cell">
            <span class="user-initial">${u.full_name.charAt(0)}</span>
            <div>
              <div class="fw-semibold">${u.full_name}</div>
              <div class="small text-muted-fw">${u.email}</div>
            </div>
          </div>
        </td>
        <td>${u.phone || '—'}</td>
        <td>${ROLE_LABEL[u.role]}</td>
        <td class="d-none d-xxl-table-cell">${u.auth_provider === 'GOOGLE' ? '<i class="fa-brands fa-google me-1"></i>Google' : 'Email'}</td>
        <td>${locked ? '<span class="badge-soft rose">Đã khoá</span>' : '<span class="badge-soft green">Hoạt động</span>'}</td>
        <td class="d-none d-xxl-table-cell">${u.created_at}</td>
        <td class="text-end text-nowrap">
          <button type="button" class="btn-icon" data-action="edit" data-id="${u.id}" title="Sửa">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="btn-icon" data-action="lock" data-id="${u.id}" title="${locked ? 'Mở khoá' : 'Khoá'}">
            <i class="fa-solid ${locked ? 'fa-lock-open' : 'fa-lock'}"></i>
          </button>
          <button type="button" class="btn-icon" data-action="reset" data-id="${u.id}" title="Đặt lại mật khẩu">
            <i class="fa-solid fa-key"></i>
          </button>
          <button type="button" class="btn-icon danger" data-action="delete" data-id="${u.id}" title="Xoá">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>`
  })
  userTable.innerHTML = html
  document.getElementById('pageInfo').textContent = 'Hiển thị ' + users.length + ' tài khoản'
  renderStats()
}

function findUser(id) {
  return users.find(function (u) { return u.id === Number(id) })
}


function openAddModal() {
  editingId = null
  userForm.reset()
  userForm.classList.remove('was-validated')
  document.getElementById('userModalTitle').textContent = 'Thêm tài khoản'
  document.getElementById('passwordGroup').hidden = false
  document.getElementById('password').required = true
  userModal.show()
}

function openEditModal(id) {
  const u = findUser(id)
  editingId = u.id
  userForm.classList.remove('was-validated')
  document.getElementById('userModalTitle').textContent = 'Sửa tài khoản'
  document.getElementById('fullName').value = u.full_name
  document.getElementById('email').value = u.email
  document.getElementById('phone').value = u.phone
  document.getElementById('role').value = u.role
  document.getElementById('status').value = u.status
  document.getElementById('passwordGroup').hidden = true
  document.getElementById('password').required = false
  userModal.show()
}

document.getElementById('addBtn').addEventListener('click', openAddModal)

userForm.addEventListener('submit', function (event) {
  event.preventDefault()
  userForm.classList.add('was-validated')
  if (!userForm.checkValidity()) return

  const data = {
    full_name: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    role: document.getElementById('role').value,
    status: document.getElementById('status').value,
  }

  if (editingId) {
    Object.assign(findUser(editingId), data)
    FW.toast('Đã cập nhật tài khoản ' + data.full_name)
  } else {
    data.id = users.length ? users[users.length - 1].id + 1 : 1
    data.auth_provider = 'LOCAL'
    data.created_at = new Date().toLocaleDateString('vi-VN')
    users.push(data)
    FW.toast('Đã thêm tài khoản ' + data.full_name)
  }

  userModal.hide()
  renderTable()
})


userTable.addEventListener('click', function (event) {
  const button = event.target.closest('[data-action]')
  if (!button) return
  const u = findUser(button.dataset.id)

  if (button.dataset.action === 'edit') {
    openEditModal(u.id)
  }

  if (button.dataset.action === 'lock') {
    u.status = u.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
    renderTable()
    FW.toast((u.status === 'LOCKED' ? 'Đã khoá ' : 'Đã mở khoá ') + u.full_name)
  }

  if (button.dataset.action === 'reset') {
    FW.toast('Đã gửi email đặt lại mật khẩu cho ' + u.email)
  }

  if (button.dataset.action === 'delete') {
    deletingId = u.id
    document.getElementById('deleteName').textContent = u.full_name
    deleteModal.show()
  }
})

document.getElementById('confirmDelete').addEventListener('click', function () {
  const u = findUser(deletingId)
  users = users.filter(function (x) { return x.id !== deletingId })
  deleteModal.hide()
  renderTable()
  FW.toast('Đã xoá tài khoản ' + u.full_name)
})


renderTable()
