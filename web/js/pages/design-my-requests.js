const requests = [
  {
    id: 8921, title: 'Bó hoa kỷ niệm 5 năm ngày cưới tone hồng pastel ngọt ngào',
    status: 'OPEN', image: '../images/flowers/hero-bouquet.jpg',
    budget: 1500000, occasion: 'Kỷ niệm / Tình yêu', date: '28/10/2026 lúc 09:30', timeLeft: 'Còn 2 ngày',
    quotes: [
      { short: 'TĐ', color: '#3f6b4e', name: 'Florist Thảo Điền Atelier' },
      { short: 'LA', color: '#b5452f', name: "L'Amour Atelier" },
      { short: 'SG', color: '#86a98a', name: 'Sài Gòn Hoa Tươi' },
    ],
    minPrice: 1250000,
  },
  {
    id: 9032, title: 'Kệ hoa mừng khai trương showroom tone cam đất & trắng hiện đại',
    status: 'OPEN', image: '../images/flowers/event-stand.jpg',
    budget: 2500000, occasion: 'Khai trương', date: '30/10/2026 lúc 08:00', timeLeft: 'Còn 4 ngày',
    quotes: [], minPrice: 0,
  },
  {
    id: 8710, title: 'Hộp hoa tone xanh lá eucalyptus & cúc tana sinh nhật bạn thân',
    status: 'CONFIRMED', image: '../images/flowers/green-hydrangea.jpg',
    shop: 'Nhiên Floral Art', price: 1200000, date: '26/10/2026 lúc 16:30', orderStep: 2,
  },
  {
    id: 8655, title: 'Bó hoa giấy tone tím lavender tặng cô giáo',
    status: 'CANCELLED', image: '../images/flowers/autumn-bowl.jpg',
    budget: 600000, occasion: 'Chúc mừng / Tốt nghiệp', date: '20/10/2026 lúc 10:00',
  },
]

const ORDER_STEPS = ['Chờ xử lý', 'Đã xử lý', 'Đang giao', 'Đã nhận']

const requestList = document.getElementById('requestList')
const cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'))

let cancelId = null


function infoRow(items) {
  let html = '<div class="info-row row g-2 mx-0">'
  items.forEach(function (item) {
    html += '<div class="col-sm-4"><div class="info-label">' + item[0] + '</div><div class="info-value">' + item[1] + '</div></div>'
  })
  return html + '</div>'
}

function openContent(r) {
  if (r.quotes.length === 0) {
    return infoRow([['Ngân sách dự kiến', FW.formatVnd(r.budget)], ['Dịp tặng', r.occasion], ['Hẹn giao', r.date]])
      + '<div class="waiting-box"><i class="fa-regular fa-hourglass-half me-2 text-forest"></i>Đang chờ Đối tác báo giá. Bạn sẽ nhận được thông báo khi có shop gửi đề xuất.</div>'
      + '<div class="d-flex flex-wrap gap-2 align-items-center">'
      + '<button type="button" class="btn btn-ghost btn-sm" disabled><i class="fa-solid fa-scale-balanced me-1"></i>Chưa có báo giá</button>'
      + '<button type="button" class="btn btn-link text-rose btn-sm ms-auto" data-cancel="' + r.id + '"><i class="fa-regular fa-circle-xmark me-1"></i>Huỷ yêu cầu</button>'
      + '</div>'
  }

  let avatars = ''
  let names = []
  r.quotes.forEach(function (q) {
    avatars += '<span style="background:' + q.color + '">' + q.short + '</span>'
    names.push(q.name)
  })

  return infoRow([['Ngân sách dự kiến', FW.formatVnd(r.budget)], ['Dịp tặng', r.occasion], ['Hẹn giao', r.date]])
    + '<div class="d-flex flex-wrap align-items-center gap-3 mb-3">'
    + '<div class="quote-avatars">' + avatars + '</div>'
    + '<div class="small"><strong>' + r.quotes.length + ' shop đã gửi báo giá</strong><br><span class="text-muted-fw">' + names.join(', ') + '</span></div>'
    + '<span class="ms-auto small text-forest fw-semibold">Giá từ ' + FW.formatVnd(r.minPrice) + '</span>'
    + '</div>'
    + '<div class="d-flex flex-wrap gap-2 align-items-center">'
    + '<a href="compare-quotes.html" class="btn btn-peach btn-sm"><i class="fa-solid fa-scale-balanced me-1"></i>So sánh &amp; chọn báo giá (' + r.quotes.length + ')</a>'
    + '<button type="button" class="btn btn-link text-rose btn-sm ms-auto" data-cancel="' + r.id + '"><i class="fa-regular fa-circle-xmark me-1"></i>Huỷ yêu cầu</button>'
    + '</div>'
}

function confirmedContent(r) {
  let steps = ''
  ORDER_STEPS.forEach(function (step, index) {
    const done = index <= r.orderStep
    steps += '<span class="' + (done ? 'done' : '') + '"><i class="fa-' + (done ? 'solid fa-circle-check' : 'regular fa-circle') + ' me-1"></i>' + step + '</span>'
  })
  const percent = (r.orderStep + 1) / ORDER_STEPS.length * 100

  return infoRow([['Shop thực hiện', '<i class="fa-solid fa-store me-1 text-forest"></i>' + r.shop], ['Giá đã chốt', '<span class="text-forest">' + FW.formatVnd(r.price) + '</span>'], ['Dự kiến giao', r.date]])
    + '<div class="progress-steps">' + steps + '</div>'
    + '<div class="progress"><div class="progress-bar" style="width: ' + percent + '%"></div></div>'
    + '<div class="d-flex flex-wrap gap-2">'
    + '<a href="../account/orders.html" class="btn btn-forest btn-sm"><i class="fa-solid fa-box me-1"></i>Xem đơn hàng</a>'
    + '<a href="compare-quotes.html" class="btn btn-ghost btn-sm">Xem báo giá đã chọn</a>'
    + '</div>'
}

function cancelledContent(r) {
  return infoRow([['Ngân sách dự kiến', FW.formatVnd(r.budget)], ['Dịp tặng', r.occasion], ['Hẹn giao', r.date]])
    + '<div class="small text-muted-fw"><i class="fa-solid fa-ban me-1"></i>Yêu cầu đã được huỷ.</div>'
}

function renderList() {
  let html = ''
  requests.forEach(function (r) {
    let badge = ''
    let chip = ''
    let content = ''

    if (r.status === 'OPEN' && r.quotes.length > 0) {
      badge = '<span class="state-badge open">Đang nhận báo giá</span>'
      chip = '<span class="deadline-chip"><i class="fa-regular fa-clock me-1"></i>' + r.timeLeft + '</span>'
      content = openContent(r)
    } else if (r.status === 'OPEN') {
      badge = '<span class="state-badge waiting">Chờ báo giá</span>'
      chip = '<span class="deadline-chip soft"><i class="fa-regular fa-clock me-1"></i>' + r.timeLeft + '</span>'
      content = openContent(r)
    } else if (r.status === 'CONFIRMED') {
      badge = '<span class="state-badge confirmed">Đã chọn shop</span>'
      chip = '<span class="deadline-chip soft"><i class="fa-solid fa-truck me-1"></i>Đơn: ' + ORDER_STEPS[r.orderStep] + '</span>'
      content = confirmedContent(r)
    } else {
      badge = '<span class="state-badge cancelled">Đã huỷ</span>'
      content = cancelledContent(r)
    }

    html += `
      <article class="my-request ${r.status === 'CANCELLED' ? 'cancelled' : ''}">
        <div class="row g-4">
          <div class="col-md-4">
            <div class="my-request-image">
              <img src="${r.image}" alt="${r.title}">
              ${badge}
            </div>
          </div>
          <div class="col-md-8">
            <div class="d-flex justify-content-between align-items-center gap-2">
              <span class="request-code">MÃ YÊU CẦU: #YC-${r.id}</span>
              ${chip}
            </div>
            <h3 class="my-request-title">${r.title}</h3>
            ${content}
          </div>
        </div>
      </article>`
  })
  requestList.innerHTML = html

  document.getElementById('countOpen').textContent = requests.filter(function (r) { return r.status === 'OPEN' }).length
  document.getElementById('countConfirmed').textContent = requests.filter(function (r) { return r.status === 'CONFIRMED' }).length
  document.getElementById('countCancelled').textContent = requests.filter(function (r) { return r.status === 'CANCELLED' }).length
}


requestList.addEventListener('click', function (event) {
  const button = event.target.closest('[data-cancel]')
  if (!button) return
  cancelId = Number(button.dataset.cancel)
  document.getElementById('cancelCode').textContent = '#YC-' + cancelId
  cancelModal.show()
})

document.getElementById('cancelConfirmBtn').addEventListener('click', function () {
  const r = requests.find(function (x) { return x.id === cancelId })
  r.status = 'CANCELLED'
  cancelModal.hide()
  renderList()
  FW.toast('Đã huỷ yêu cầu #YC-' + r.id)
})


document.addEventListener('fw:partials-loaded', function () {
  const items = document.querySelectorAll('.sidebar .nav-item')
  items.forEach(function (item) { item.classList.remove('selected') })
  const design = document.querySelector('.sidebar .nav-item.design')
  if (design) design.classList.add('selected')
})


renderList()
