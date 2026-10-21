const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

const registerForm = document.getElementById('registerForm');
const otpSection = document.getElementById('otpSection');
const verifyOtpForm = document.getElementById('verifyOtpForm');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');

const otpInput = document.getElementById('otp');
const otpMessage = document.getElementById('otpMessage');

const resendButton = document.getElementById('resendOtpButton');
const verifyButton = document.getElementById('verifyOtpButton');

let countdownTimer = null;
let resendAvailableAt = 0;
let pendingEmail = '';

togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
});
toggleConfirmPassword.addEventListener("click", () => {
    const isPassword = confirmPasswordInput.type === "password";
    confirmPasswordInput.type = isPassword ? "text" : "password";
    toggleConfirmPassword.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
});

function showOtpMessage(message) {
    otpMessage.textContent = message;
}

function startResendCountdown(seconds = 60) {
    clearInterval(countdownTimer);
    resendAvailableAt = Date.now() + seconds * 1000;
    resendButton.disabled = true;

    function updateCountdown() {
        const remaining = Math.max(
            0,
            Math.ceil((resendAvailableAt - Date.now()) / 1000)
        );
        if (remaining <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            resendButton.disabled = false;
            resendButton.textContent = 'Gửi lại mã OTP';
            return;
        }
        resendButton.textContent = `Gửi lại mã (${remaining}s)`;
    }

    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 250);
}


registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    if (!username || username.length > 150) {
        alert('Họ tên không được để trống và tối đa 150 ký tự.');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Email không đúng định dạng.');
        return;
    }
    if (phone && !/^0\d{9}$/.test(phone)) {
        alert('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.');
        return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        alert('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.');
        return;
    }
    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp.');
        confirmPasswordInput.focus();
        return;
    }
    if (!window.FW_API || typeof FW_API.register !== 'function') {
        alert('Chưa kết nối được API đăng ký.');
        return;
    }
    const submitButton = registerForm.querySelector('button[type="submit"]');
    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Đang gửi OTP...';
        await FW_API.register({username, email, phone: phone || null, password});
        pendingEmail = email;
        registerForm.hidden = true;
        document.getElementById("registerText").hidden = true;
        otpSection.hidden = false;
        otpInput.value = '';
        showOtpMessage(`Mã OTP đã được gửi đến ${email}.`);
        startResendCountdown(60);
    } catch (error) {
        alert(error.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Đăng ký';
    }
});

verifyOtpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const otp = otpInput.value.trim();
    if (!/^\d{6}$/.test(otp)) {
        showOtpMessage('Vui lòng nhập đúng 6 chữ số.');
        return;
    }
    try {
        verifyButton.disabled = true;
        verifyButton.textContent = 'Đang xác minh...';
        await FW_API.verifyRegisterOtp({otp});
        clearInterval(countdownTimer);
        alert('Đăng ký tài khoản thành công!');
        window.location.href = 'login.html';

    } catch (error) {
        showOtpMessage(error.message || 'OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
        verifyButton.disabled = false;
        verifyButton.textContent = 'Xác nhận OTP';
    }
});


resendButton.addEventListener('click', async () => {
    if (Date.now() < resendAvailableAt) return;
    try {
        resendButton.disabled = true;
        showOtpMessage('Đang gửi lại OTP...');
        await FW_API.resendRegisterOtp();
        otpInput.value = '';
        showOtpMessage('Mã OTP mới đã được gửi.');
        startResendCountdown(60);
    } catch (error) {
        showOtpMessage(error.message || 'Không thể gửi lại OTP. Vui lòng thử sau.');
        resendButton.disabled = true;
    }
});

document.getElementById('googleRegister')?.addEventListener('click', () => {
    alert('Chức năng đăng ký Google chưa được tích hợp.');
});
