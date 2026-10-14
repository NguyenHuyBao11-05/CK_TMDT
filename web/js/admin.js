const ROLE_INFO = {
  admin: { name: 'Ban Quản Trị Fw12', role: 'Admin', short: 'Ban Quản Trị', email: 'admin@nhanh.vn' },
  manager: { name: 'Quản lý vận hành', role: 'Quản lý', short: 'Quản lý vận hành', email: 'manager@nhanh.vn' },
}

function getRole() {
  try {
    return localStorage.getItem('fw_admin_role') || 'admin'
  } catch (e) {
    return 'admin'
  }
}

function setRole(role) {
  try {
    localStorage.setItem('fw_admin_role', role)
  } catch (e) {}
  document.body.dataset.role = role
  showRoleInfo()
}

function showRoleInfo() {
  const info = ROLE_INFO[document.body.dataset.role]
  const roleSwitch = document.getElementById('roleSwitch')
  if (!roleSwitch) return
  roleSwitch.value = document.body.dataset.role
  document.getElementById('adminUserName').textContent = info.name
  document.getElementById('adminUserRole').textContent = info.role
  document.getElementById('topbarName').textContent = info.short
  document.getElementById('topbarEmail').textContent = info.email
}

document.body.dataset.role = getRole()

document.addEventListener('fw:partials-loaded', showRoleInfo)

document.addEventListener('change', function (event) {
  if (event.target.id === 'roleSwitch') setRole(event.target.value)
})
