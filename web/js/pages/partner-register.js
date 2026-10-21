(function () {
    'use strict'

    const form = document.getElementById('partnerRegisterForm')
    if (!form) return

    form.addEventListener('submit', async (event) => {
        event.preventDefault()
        if (!form.reportValidity()) return

        const submitButton = form.querySelector('[type="submit"]')
        const profile = document.getElementById('profile').value.trim()
        const details = [
            document.getElementById('shopName').value.trim() && `Tên cửa hàng: ${document.getElementById('shopName').value.trim()}`,
            document.getElementById('city').value && `Thành phố: ${document.getElementById('city').value}`,
            document.getElementById('address').value.trim() && `Địa chỉ: ${document.getElementById('address').value.trim()}`,
            `Giới thiệu: ${profile}`,
        ].filter(Boolean)

        submitButton.disabled = true
        try {
            await FW_API.applyPartner({
                bio: details.join('\n'),
                portfolio_url: document.getElementById('portfolioUrl').value.trim(),
            })
            FW.toast('Hồ sơ đã được gửi. Vui lòng chờ Quản lý xét duyệt.')
            submitButton.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã gửi hồ sơ'
        } catch (error) {
            FW.toast(error.message)
            submitButton.disabled = false
        }
    })
})()