const BUDGET = 1500000

const quotes = [
  {
    id: 1, shop: 'Florist Thảo Điền Atelier', level: 'Đối tác uy tín', rating: 4.9, reviews: 148,
    area: 'Thảo Điền, Thủ Đức', orders: 520, best: true,
    plan: 'Pink Nude Dream', days: 1, price: 1450000, image: '../images/flowers/pink-vase.jpg',
    description: 'Atelier đề xuất bó hoa tone Pink Nude với điểm nhấn 15 bông hồng Ohara nhập khẩu, phối cùng hoa phi yến trắng và lá bạc. Gói 3 lớp giấy lụa Hàn Quốc màu kem, kèm thiệp viết tay.',
    items: ['15 hồng Ohara Pink', '5 cành phi yến trắng', 'Cúc tana Đà Lạt', 'Lá bạc Eucalyptus', 'Nơ lụa & thiệp viết tay'],
  },
  {
    id: 2, shop: "L'Amour Atelier", level: 'Đối tác uy tín', rating: 4.8, reviews: 96,
    area: 'Quận 3, TP.HCM', orders: 310, best: false,
    plan: 'Parisian Romance', days: 2, price: 1500000, image: '../images/flowers/autumn-bowl.jpg',
    description: 'Bó hoa phong cách Pháp lãng mạn, dùng hồng Juliet David Austin phối lan tường kem và cành tuyết mai mềm mại, đặt trong túi xách mica trong suốt.',
    items: ['Hồng Juliet David Austin', 'Lan tường kem', 'Cát tường trắng', 'Cành tuyết mai', 'Túi mica quà tặng'],
  },
  {
    id: 3, shop: 'Sài Gòn Hoa Tươi', level: 'Đối tác mới', rating: 4.7, reviews: 72,
    area: 'Quận 1, TP.HCM', orders: 150, best: false,
    plan: 'Kem Dâu Tươi Mới', days: 1, price: 1250000, image: '../images/flowers/red-roses.jpg',
    description: 'Hồng cánh sen Đà Lạt loại 1 kết hợp hoa baby trắng, bó dáng tròn đều ngọt ngào, gói giấy pastel kem trắng, tặng kèm thiệp ép nhũ.',
    items: ['20 hồng kem dâu Đà Lạt', 'Hoa baby trắng', 'Lá bạc Đà Lạt', 'Giấy kraft kem lụa', 'Thiệp ép nhũ'],
  },
]

const quoteList = document.getElementById('quoteList')
const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'))
const rejectModal = new bootstrap.Modal(document.getElementById('rejectModal'))

let choosingId = null
let selectedId = null
let cancelled = false

document.getElementById('quoteCount').textContent = quotes.length + ' đề xuất'


function priceDiffText(price) {
  if (price < BUDGET) return '<span class="price-diff text-forest"><i class="fa-solid fa-arrow-down me-1"></i>Thấp hơn ngân sách ' + FW.formatVnd(BUDGET - price) + '</span>'
  if (price > BUDGET) return '<span class="price-diff text-rose"><i class="fa-solid fa-arrow-up me-1"></i>Cao hơn ngân sách ' + FW.formatVnd(price - BUDGET) + '</span>'
  return '<span class="price-diff text-forest"><i class="fa-solid fa-check me-1"></i>Khớp ngân sách</span>'
}

function chooseButton(q) {
  if (q.id === selectedId) {
    return '<button type="button" class="btn btn-forest w-100" disabled><i class="fa-solid fa-check me-1"></i>Đã chọn</button>'
  }
  if (selectedId || cancelled) {
    return '<button type="button" class="btn btn-ghost w-100" disabled>Không được chọn</button>'
  }
  return '<button type="button" class="btn btn-peach w-100" data-id="' + q.id + '">Chọn báo giá này <i class="fa-solid fa-arrow-right ms-1"></i></button>'
}

function renderQuotes() {
  let html = ''
  quotes.forEach(function (q) {
    let cardClass = 'quote-card'
    if (q.best && !selectedId && !cancelled) cardClass += ' best'
    if (q.id === selectedId) cardClass += ' selected'
    if ((selectedId && q.id !== selectedId) || cancelled) cardClass += ' faded'

    let items = ''
    q.items.forEach(function (item) { items += '<span class="tag">' + item + '</span>' })

    html += `
      <article class="${cardClass}">
        ${q.best && !selectedId && !cancelled ? '<div class="best-label"><i class="fa-solid fa-star me-1"></i>Đề xuất nổi bật</div>' : ''}
        <div class="quote-body">
          <div class="row g-4">
            <div class="col-lg-3">
              <div class="shop-avatar">${q.shop.charAt(0)}</div>
              <div class="shop-name">${q.shop}</div>
              <div class="small text-forest mb-2"><i class="fa-solid fa-certificate me-1"></i>${q.level}</div>
              <div class="mb-3"><i class="fa-solid fa-star text-rose me-1"></i><strong>${q.rating}</strong> <span class="small text-muted-fw">· ${q.reviews} đánh giá</span></div>
              <div class="shop-meta">
                <div><i class="fa-solid fa-location-dot"></i>${q.area}</div>
                <div><i class="fa-regular fa-circle-check"></i>${q.orders}+ đơn đã hoàn thành</div>
              </div>
            </div>

            <div class="col-lg-5">
              <div class="d-flex flex-wrap gap-2 align-items-center">
                <span class="plan-chip">Phương án: ${q.plan}</span>
                <span class="small text-muted-fw"><i class="fa-regular fa-clock me-1"></i>Hoàn thành trong ${q.days} ngày</span>
              </div>
              <p class="plan-text">"${q.description}"</p>
              <div class="items-box">
                <div class="small fw-semibold mb-2">THÀNH PHẦN HOA &amp; PHỤ KIỆN</div>
                ${items}
              </div>
            </div>

            <div class="col-lg-4">
              <div class="price-box">
                <div class="small text-muted-fw mb-2">Ảnh mẫu shop từng làm</div>
                <img src="${q.image}" alt="Mẫu hoa của ${q.shop}">
                <div class="d-flex justify-content-between align-items-end mt-3 mb-3">
                  <div>
                    <div class="quote-price">${FW.formatVnd(q.price)}</div>
                    ${priceDiffText(q.price)}
                  </div>
                  <div class="small text-muted-fw text-end">Tổng giá<br>cho cả yêu cầu</div>
                </div>
                ${chooseButton(q)}
              </div>
            </div>
          </div>
        </div>
      </article>`
  })
  quoteList.innerHTML = html
}


quoteList.addEventListener('click', function (event) {
  const button = event.target.closest('[data-id]')
  if (!button) return

  const q = quotes.find(function (x) { return x.id === Number(button.dataset.id) })
  choosingId = q.id
  document.getElementById('confirmBody').innerHTML = `
    <p class="small text-muted-fw">Kiểm tra lại thông tin trước khi đặt. Sau khi xác nhận, các báo giá khác sẽ không còn hiệu lực.</p>
    <div class="confirm-row"><span>Shop thực hiện</span><strong>${q.shop}</strong></div>
    <div class="confirm-row"><span>Phương án</span><strong>${q.plan}</strong></div>
    <div class="confirm-row"><span>Thời gian hoàn thành</span><strong>${q.days} ngày</strong></div>
    <div class="confirm-row"><span>Hẹn giao</span><strong>28/10/2026 lúc 09:30</strong></div>
    <div class="confirm-row"><span>Tổng giá</span><strong class="text-rose">${FW.formatVnd(q.price)}</strong></div>`
  confirmModal.show()
})

document.getElementById('confirmBtn').addEventListener('click', function () {
  const q = quotes.find(function (x) { return x.id === choosingId })
  selectedId = q.id
  confirmModal.hide()
  renderQuotes()

  document.getElementById('selectedName').textContent = q.shop
  document.getElementById('selectedBanner').hidden = false
  document.getElementById('rejectAllBtn').disabled = true
  FW.toast('Đã đặt theo báo giá của ' + q.shop)
  window.scrollTo({ top: document.getElementById('selectedBanner').offsetTop - 100, behavior: 'smooth' })
})


document.getElementById('rejectAllBtn').addEventListener('click', function () {
  rejectModal.show()
})

document.getElementById('rejectConfirmBtn').addEventListener('click', function () {
  cancelled = true
  rejectModal.hide()
  renderQuotes()
  document.getElementById('cancelledBanner').hidden = false
  document.getElementById('rejectAllBtn').disabled = true
  FW.toast('Đã huỷ yêu cầu #YC-8921')
})


renderQuotes()
