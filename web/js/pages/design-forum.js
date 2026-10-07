const requests = [
  {
    id: 8921, customer: 'Lan Phương', title: 'Bó hoa kỷ niệm 5 năm ngày cưới tone hồng pastel ngọt ngào',
    occasion: 'Kỷ niệm / Tình yêu', material: 'Hoa thật', color: 'Pastel mộng mơ', budget: 1500000, quantity: 1,
    date: '28/10/2026 lúc 09:30', timeLeft: 'Còn 2 ngày', quotes: 2, image: '../images/flowers/hero-bouquet.jpg',
    description: 'Muốn bó hoa phong cách Hàn Quốc dáng bay, phối hồng Ohara với hoa phụ nhỏ màu trắng, giấy gói màu kem tối giản.',
  },
  {
    id: 8919, customer: 'Minh Tuấn', title: 'Lẵng hoa chúc mừng khai trương showroom tone cam rực rỡ',
    occasion: 'Khai trương', material: 'Hoa thật', color: 'Cam hoàng hôn', budget: 2800000, quantity: 2,
    date: '29/10/2026 lúc 08:00', timeLeft: 'Còn 3 ngày', quotes: 3, image: '../images/flowers/sunshine-basket.jpg',
    description: 'Cần 2 lẵng hoa đặt hai bên cửa showroom, tone cam vàng nổi bật, có băng rôn ghi tên công ty.',
  },
  {
    id: 8915, customer: 'The Reverie Team', title: 'Bình hoa lan hồ điệp trắng cho sảnh khách sạn',
    occasion: 'Khác', material: 'Hoa thật', color: 'Trắng tinh khôi', budget: 4500000, quantity: 1,
    date: '26/10/2026 lúc 16:00', timeLeft: 'Còn 10 giờ', quotes: 6, image: '../images/flowers/grand-opening.jpg',
    description: 'Bình lan hồ điệp trắng cao khoảng 1m2 đặt ở quầy lễ tân, bình gốm tông đồng.',
  },
  {
    id: 8910, customer: 'Hải Yến', title: 'Bó hoa giấy tone xanh lá tặng sinh nhật mẹ',
    occasion: 'Sinh nhật', material: 'Hoa giấy', color: 'Xanh nhiệt đới', budget: 850000, quantity: 1,
    date: '30/10/2026 lúc 07:30', timeLeft: 'Còn 4 ngày', quotes: 4, image: '../images/flowers/green-hydrangea.jpg',
    description: 'Mẹ thích hoa cẩm tú cầu xanh, muốn làm bằng hoa giấy để giữ được lâu, gói giấy kraft đơn giản.',
  },
  {
    id: 8898, customer: 'Đăng Khoa', title: 'Hộp hoa hồng đỏ nhung kỷ niệm ngày quen nhau',
    occasion: 'Kỷ niệm / Tình yêu', material: 'Hoa nhung', color: 'Đỏ nồng nàn', budget: 1200000, quantity: 1,
    date: '31/10/2026 lúc 18:00', timeLeft: 'Còn 5 ngày', quotes: 5, image: '../images/flowers/red-roses.jpg',
    description: 'Hộp hoa hồng nhung đỏ 20 bông, hộp tròn màu đen, có chỗ để socola nhỏ ở giữa.',
  },
]

const requestList = document.getElementById('requestList')
const requestDetail = document.getElementById('requestDetail')
const budgetHint = document.getElementById('budgetHint')
const quoteForm = document.getElementById('quoteForm')
const modal = new bootstrap.Modal(document.getElementById('quoteModal'))

let currentRequest = null


function renderList() {
  let html = ''
  requests.forEach(function (r) {
    html += `
      <div class="col-md-6 col-lg-4">
        <article class="request-card">
          <div class="request-thumb">
            <img src="${r.image}" alt="${r.title}">
            <span class="status-badge">Đang nhận báo giá</span>
            <span class="deadline-badge"><i class="fa-regular fa-clock me-1"></i>${r.timeLeft}</span>
          </div>
          <div class="request-body">
            <div class="request-code">#YC-${r.id} · Khách ${r.customer}</div>
            <h2 class="request-title">${r.title}</h2>
            <div>
              <span class="tag green">${r.occasion}</span>
              <span class="tag">${r.material}</span>
              <span class="tag">${r.color}</span>
              <span class="tag">${r.quantity} bó</span>
            </div>
            <div class="request-info">
              <div class="d-flex justify-content-between align-items-end">
                <div>
                  <div class="label-small">Ngân sách dự kiến</div>
                  <div class="request-budget">${FW.formatVnd(r.budget)}</div>
                </div>
                <div class="small text-forest"><i class="fa-solid fa-store me-1"></i>${r.quotes} shop đã báo</div>
              </div>
              <div class="small text-muted-fw mt-2"><i class="fa-regular fa-calendar me-1"></i>Giao: ${r.date}</div>
              <button type="button" class="btn btn-forest w-100 mt-3" data-id="${r.id}">
                Xem chi tiết &amp; Báo giá <i class="fa-solid fa-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </article>
      </div>`
  })
  requestList.innerHTML = html
}


function openModal(id) {
  currentRequest = requests.find(function (r) { return r.id === Number(id) })

  requestDetail.innerHTML = `
    <span class="badge text-bg-dark mb-2">Yêu cầu #YC-${currentRequest.id}</span>
    <div class="small text-muted-fw mb-2"><i class="fa-regular fa-user me-1"></i>Khách ${currentRequest.customer}</div>
    <h3 class="h4 mb-3">${currentRequest.title}</h3>
    <div class="detail-box row g-3 mx-0 mb-3">
      <div class="col-6"><div class="label-small">Ngân sách mong muốn</div><div class="request-budget text-forest">${FW.formatVnd(currentRequest.budget)}</div></div>
      <div class="col-6"><div class="label-small">Dịp tặng hoa</div><div class="fw-semibold">${currentRequest.occasion}</div></div>
      <div class="col-6"><div class="label-small">Thời gian giao</div><div class="fw-semibold text-rose">${currentRequest.date}</div></div>
      <div class="col-6"><div class="label-small">Tông màu</div><div class="fw-semibold">${currentRequest.color}</div></div>
      <div class="col-6"><div class="label-small">Chất liệu</div><div class="fw-semibold">${currentRequest.material}</div></div>
      <div class="col-6"><div class="label-small">Số lượng</div><div class="fw-semibold">${currentRequest.quantity} bó / lẵng</div></div>
    </div>
    <img class="detail-image mb-3" src="${currentRequest.image}" alt="Ảnh khách tham khảo">
    <div class="detail-box">
      <div class="small fw-semibold mb-2"><i class="fa-regular fa-comment me-1"></i>Mô tả của khách</div>
      <p class="detail-note mb-0">${currentRequest.description}</p>
    </div>`

  budgetHint.textContent = 'Khách đặt: ' + FW.formatVnd(currentRequest.budget)
  quoteForm.reset()
  quoteForm.classList.remove('was-validated')
  modal.show()
}

requestList.addEventListener('click', function (event) {
  const button = event.target.closest('[data-id]')
  if (button) openModal(button.dataset.id)
})


quoteForm.addEventListener('submit', function (event) {
  event.preventDefault()
  quoteForm.classList.add('was-validated')
  if (!quoteForm.checkValidity()) return

  modal.hide()
  FW.toast('Đã gửi báo giá cho yêu cầu #YC-' + currentRequest.id)
})


renderList()
