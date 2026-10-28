const pairTable = document.getElementById('pairTable')
const runTable = document.getElementById('runTable')
const trainButton = document.getElementById('trainButton')


function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text == null ? '' : text
  return div.innerHTML
}

function percent(value) {
  return value == null ? '—' : (value * 100).toFixed(1) + '%'
}

function formatDateTime(value) {
  const d = new Date(value)
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear()
    + ' ' + d.toTimeString().slice(0, 5)
}

function triggerText(run) {
  if (run.trigger_type === 'MANUAL') return '<span class="badge-soft gold">Bấm tay</span>' + (run.triggered_by_name ? '<div class="small text-muted-fw">' + escapeHtml(run.triggered_by_name) + '</div>' : '')
  return '<span class="badge-soft gray">Tự động</span>'
}


function renderLatest(latest) {
  if (!latest) {
    document.getElementById('latestInfo').textContent = 'Mô hình chưa được huấn luyện lần nào.'
    return
  }
  document.getElementById('hitLabel').textContent = 'Hit rate@' + latest.top_k
  document.getElementById('precisionLabel').textContent = 'Precision@' + latest.top_k
  document.getElementById('statHit').textContent = percent(latest.hit_rate)
  document.getElementById('statPrecision').textContent = percent(latest.precision_at_k)
  document.getElementById('statBaseline').textContent = percent(latest.baseline_hit_rate)
  document.getElementById('statData').textContent = latest.interactions + ' lượt'
  document.getElementById('latestInfo').innerHTML =
    'Lần huấn luyện gần nhất: <strong>' + formatDateTime(latest.trained_at) + '</strong> · '
    + latest.customers + ' khách, ' + latest.products + ' mẫu hoa, ' + latest.pairs + ' cặp gợi ý · mất ' + latest.duration_ms + ' ms. '
    + 'Đánh giá: với ' + latest.test_users + ' khách, giấu đi lần mua gần nhất rồi xem mô hình có đoán ra trong ' + latest.top_k + ' gợi ý đầu không.'
}

function renderPairs(pairs) {
  if (pairs.length === 0) {
    pairTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted-fw py-4">Chưa có dữ liệu.</td></tr>'
    return
  }
  pairTable.innerHTML = pairs.map(function (p) {
    return `
      <tr>
        <td class="fw-semibold">${escapeHtml(p.product_name)}</td>
        <td>${escapeHtml(p.similar_name)}</td>
        <td class="text-end">${p.cf_score.toFixed(2)}</td>
        <td class="text-end fw-semibold">${p.score.toFixed(2)}</td>
      </tr>`
  }).join('')
}

function renderRuns(runs) {
  if (runs.length === 0) {
    runTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted-fw py-4">Chưa có lần huấn luyện nào.</td></tr>'
    return
  }
  runTable.innerHTML = runs.map(function (r) {
    return `
      <tr>
        <td>${formatDateTime(r.trained_at)}</td>
        <td>${triggerText(r)}</td>
        <td class="text-end">${r.interactions}</td>
        <td class="text-end fw-semibold">${percent(r.hit_rate)}</td>
      </tr>`
  }).join('')
}

function render(data) {
  renderLatest(data.latest)
  renderPairs(data.top_pairs)
  renderRuns(data.runs)
}


async function load() {
  try {
    render(await FW_API.getRecommendationModel())
  } catch (error) {
    pairTable.innerHTML = `<tr><td colspan="4" class="text-center text-rose py-4">${escapeHtml(error.message)}</td></tr>`
    runTable.innerHTML = ''
  }
}

trainButton.addEventListener('click', async function () {
  trainButton.disabled = true
  trainButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang huấn luyện...'
  try {
    render(await FW_API.trainRecommendationModel())
    FW.toast('Đã huấn luyện lại mô hình gợi ý.')
  } catch (error) {
    FW.toast(error.message)
  } finally {
    trainButton.disabled = false
    trainButton.innerHTML = '<i class="fa-solid fa-rotate me-1"></i>Huấn luyện lại'
  }
})

load()
