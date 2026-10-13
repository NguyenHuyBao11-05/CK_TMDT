const sentQuotes = [
  {
    id: 31, requestId: 8921, title: 'Bó hoa kỷ niệm 5 năm ngày cưới tone hồng pastel ngọt ngào', customer: 'Lan Phương',
    image: '../images/flowers/hero-bouquet.jpg', budget: 1500000, deliveryDate: '28/10/2026 lúc 09:30',
    price: 1450000, days: 1, sentAt: '24/10/2026', status: 'PENDING',
    description: 'Dùng 15 hồng Ohara Pink, phối phi yến trắng và lá bạc, gói 3 lớp giấy lụa Hàn Quốc màu kem, kèm thiệp viết tay.',
    sampleImage: '../images/flowers/pink-vase.jpg',
  },
  {
    id: 28, requestId: 8915, title: 'Bình hoa lan hồ điệp trắng cho sảnh khách sạn', customer: 'The Reverie Team',
    image: '../images/flowers/grand-opening.jpg', budget: 4500000, deliveryDate: '26/10/2026 lúc 16:00',
    price: 4300000, days: 1, sentAt: '23/10/2026', status: 'PENDING',
    description: '7 cành lan hồ điệp trắng loại A, bình gốm men đồng, bảo hành hoa tươi 3 tuần.',
    sampleImage: '',
  },
  {
    id: 25, requestId: 8910, title: 'Bó hoa giấy tone xanh lá tặng sinh nhật mẹ', customer: 'Hải Yến',
    image: '../images/flowers/green-hydrangea.jpg', budget: 850000, deliveryDate: '30/10/2026 lúc 07:30',
    price: 820000, days: 3, sentAt: '22/10/2026', status: 'PENDING',
    description: 'Cẩm tú cầu giấy nhún xanh pastel, lá giấy xếp tay, gói giấy kraft kèm nơ cói.',
    sampleImage: '',
  },
  {
    id: 19, requestId: 8710, title: 'Hộp hoa tone xanh lá eucalyptus & cúc tana sinh nhật bạn thân', customer: 'Minh Anh',
    image: '../images/flowers/white-tulips.jpg', budget: 1300000, deliveryDate: '26/10/2026 lúc 16:30',
    price: 1200000, days: 2, sentAt: '18/10/2026', status: 'SELECTED',
    description: 'Hộp tròn xanh rêu, eucalyptus phối cúc tana và tulip trắng, có ngăn nhỏ để thiệp.',
    sampleImage: '../images/flowers/lily-of-valley.jpg',
  },
  {
    id: 15, requestId: 8692, title: 'Lẵng hoa mừng tốt nghiệp tone vàng cam rực rỡ', customer: 'Quốc Bảo',
    image: '../images/flowers/yellow-basket.jpg', budget: 900000, deliveryDate: '15/10/2026 lúc 08:00',
    price: 880000, days: 1, sentAt: '12/10/2026', status: 'SELECTED',
    description: 'Lẵng mây hướng dương mix hồng vàng, cao 60cm, kèm gấu bông tốt nghiệp.',
    sampleImage: '',
  },
  {
    id: 11, requestId: 8655, title: 'Hộp hoa hồng đỏ nhung kỷ niệm ngày quen nhau', customer: 'Đăng Khoa',
    image: '../images/flowers/red-roses.jpg', budget: 1200000, deliveryDate: '20/10/2026 lúc 18:00',
    price: 1350000, days: 2, sentAt: '10/10/2026', status: 'REJECTED', rejectReason: 'Khách đã chọn báo giá của shop khác.',
    description: 'Hộp hoa 20 hồng nhung đỏ, hộp tròn đen, ngăn socola ở giữa.',
    sampleImage: '',
  },
]

const STATUS = {
  PENDING: '<span class="status-chip pending"><i class="fa-regular fa-hourglass-half me-1"></i>Chờ khách chọn</span>',
  SELECTED: '<span class="status-chip selected"><i class="fa-solid fa-circle-check me-1"></i>Được chọn</span>',
  REJECTED: '<span class="status-chip rejected"><i class="fa-solid fa-circle-xmark me-1"></i>Bị từ chối</span>',
}

const quoteTable = document.getElementById('quoteTable')
const detailModal = new bootstrap.Modal(document.getElementById('detailModal'))


function renderTable() {
  let html = ''
  sentQuotes.forEach(function (q) {
    html += `
      <tr>
        <td>
          <div class="request-cell">
            <img src="${q.image}" alt="">
            <div>
              <div class="code">#YC-${q.requestId} · Khách ${q.customer}</div>
              <div class="title">${q.title}</div>
            </div>
          </div>
        </td>
        <td class="fw-semibold text-nowrap">${FW.formatVnd(q.price)}</td>
        <td class="d-none d-md-table-cell text-nowrap">${q.days} ngày</td>
        <td class="d-none d-lg-table-cell text-nowrap">${q.sentAt}</td>
        <td>${STATUS[q.status]}</td>
        <td class="text-end">
          <button type="button" class="btn btn-ghost btn-sm text-nowrap" data-id="${q.id}">Xem <i class="fa-solid fa-chevron-right ms-1"></i></button>
        </td>
      </tr>`
  })
  quoteTable.innerHTML = html

  document.getElementById('countAll').textContent = sentQuotes.length
  document.getElementById('countPending').textContent = sentQuotes.filter(function (q) { return q.status === 'PENDING' }).length
  document.getElementById('countSelected').textContent = sentQuotes.filter(function (q) { return q.status === 'SELECTED' }).length
  document.getElementById('countRejected').textContent = sentQuotes.filter(function (q) { return q.status === 'REJECTED' }).length
}


function resultText(q) {
  if (q.status === 'SELECTED') {
    return '<div class="result-box selected"><i class="fa-solid fa-circle-check text-forest me-2"></i>Khách đã chọn báo giá của bạn. Đơn hàng đã được tạo, hãy bắt đầu thực hiện và gửi ảnh hoàn thành trước khi giao.</div>'
  }
  if (q.status === 'REJECTED') {
    return '<div class="result-box rejected"><i class="fa-solid fa-circle-xmark text-rose me-2"></i>' + q.rejectReason + '</div>'
  }
  return '<div class="result-box pending"><i class="fa-regular fa-hourglass-half me-2"></i>Khách đang xem và so sánh các báo giá. Bạn sẽ nhận được thông báo khi khách chọn.</div>'
}

function openDetail(id) {
  const q = sentQuotes.find(function (x) { return x.id === Number(id) })
  const sample = q.sampleImage
    ? '<div class="col-md-5"><img class="detail-photo" src="' + q.sampleImage + '" alt="Ảnh mẫu đã gửi"></div>'
    : ''

  document.getElementById('detailTitle').textContent = 'Báo giá cho yêu cầu #YC-' + q.requestId
  document.getElementById('detailBody').innerHTML = `
    <div class="d-flex gap-3 align-items-center mb-3">
      <img src="${q.image}" alt="" style="width: 72px; height: 72px; object-fit: cover; border-radius: 12px">
      <div>
        <div class="small text-muted-fw">Khách ${q.customer}</div>
        <h3 class="h5 mb-1">${q.title}</h3>
        ${STATUS[q.status]}
      </div>
    </div>

    <div class="detail-grid row g-3 mx-0 mb-3">
      <div class="col-6 col-md-3"><div class="detail-label">Ngân sách của khách</div><div class="detail-value">${FW.formatVnd(q.budget)}</div></div>
      <div class="col-6 col-md-3"><div class="detail-label">Giá bạn báo</div><div class="detail-value text-rose">${FW.formatVnd(q.price)}</div></div>
      <div class="col-6 col-md-3"><div class="detail-label">Thời gian làm</div><div class="detail-value">${q.days} ngày</div></div>
      <div class="col-6 col-md-3"><div class="detail-label">Hẹn giao</div><div class="detail-value">${q.deliveryDate}</div></div>
    </div>

    <div class="row g-3 mb-3">
      <div class="${q.sampleImage ? 'col-md-7' : 'col-12'}">
        <div class="small fw-semibold mb-1">Mô tả cách làm bạn đã gửi</div>
        <p class="fst-italic mb-0">"${q.description}"</p>
        <div class="small text-muted-fw mt-2">Gửi ngày ${q.sentAt}</div>
      </div>
      ${sample}
    </div>

    ${resultText(q)}`

  detailModal.show()
}

quoteTable.addEventListener('click', function (event) {
  const button = event.target.closest('[data-id]')
  if (button) openDetail(button.dataset.id)
})


renderTable()
