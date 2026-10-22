const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const googleLogin = document.getElementById("googleLogin");

togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
});

// const DEMO_ACCOUNTS = {
//     'admin@nhanh.vn': { id: 1, adminRole: 'admin', page: 'admin/statistics.html' },
//     'manager@nhanh.vn': { id: 2, adminRole: 'manager', page: 'admin/statistics.html' },
//     'thaodien.atelier@gmail.com': { id: 7, page: 'partner/dashboard.html' },
//     'nangbanmai.hoa@gmail.com': { id: 8, page: 'partner/dashboard.html' },
// };
//
// function goAfterLogin(email) {
//     const account = DEMO_ACCOUNTS[email.trim().toLowerCase()] || { id: 3, page: 'account/dashboard.html' };
//     try {
//         localStorage.setItem("fw_user_id", account.id);
//         if (account.adminRole) localStorage.setItem("fw_admin_role", account.adminRole);
//     } catch (e) {}
//     location.href = FW.url(account.page);
// }
//
// document.getElementById("loginForm").addEventListener("submit", (event) => {
//     event.preventDefault();
//     goAfterLogin(document.getElementById("email").value);
// });
//
// document.getElementById("googleLogin").addEventListener("click", () => {
//     goAfterLogin("lanphuong@gmail.com");
// });


let loginError = document.getElementById("loginError");
if (!loginError) {
    loginError = document.createElement("p");
    loginError.id = "loginError";
    loginError.className = "login-error";
    loginError.setAttribute("role", "alert");
    loginForm.appendChild(loginError);
}
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.textContent = "";
    const submitButton = loginForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }
    try {
        const user = await FW_API.login({
            email: emailInput.value.trim(),
            password: passwordInput.value
        });

        switch (user.role) {
            case "CUSTOMER":
                location.href = FW.url("account/dashboard.html");
                break;
            case "PARTNER":
                location.href = FW.url("partner/dashboard.html");
                break;
            case "ADMIN":
            case "MANAGER":
                location.href = FW.url("admin/statistics.html");
                break;
            default:
                loginError.textContent = "Vai trò tài khoản không hợp lệ.";
        }
    } catch (error) {
        loginError.textContent = error.message || 'Không thể đăng nhập. Vui lòng thử lại.';
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});

googleLogin?.addEventListener("click", () => {
    loginError.textContent = "Đăng nhập bằng Google hiện chưa được triển khai.";
});