(function () {
  'use strict'

  document.getElementById('partnerRegisterForm')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const form = event.currentTarget
    form.reset()
    FW.toast('Hồ sơ đăng ký đã được gửi thành công. Chúng tôi sẽ xét duyệt trong 24 giờ.')
  })
})()