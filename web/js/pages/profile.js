document.addEventListener("DOMContentLoaded", async () => {
    try {
        const user = await FW_API.me();
        document.getElementById("profileName").textContent = user.full_name || "Chưa cập nhật";
        document.getElementById("profileEmail").textContent = user.email || "Chưa cập nhật";
        document.getElementById("profilePhone").textContent = user.phone || "Chưa cập nhật";
        const profileAvatar = document.getElementById("profileAvatar");

        if (profileAvatar) {
            profileAvatar.src = user.avatar_url || "../images/favicon.svg";
        }
    } catch (error) {
        if (error.status === 401) {
            location.href = FW.url("account/login.html");
            return;
        }
        console.error("Không thể tải hồ sơ:", error);
        document.getElementById("profileName").textContent = "Không thể tải thông tin";
    }
});
