(function () {
    "use strict";
    let currentUser = null;
    const ROLE_LABELS = {
        CUSTOMER: "Khách hàng",
        PARTNER: "Đối tác",
        ADMIN: "Quản trị viên",
        MANAGER: "Quản lý"
    };
    function updateHeader(user) {
        const loginLink = document.getElementById("headerLoginLink");
        const registerLink = document.getElementById("headerRegisterLink");
        const avatarHeader = document.getElementById("a-header-avatar");
        if (user) {
            if (loginLink) loginLink.style.display = "none";
            if (registerLink) registerLink.style.display = "none";
            if (avatarHeader) avatarHeader.style.display = "block";
        } else {
            if (loginLink) loginLink.style.display = "";
            if (registerLink) registerLink.style.display = "";
            if (avatarHeader) avatarHeader.style.display = "none";
        }
    }
    function updateSidebar(user) {
        const username = document.getElementById("sidebarUsername");
        const userRank = document.getElementById("sidebarUserRank");
        const userType = document.getElementById("sidebarUserType");

        const displayName = user.full_name || user.email || "Tài khoản";
        const roleLabel = ROLE_LABELS[user.role] || "Tài khoản";

        if (username && username.textContent !== displayName) {
            username.textContent = displayName;
        }
        if (userRank && userRank.textContent !== roleLabel) {
            userRank.textContent = roleLabel;
        }
        if (userType && userType.textContent !== roleLabel) {
            userType.textContent = roleLabel;
        }
    }
    function updateAccountUI() {
        updateHeader(currentUser);
        if (currentUser) {
            updateSidebar(currentUser);
            updateAvatar(currentUser);
        }
    }
    function updateAvatar(user) {
        const avatarUrl = user.avatar_url || "../images/favicon.svg";
        const headerAvatar = document.getElementById("headerAvatar");
        const sidebarAvatar = document.getElementById("sidebarAvatar");

        [headerAvatar, sidebarAvatar].forEach((img) => {
            if (!img) return;
            if (img.getAttribute("src") !== avatarUrl) {
                img.src = avatarUrl;
            }
            img.onerror = function () {
                img.onerror = null;
                img.src = "../images/favicon.svg";
            };
        });
    }
    async function loadCurrentUser() {
        try {
            currentUser = await FW_API.me();
            updateAccountUI();
        } catch (error) {
            currentUser = null;
            if (error.status === 401 && document.body.dataset.requiresAuth === "true") {
                location.href = FW.url("account/login.html");
            }
        }
    }
    const observer = new MutationObserver(() => {
        if (currentUser) {
            updateAccountUI();
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadCurrentUser);
    }
})();

document.addEventListener("click", async function (event) {
    const logoutButton = event.target.closest("#logoutButton");
    if (!logoutButton) return;
    event.preventDefault();
    if (logoutButton.dataset.loading === "true") return;
    logoutButton.dataset.loading = "true";
    try {
        await FW_API.logout();
        location.href = FW.url("account/login.html");
    } catch (error) {
        console.error("Đăng xuất thất bại:", error);
        alert("Không thể đăng xuất. Vui lòng thử lại.");
        delete logoutButton.dataset.loading;
    }
});