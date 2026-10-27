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

let loginError = document.getElementById("loginError");

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

        try {
            localStorage.setItem("fw_user_id", user.id);
            if (user.role === "ADMIN" || user.role === "MANAGER") localStorage.setItem("fw_admin_role", user.role.toLowerCase());
        } catch (e) {}

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
        loginError.textContent = error.message;
        loginError.style.display = "block";
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});


const GOOGLE_CLIENT_ID = "303315410038-nb00bbjo9fqh2g28oklb9bsrhag72ds0.apps.googleusercontent.com";
googleLogin.addEventListener("click", () => {
    if (!window.google?.accounts?.id) {
        loginError.textContent = "Google Identity Services chưa tải xong. Vui lòng thử lại.";
        loginError.style.display = "block";
        return;
    }
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
            try {
                loginError.textContent = "";
                loginError.style.display = "none";

                const token = response.credential;
                const user = await FW_API.loginGoogle({token});

                localStorage.setItem("fw_user_id", user.id);
                switch (user.role) {
                    case "CUSTOMER":
                        location.href = FW.url("account/dashboard.html");
                        break;
                    case "PARTNER":
                        location.href = FW.url("partner/dashboard.html");
                        break;
                    case "ADMIN":
                    case "MANAGER":
                        localStorage.setItem("fw_admin_role", user.role.toLowerCase());
                        location.href = FW.url("admin/statistics.html");
                        break;
                    default:
                        loginError.textContent = "Vai trò tài khoản không hợp lệ.";
                        loginError.style.display = "block";
                }
            } catch (error) {
                loginError.textContent = error.message;
                loginError.style.display = "block";
            }
        }
    });
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
            loginError.textContent = "Không thể mở đăng nhập Google. Vui lòng thử lại.";
            loginError.style.display = "block";
        }
    });
});