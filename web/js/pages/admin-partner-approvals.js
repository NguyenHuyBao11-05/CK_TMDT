(function () {
  'use strict'

  const e = FW.escapeHtml
  const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
  const STATUS_BADGE = { PENDING: 'gold', APPROVED: 'green', REJECTED: 'rose' }
  let profiles = []
  let selectedId = null
  let statusFilter = ''

  function bioValue(lines, label) {
    const prefix = `${label}:`
    const line = lines.find((value) => value.startsWith(prefix))
    return line ? line.slice(prefix.length).trim() : ''
  }

  function fromApi(item) {
    const lines = String(item.bio || '').split('\n')
    const intro = bioValue(lines, 'Giới thiệu')
    return {
      id: Number(item.user_id),
      shop: bioValue(lines, 'Tên cửa hàng') || `Hồ sơ #${item.user_id}`,
      owner: item.full_name || '',
      phone: item.phone || '—',
      city: bioValue(lines, 'Thành phố') || '—',
      address: bioValue(lines, 'Địa chỉ') || '—',
      submitted: item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—',
      status: item.approval_status,
      email: item.email || '',
      profile: intro || item.bio || 'Chưa có phần giới thiệu.',
      portfolioUrl: item.portfolio_url || '',
      reject_reason: item.reject_reason || '',
    }
  }

  function renderStats() {
    const count = (status) => profiles.filter((profile) => profile.status === status).length
    document.getElementById('statPending').innerHTML = `${count('PENDING')} <small>hồ sơ</small>`
    document.getElementById('statApproved').innerHTML = `${count('APPROVED')} <small>hồ sơ</small>`
    document.getElementById('statRejected').innerHTML = `${count('REJECTED')} <small>hồ sơ</small>`
    document.getElementById('statTotal').innerHTML = `${profiles.length} <small>hồ sơ</small>`
  }

  function renderProfile(profile) {
    const panel = document.getElementById('partnerProfile')
    if (!profile) {
      panel.innerHTML = '<div class="partner-empty-state">Chọn hồ sơ để xem thông tin chi tiết.</div>'
      return
    }

    const portfolio = profile.portfolioUrl
      ? `<a class="btn btn-outline-secondary btn-sm" href="${e(profile.portfolioUrl)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square me-1"></i>Mở portfolio</a>`
      : '<span class="text-muted-fw">Chưa cung cấp portfolio.</span>'

    panel.innerHTML = `
      <div class="review-profile-heading">
        <div><h2>${e(profile.shop)}</h2><p>${e(profile.city)}</p></div>
        <span class="badge-soft ${STATUS_BADGE[profile.status]}">${e(STATUS_LABEL[profile.status])}</span>
      </div>
      <div class="review-portfolio d-flex align-items-center">${portfolio}</div>
      <div class="review-profile-facts">
        <div><small>Người đại diện</small><strong>${e(profile.owner)}</strong></div>
        <div><small>Số điện thoại</small><strong>${e(profile.phone)}</strong></div>
        <div><small>Email</small><strong>${e(profile.email)}</strong></div>
        <div><small>Ngày gửi</small><strong>${e(profile.submitted)}</strong></div>
        <div class="full"><small>Địa chỉ cửa hàng</small><strong>${e(profile.address)}</strong></div>
      </div>
      <div class="review-profile-bio"><strong class="d-block text-dark mb-1">Giới thiệu thương hiệu</strong>${e(profile.profile)}</div>
      ${profile.reject_reason ? `<div class="review-profile-bio"><strong class="d-block text-dark mb-1">Lý do từ chối</strong>${e(profile.reject_reason)}</div>` : ''}
      ${profile.status === 'PENDING' ? `
      <div class="mt-3" id="rejectBox" hidden>
        <label class="form-label small fw-semibold" for="rejectReason">Lý do từ chối <span class="text-rose">*</span></label>
        <textarea id="rejectReason" class="form-control" rows="3" maxlength="500" placeholder="Nhập lý do từ chối (tối đa 500 ký tự)..."></textarea>
      </div>
      <div class="review-profile-actions">
        <button type="button" class="approve" data-profile-action="approve" data-profile-id="${e(profile.id)}"><i class="fa-solid fa-circle-check me-1"></i>Phê duyệt</button>
        <button type="button" class="reject" data-profile-action="reject" data-profile-id="${e(profile.id)}"><i class="fa-solid fa-circle-xmark me-1"></i>Từ chối</button>
      </div>` : ''}
    `
  }

  function renderList() {
    const query = document.getElementById('partnerSearch').value.trim().toLowerCase()
    const region = document.getElementById('partnerRegion').value
    const visible = profiles.filter((profile) =>
      (!region || profile.city === region) &&
      (!statusFilter || profile.status === statusFilter) &&
      (!query || `${profile.shop} ${profile.owner} ${profile.phone} ${profile.city} ${profile.email}`.toLowerCase().includes(query)))

    document.getElementById('partnerResultCount').textContent = `${visible.length} hồ sơ`
    renderStats()
    document.getElementById('approvalTable').innerHTML = visible.map((profile) => `
      <button type="button" class="review-application-row ${profile.id === selectedId ? 'active' : ''}" data-profile-id="${e(profile.id)}">
        <span class="review-shop-cell"><span class="review-shop-avatar"><i class="fa-solid fa-store"></i></span><span><strong>${e(profile.shop)}</strong><small>${e(profile.city)} · #${e(profile.id)}</small></span></span>
        <span class="review-app-column">${e(profile.owner)}<small>${e(profile.phone)}</small></span>
        <span class="review-app-column"><span class="badge-soft ${STATUS_BADGE[profile.status]}">${e(STATUS_LABEL[profile.status])}</span><small>${e(profile.submitted)}</small></span>
        <i class="fa-solid fa-chevron-right text-muted-fw"></i>
      </button>
    `).join('') || '<div class="partner-empty-state m-3">Không tìm thấy hồ sơ phù hợp.</div>'

    renderProfile(visible.find((profile) => profile.id === selectedId) || visible[0])
  }

  async function loadProfiles() {
    const table = document.getElementById('approvalTable')
    table.innerHTML = '<div class="partner-empty-state m-3">Đang tải hồ sơ...</div>'
    try {
      profiles = (await FW_API.getPartnerApplications()).map(fromApi)
      if (!profiles.some((profile) => profile.id === selectedId)) {
        selectedId = profiles[0]?.id ?? null
      }
      renderList()
    } catch (error) {
      profiles = []
      selectedId = null
      renderList()
      table.innerHTML = `<div class="partner-empty-state m-3">${e(error.message)}</div>`
      FW.toast(error.message)
    }
  }

  document.getElementById('approvalTable').addEventListener('click', (event) => {
    const row = event.target.closest('[data-profile-id]')
    if (!row) return
    selectedId = Number(row.dataset.profileId)
    renderList()
  })

  document.getElementById('partnerProfile').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-profile-action]')
    if (!button) return
    const profile = profiles.find((item) => item.id === Number(button.dataset.profileId))
    if (!profile) return

    if (button.dataset.profileAction === 'reject') {
      const box = document.getElementById('rejectBox')
      const reason = document.getElementById('rejectReason')
      if (box.hidden) {
        box.hidden = false
        reason.focus()
        return
      }
      if (!reason.value.trim()) {
        reason.classList.add('is-invalid')
        FW.toast('Vui lòng nhập lý do từ chối.')
        return
      }
      button.disabled = true
      try {
        await FW_API.rejectPartnerApplication(profile.id, reason.value.trim())
        FW.toast(`Đã từ chối hồ sơ ${profile.shop} và gửi lý do cho ứng viên.`)
        await loadProfiles()
      } catch (error) {
        button.disabled = false
        FW.toast(error.message)
      }
      return
    }

    button.disabled = true
    try {
      await FW_API.approvePartnerApplication(profile.id)
      FW.toast(`Đã phê duyệt hồ sơ ${profile.shop}.`)
      await loadProfiles()
    } catch (error) {
      button.disabled = false
      FW.toast(error.message)
    }
  })

  document.getElementById('partnerSearch').addEventListener('input', renderList)
  document.getElementById('partnerRegion').addEventListener('change', renderList)
  document.querySelectorAll('.review-state-tabs button').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.review-state-tabs button').forEach((tab) => tab.classList.remove('active'))
    button.classList.add('active')
    statusFilter = button.dataset.status === 'Chờ duyệt' ? 'PENDING'
      : button.dataset.status === 'Đã duyệt' ? 'APPROVED'
        : button.dataset.status === 'Từ chối' ? 'REJECTED' : ''
    renderList()
  }))

  void loadProfiles()
})()
