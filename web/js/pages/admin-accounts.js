const ROLE_LABEL = {
  ADMIN: '<span class="badge-soft rose">Admin</span>',
  MANAGER: '<span class="badge-soft gold">Quản lý</span>',
  PARTNER: '<span class="badge-soft green">Đối tác</span>',
  CUSTOMER: '<span class="badge-soft blue">Khách hàng</span>',
}

const userTable = document.getElementById('userTable')
const userForm = document.getElementById('userForm')
const userModal = new bootstrap.Modal(document.getElementById('userModal'))
const resetModal = new bootstrap.Modal(document.getElementById('resetModal'))
const searchInput = document.getElementById('searchInput')
const roleFilter = document.getElementById('roleFilter')
const statusFilter = document.getElementById('statusFilter')
const pagination = document.getElementById('pagination')

let users = []
let currentPage = 0
let editingId = null
let resettingId = null
let searchTimer = null


function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text == null ? '' : text
  return div.innerHTML
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
}

function findUser(id) {
  return users.find(function (u) { return u.id === Number(id) })
}


function renderMessage(message) {
  userTable.innerHTML = `<tr><td colspan="7" class="text-center text-muted-fw py-4">${escapeHtml(message)}</td></tr>`
}

function renderStats(stats) {
  document.getElementById('statTotal').textContent = stats.total
  document.getElementById('statCustomer').textContent = stats.customer
  document.getElementById('statPartner').textContent = stats.partner
  document.getElementById('statLocked').textContent = stats.locked
}

function renderTable() {
  if (users.length === 0) {
    renderMessage('Không tìm thấy tài khoản nào.')
    return
  }
  let html = ''
  users.forEach(function (u) {
    const locked = u.status === 'LOCKED'
    html += `
      <tr>
        <td>
          <div class="user-cell">
            <span class="user-initial">${escapeHtml(u.full_name.charAt(0))}</span>
            <div>
              <div class="fw-semibold">${escapeHtml(u.full_name)}</div>
              <div class="small text-muted-fw">${escapeHtml(u.email)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(u.phone) || '—'}</td>
        <td>${ROLE_LABEL[u.role]}</td>
        <td class="d-none d-xxl-table-cell">${u.auth_provider === 'GOOGLE' ? '<i class="fa-brands fa-google me-1"></i>Google' : 'Email'}</td>
        <td>${locked ? '<span class="badge-soft rose">Đã khoá</span>' : '<span class="badge-soft green">Hoạt động</span>'}</td>
        <td class="d-none d-xxl-table-cell">${formatDate(u.created_at)}</td>
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
        </td>
      </tr>`
  })
  userTable.innerHTML = html
}

function renderPagination(page, totalPages, totalItems) {
  document.getElementById('pageInfo').textContent = 'Hiển thị ' + users.length + ' / ' + totalItems + ' tài khoản'
  let html = ''
  for (let i = 0; i < totalPages; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i + 1}</a></li>`
  }
  pagination.innerHTML = html
}


async function loadUsers(page) {
  currentPage = page
  try {
    const data = await FW_API.getAdminUsers({
      q: searchInput.value.trim(),
      role: roleFilter.value,
      status: statusFilter.value,
      page: page,
      size: 10,
    })
    if (data.items.length === 0 && page > 0) {
      loadUsers(page - 1)
      return
    }
    users = data.items
    renderTable()
    renderStats(data.stats)
    renderPagination(data.page, data.total_pages, data.total_items)
  } catch (error) {
    users = []
    renderMessage(error.message)
    pagination.innerHTML = ''
    document.getElementById('pageInfo').textContent = ''
  }
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

function openEditModal(u) {
  editingId = u.id
  userForm.classList.remove('was-validated')
  document.getElementById('userModalTitle').textContent = 'Sửa tài khoản'
  document.getElementById('fullName').value = u.full_name
  document.getElementById('email').value = u.email
  document.getElementById('phone').value = u.phone || ''
  document.getElementById('role').value = u.role
  document.getElementById('status').value = u.status
  document.getElementById('passwordGroup').hidden = true
  document.getElementById('password').required = false
  userModal.show()
}

document.getElementById('addBtn').addEventListener('click', openAddModal)

userForm.addEventListener('submit', async function (event) {
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

  try {
    if (editingId) {
      await FW_API.updateUser(editingId, data)
      FW.toast('Đã cập nhật tài khoản ' + data.full_name)
    } else {
      data.password = document.getElementById('password').value
      await FW_API.createUser(data)
      FW.toast('Đã thêm tài khoản ' + data.full_name)
    }
    userModal.hide()
    loadUsers(editingId ? currentPage : 0)
  } catch (error) {
    FW.toast(error.message)
  }
})


userTable.addEventListener('click', async function (event) {
  const button = event.target.closest('[data-action]')
  if (!button) return
  const u = findUser(button.dataset.id)

  if (button.dataset.action === 'edit') {
    openEditModal(u)
  }

  if (button.dataset.action === 'lock') {
    const nextStatus = u.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
    try {
      await FW_API.changeUserStatus(u.id, nextStatus)
      FW.toast((nextStatus === 'LOCKED' ? 'Đã khoá ' : 'Đã mở khoá ') + u.full_name)
      loadUsers(currentPage)
    } catch (error) {
      FW.toast(error.message)
    }
  }

  if (button.dataset.action === 'reset') {
    resettingId = u.id
    document.getElementById('resetName').textContent = u.full_name
    document.getElementById('resetConfirm').hidden = false
    document.getElementById('resetResult').hidden = true
    resetModal.show()
  }
})

document.getElementById('confirmReset').addEventListener('click', async function () {
  try {
    const data = await FW_API.resetUserPassword(resettingId)
    document.getElementById('tempPassword').textContent = data.temporary_password
    document.getElementById('resetConfirm').hidden = true
    document.getElementById('resetResult').hidden = false
  } catch (error) {
    resetModal.hide()
    FW.toast(error.message)
  }
})


searchInput.addEventListener('input', function () {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(function () { loadUsers(0) }, 300)
})

roleFilter.addEventListener('change', function () { loadUsers(0) })
statusFilter.addEventListener('change', function () { loadUsers(0) })

pagination.addEventListener('click', function (event) {
  const link = event.target.closest('[data-page]')
  if (!link) return
  event.preventDefault()
  loadUsers(Number(link.dataset.page))
})

document.addEventListener('change', function (event) {
  if (event.target.id === 'roleSwitch') loadUsers(currentPage)
})


loadUsers(0)
