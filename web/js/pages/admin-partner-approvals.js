(function () {
  'use strict'

  const e = FW.escapeHtml
  const profiles = [
    {
      id: 'PT-014', shop: 'Maison de Fleur', owner: 'Nguyễn Thị Ngọc Yến', phone: '0903 821 064',
      city: 'TP.HCM', address: 'Thảo Điền, TP. Thủ Đức, TP.HCM',
      submitted: '14/10/2026', status: 'Chờ duyệt', email: 'contact@maisondefleur.vn',
      profile: 'Thương hiệu hoa cưới thủ công theo phong cách Pháp, tập trung vào hoa tươi nhập khẩu và thiết kế theo yêu cầu.',
      images: ['lily-of-valley.jpg', 'wedding-serenade.jpg', 'white-tulips.jpg', 'pink-vase.jpg'],
    },
    {
      id: 'PT-015', shop: 'Tiệm Hoa Nắng Ban Mai', owner: 'Lê Văn Hưng', phone: '0918 240 320',
      city: 'TP.HCM', address: 'Bạch Đằng, Bình Thạnh, TP.HCM',
      submitted: '13/10/2026', status: 'Chờ duyệt', email: 'hello@nangbanmai.vn',
      profile: 'Cửa hàng hoa tươi phục vụ hoa sinh nhật, quà tặng và các dịp kỷ niệm.',
      images: ['sunshine-basket.jpg', 'red-roses.jpg', 'autumn-bowl.jpg', 'yellow-basket.jpg'],
    },
    {
      id: 'PT-016', shop: 'La Rose De Dalat', owner: 'Trần Minh Châu', phone: '0977 451 889',
      city: 'Đà Lạt', address: '12 Trần Hưng Đạo, Đà Lạt',
      submitted: '12/10/2026', status: 'Từ chối', email: 'hello@larosedalat.vn', reject_reason: 'Portfolio chưa có ảnh sản phẩm thật do cửa hàng tự làm.',
      profile: 'Xưởng hoa Đà Lạt cung cấp hoa tươi theo mùa và dịch vụ trang trí sự kiện.',
      images: ['pink-vase.jpg', 'green-hydrangea.jpg', 'grand-opening.jpg', 'autumn-bowl.jpg'],
    },
    {
      id: 'PT-017', shop: 'Flora Artisan Studio', owner: 'Vũ Quỳnh Anh', phone: '0901 622 511',
      city: 'TP.HCM', address: 'Quận 1, TP.HCM',
      submitted: '11/10/2026', status: 'Chờ duyệt', email: 'studio@floraartisan.vn',
      profile: 'Studio thiết kế hoa nghệ thuật và quà tặng thủ công cho cá nhân, doanh nghiệp.',
      images: ['event-stand.jpg', 'yellow-basket.jpg', 'lily-of-valley.jpg', 'sunshine-basket.jpg'],
    },
  ]
  const STATUS_BADGE = { 'Chờ duyệt': 'gold', 'Đã duyệt': 'green', 'Từ chối': 'rose' }
  let selectedId = profiles[0].id
  let statusFilter = ''

  function renderStats() {
    const count = (status) => profiles.filter((profile) => profile.status === status).length
    document.getElementById('statPending').innerHTML = `${count('Chờ duyệt')} <small>hồ sơ</small>`
    document.getElementById('statApproved').innerHTML = `${count('Đã duyệt')} <small>hồ sơ</small>`
    document.getElementById('statRejected').innerHTML = `${count('Từ chối')} <small>hồ sơ</small>`
    document.getElementById('statTotal').innerHTML = `${profiles.length} <small>hồ sơ</small>`
  }

  function renderProfile(profile) {
    const panel = document.getElementById('partnerProfile')
    if (!profile) {
      panel.innerHTML = '<div class="partner-empty-state">Chọn hồ sơ để xem thông tin chi tiết.</div>'
      return
    }

    panel.innerHTML = `
      <div class="review-profile-heading">
        <div><h2>${e(profile.shop)}</h2><p>${e(profile.city)}</p></div>
        <span class="badge-soft ${STATUS_BADGE[profile.status]}">${e(profile.status)}</span>
      </div>
      <div class="review-portfolio">${profile.images.map((image) => `<img src="../images/flowers/${e(image)}" alt="Tác phẩm ${e(profile.shop)}">`).join('')}</div>
      <div class="review-profile-facts">
        <div><small>Người đại diện</small><strong>${e(profile.owner)}</strong></div>
        <div><small>Số điện thoại</small><strong>${e(profile.phone)}</strong></div>
        <div><small>Email</small><strong>${e(profile.email)}</strong></div>
        <div><small>Ngày gửi</small><strong>${e(profile.submitted)}</strong></div>
        <div class="full"><small>Địa chỉ cửa hàng</small><strong>${e(profile.address)}</strong></div>
      </div>
      <div class="review-profile-bio"><strong class="d-block text-dark mb-1">Giới thiệu thương hiệu</strong>${e(profile.profile)}</div>
      ${profile.reject_reason ? `<div class="review-profile-bio"><strong class="d-block text-dark mb-1">Lý do từ chối</strong>${e(profile.reject_reason)}</div>` : ''}
      ${profile.status === 'Chờ duyệt' ? `
      <div class="mt-3" id="rejectBox" hidden>
        <label class="form-label small fw-semibold" for="rejectReason">Lý do từ chối <span class="text-rose">*</span></label>
        <textarea id="rejectReason" class="form-control" rows="3" placeholder="Ví dụ: Portfolio chưa đủ ảnh sản phẩm thật..."></textarea>
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
      (!query || `${profile.shop} ${profile.owner} ${profile.phone} ${profile.city}`.toLowerCase().includes(query)))

    document.getElementById('partnerResultCount').textContent = `${visible.length} hồ sơ`
    renderStats()
    document.getElementById('approvalTable').innerHTML = visible.map((profile) => `
      <button type="button" class="review-application-row ${profile.id === selectedId ? 'active' : ''}" data-profile-id="${e(profile.id)}">
        <span class="review-shop-cell"><span class="review-shop-avatar"><i class="fa-solid fa-store"></i></span><span><strong>${e(profile.shop)}</strong><small>${e(profile.city)} · ${e(profile.id)}</small></span></span>
        <span class="review-app-column">${e(profile.owner)}<small>${e(profile.phone)}</small></span>
        <span class="review-app-column"><span class="badge-soft ${STATUS_BADGE[profile.status]}">${e(profile.status)}</span><small>${e(profile.submitted)}</small></span>
        <i class="fa-solid fa-chevron-right text-muted-fw"></i>
      </button>
    `).join('') || '<div class="partner-empty-state m-3">Không tìm thấy hồ sơ phù hợp.</div>'

    renderProfile(visible.find((profile) => profile.id === selectedId) || visible[0])
  }

  document.getElementById('approvalTable').addEventListener('click', (event) => {
    const row = event.target.closest('[data-profile-id]')
    if (!row) return
    selectedId = row.dataset.profileId
    renderList()
  })
  document.getElementById('partnerProfile').addEventListener('click', (event) => {
    const button = event.target.closest('[data-profile-action]')
    if (!button) return
    const profile = profiles.find((item) => item.id === button.dataset.profileId)
    if (!profile) return
    if (button.dataset.profileAction === 'approve') {
      profile.status = 'Đã duyệt'
      FW.toast(`Đã phê duyệt hồ sơ ${profile.shop}.`)
      renderList()
      return
    }
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
    profile.status = 'Từ chối'
    profile.reject_reason = reason.value.trim()
    FW.toast(`Đã từ chối hồ sơ ${profile.shop} và gửi lý do cho ứng viên.`)
    renderList()
  })
  document.getElementById('partnerSearch').addEventListener('input', renderList)
  document.getElementById('partnerRegion').addEventListener('change', renderList)
  document.querySelectorAll('.review-state-tabs button').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.review-state-tabs button').forEach((tab) => tab.classList.remove('active'))
    button.classList.add('active')
    statusFilter = button.dataset.status
    renderList()
  }))

  renderList()
})()
