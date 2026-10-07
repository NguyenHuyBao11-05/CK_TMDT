const form = document.getElementById('requestForm')
const budgetInput = document.getElementById('budget')
const budgetRange = document.getElementById('budgetRange')
const budgetDisplay = document.getElementById('budgetDisplay')
const desiredDateInput = document.getElementById('desiredDate')
const imageInput = document.getElementById('image')
const imagePreview = document.getElementById('imagePreview')
const imageError = document.getElementById('imageError')
const colorError = document.getElementById('colorError')

let imageData = ''

budgetRange.addEventListener('input', function () {
  budgetInput.value = budgetRange.value
  showBudget()
})

budgetInput.addEventListener('input', function () {
  budgetRange.value = budgetInput.value
  showBudget()
})

function showBudget() {
  const amount = Number(budgetInput.value) || 0
  budgetDisplay.textContent = FW.formatVnd(amount)
}

function getMinDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date
}

function toInputValue(date) {
  const pad = function (n) { return String(n).padStart(2, '0') }
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
    + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

desiredDateInput.min = toInputValue(getMinDate())
imageInput.addEventListener('change', function () {
  const file = imageInput.files[0]
  imageError.hidden = true
  imagePreview.hidden = true
  imageData = ''

  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    imageError.hidden = false
    imageInput.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = function () {
    imageData = reader.result
    imagePreview.src = imageData
    imagePreview.hidden = false
  }
  reader.readAsDataURL(file)
})



form.addEventListener('submit', function (event) {
  event.preventDefault()
  const chosenDate = new Date(desiredDateInput.value)
  if (desiredDateInput.value && chosenDate < getMinDate()) {
    desiredDateInput.setCustomValidity('too-early')
  } else {
    desiredDateInput.setCustomValidity('')
  }

  const chosenColor = document.querySelector('input[name="color"]:checked')
  colorError.hidden = chosenColor !== null

  form.classList.add('was-validated')
  if (!form.checkValidity() || chosenColor === null) {
    const firstError = form.querySelector(':invalid')
    if (firstError) firstError.focus()
    return
  }

  const request = {
    title: document.getElementById('title').value.trim(),
    occasion: document.getElementById('occasion').value,
    material_preference: document.getElementById('material').value,
    color_preference: chosenColor.value,
    budget: Number(budgetInput.value),
    quantity: Number(document.getElementById('quantity').value),
    description: document.getElementById('description').value.trim(),
    reference_image_url: imageData,
    desired_date: desiredDateInput.value,
  }

  let saved = saveDesignRequest(request)
  if (!saved && request.reference_image_url) {
    request.reference_image_url = ''
    saved = saveDesignRequest(request)
  }

  if (!saved) {
    alert('Không lưu được yêu cầu, vui lòng thử lại.')
    return
  }

  document.getElementById('submitBtn').disabled = true
  FW.toast('Đã đăng yêu cầu lên diễn đàn!')
  setTimeout(function () {
    window.location.href = 'my-requests.html'
  }, 1500)
})
