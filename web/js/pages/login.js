const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");

togglePassword.addEventListener("click", () => {
    const isPassword = password.type === "password";
    password.type = isPassword ? "text" : "password";
    togglePassword.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
});
const DEMO_ACCOUNTS = {
    'admin@nhanh.vn': { id: 1, adminRole: 'admin', page: 'admin/statistics.html' },
    'manager@nhanh.vn': { id: 2, adminRole: 'manager', page: 'admin/statistics.html' },
    'thaodien.atelier@gmail.com': { id: 7, page: 'partner/dashboard.html' },
    'nangbanmai.hoa@gmail.com': { id: 8, page: 'partner/dashboard.html' },
};

function goAfterLogin(email) {
    const account = DEMO_ACCOUNTS[email.trim().toLowerCase()] || { id: 3, page: 'account/dashboard.html' };
    try {
        localStorage.setItem("fw_user_id", account.id);
        if (account.adminRole) localStorage.setItem("fw_admin_role", account.adminRole);
    } catch (e) {}
    location.href = FW.url(account.page);
}

document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    goAfterLogin(document.getElementById("email").value);
});

document.getElementById("googleLogin").addEventListener("click", () => {
    goAfterLogin("lanphuong@gmail.com");
});
