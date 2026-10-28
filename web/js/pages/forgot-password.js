const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const rePassForm = document.getElementById("rePassForm");

const loginContainer = document.querySelector(".login-container");
const rePassSection = document.getElementById("rePassSection");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const otpInput = document.getElementById("otp");

const submitButton = document.getElementById("submitButton");
const changePassButton = document.getElementById("changePassButton");
const resendOtpButton = document.getElementById("resendOtpButton");

const loginError = document.getElementById("loginError");
const rePassMessage = document.getElementById("rePassMessage");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

let pendingEmail = "";
let countdownTimer = null;
let resendAvailableAt = 0;

function showLoginMessage(message) {
    loginError.textContent = message;
    loginError.style.display = "block";
}

function showRePassMessage(message, isError = false) {
    rePassMessage.textContent = message;
    rePassMessage.style.color = isError ? "var(--fw-rose)" : "var(--fw-forest)";
}

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

function startResendCountdown(seconds = 60) {
    clearInterval(countdownTimer);
    resendAvailableAt = Date.now() + seconds * 1000;
    resendOtpButton.disabled = true;
    function updateCountdown() {
        const remaining = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
        if (remaining <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            resendOtpButton.disabled = false;
            resendOtpButton.textContent = "Gửi lại mã OTP";
            return;
        }
        resendOtpButton.textContent = `Gửi lại mã (${remaining}s)`;
    }
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 250);
}

forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showLoginMessage("Email không đúng định dạng.");
        emailInput.focus();
        return;
    }
    if (!window.FW_API || typeof FW_API.forgotPassword !== "function") {
        showLoginMessage("Chưa kết nối được API quên mật khẩu.");
        return;
    }
    try {
        submitButton.disabled = true;
        submitButton.textContent = "Đang xử lý...";
        showLoginMessage("");

        await FW_API.forgotPassword({ email });

        pendingEmail = email;
        loginContainer.hidden = true;
        rePassSection.hidden = false;

        otpInput.value = "";
        passwordInput.value = "";
        confirmPasswordInput.value = "";

        showRePassMessage("Nếu email có tài khoản, mã xác nhận đã được gửi.");
        startResendCountdown(60);
        otpInput.focus();

    } catch (error) {

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Đặt lại mật khẩu";
    }
});

rePassForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const otp = otpInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!/^\d{6}$/.test(otp)) {
        showRePassMessage("Mã OTP phải gồm đúng 6 chữ số.", true);
        otpInput.focus();
        return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        showRePassMessage("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.", true);
        passwordInput.focus();
        return;
    }
    if (password !== confirmPassword) {
        showRePassMessage("Mật khẩu xác nhận không khớp.", true);
        confirmPasswordInput.focus();
        return;
    }
    if (!window.FW_API || typeof FW_API.resetPassword !== "function") {
        showRePassMessage("Chưa kết nối được API đổi mật khẩu.", true);
        return;
    }
    try {
        changePassButton.disabled = true;
        changePassButton.textContent = "Đang xác minh...";
        showRePassMessage("");
        await FW_API.resetPassword({email: pendingEmail, otp, password});

        clearInterval(countdownTimer);
        countdownTimer = null;

        alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        window.location.href = "login.html";
    } catch (error) {
        showRePassMessage(error.message || "OTP không hợp lệ, đã hết hạn hoặc không thể đổi mật khẩu.", true);
    } finally {
        changePassButton.disabled = false;
        changePassButton.textContent = "Đổi mật khẩu";
    }
});

resendOtpButton.addEventListener('click', async () => {
    if (Date.now() < resendAvailableAt) return;
    if (!pendingEmail) {
        showRePassMessage("Vui lòng nhập email trước.", true);
        return;
    }
    if (!window.FW_API || typeof FW_API.forgotPassword !== "function") {
        showRePassMessage("Chưa kết nối được API gửi OTP.", true);
        return;
    }
    try {
        resendOtpButton.disabled = true;
        showRePassMessage('Đang gửi lại OTP...');
        await FW_API.forgotPassword({ email: pendingEmail });
        otpInput.value = '';
        showRePassMessage("Nếu email có tài khoản, mã xác nhận đã được gửi.");
        startResendCountdown(60);
    } catch (error) {
        showRePassMessage(error.message || 'Không thể gửi lại OTP. Vui lòng thử sau.');
        resendOtpButton.disabled = true;
    }
});