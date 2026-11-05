const profileForm = document.getElementById("profileForm");
const editButton = document.getElementById("editProfileButton");
const cancelButton = document.getElementById("cancelProfileButton");
const actions = document.getElementById("profileActions");
const saveButton = document.getElementById("saveProfileButton");
const changeAvatarButton = document.getElementById("changeAvatarButton");
const showPasswordButton = document.getElementById("showPasswordButton");

const nameInput = document.getElementById("profileNameInput");
const phoneInput = document.getElementById("profilePhoneInput");
const avatarInput = document.getElementById("avatarInput");

const nameText = document.getElementById("profileName");
const phoneText = document.getElementById("profilePhone");
const emailText = document.getElementById("profileEmail");
const profileAvatar = document.getElementById("profileAvatar");
const message = document.getElementById("profileMessage");

let newAvatarUrl = null;
let originalProfile = null;
let previewAvatarUrl = null;

function displayProfile(user) {
    nameText.textContent = user.full_name || "Chưa cập nhật";
    emailText.textContent = user.email || "Chưa cập nhật";
    phoneText.textContent = user.phone || "Chưa cập nhật";

    profileAvatar.src = user.avatar_url || "../images/favicon.svg";

    nameInput.value = user.full_name || "";
    phoneInput.value = user.phone || "";
}

async function loadProfile() {
    const user = await FW_API.getProfile();
    originalProfile = user;
    displayProfile(user);
    if (user.auth_provider === "GOOGLE") {
        showPasswordButton.style.display = "none"
    }
}

function setEditMode(enabled) {
    nameInput.hidden = !enabled;
    nameInput.disabled = !enabled;
    nameText.hidden = enabled;

    phoneInput.hidden = !enabled;
    phoneInput.disabled = !enabled;
    phoneText.hidden = enabled;

    changeAvatarButton.hidden = !enabled;
    avatarInput.disabled = !enabled;

    actions.hidden = !enabled;
    editButton.hidden = enabled;
}

function clearPreviewAvatar() {
    if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
        previewAvatarUrl = null;
    }
}

editButton.addEventListener("click", () => {
    if (!originalProfile) return;
    message.textContent = "";
    newAvatarUrl = null;
    displayProfile(originalProfile);
    avatarInput.value = "";
    clearPreviewAvatar();
    setEditMode(true);
});

cancelButton.addEventListener("click", () => {
    if (!originalProfile) return;
    newAvatarUrl = null;
    avatarInput.value = "";
    clearPreviewAvatar();
    displayProfile(originalProfile);
    message.textContent = "";
    setEditMode(false);
});

changeAvatarButton.addEventListener("click", () => {
    avatarInput.click();
});

avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
        message.textContent = "Chỉ nhận ảnh JPG hoặc PNG.";
        avatarInput.value = "";
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        message.textContent = "Ảnh không được vượt quá 5 MB.";
        avatarInput.value = "";
        return;
    }
    message.textContent = "Đang tải ảnh lên...";
    try {
        const result = await FW_API.uploadImage(file);
        newAvatarUrl = result.url;
        clearPreviewAvatar();
        previewAvatarUrl = URL.createObjectURL(file);
        profileAvatar.src = previewAvatarUrl;
        message.textContent = "";
    } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        message.textContent = error.message || "Không thể tải ảnh lên.";
        avatarInput.value = "";
    }
});

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const username = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    if (!username) {
        message.textContent = "Vui lòng nhập họ và tên.";
        return;
    }
    if (username.length > 150) {
        message.textContent = "Họ và tên tối đa 150 ký tự.";
        return;
    }
    if (!/^0[0-9]{9}$/.test(phone)) {
        message.textContent = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
        return;
    }
    try {
        saveButton.disabled = true;
        cancelButton.disabled = true;
        editButton.disabled = true;
        changeAvatarButton.disabled = true;
        message.textContent = "Đang cập nhật...";
        await FW_API.updateProfile({
            username: username,
            phone: phone,
            avatar: newAvatarUrl
        });
        await loadProfile();
        newAvatarUrl = null;
        avatarInput.value = "";
        clearPreviewAvatar();
        setEditMode(false);
        message.textContent = "Cập nhật thông tin thành công.";
    } catch (error) {
        message.textContent = error.message || "Không thể cập nhật thông tin.";
        if (error.status === 401) {
            location.href = FW.url("account/login.html");
        }
    } finally {
        saveButton.disabled = false;
        cancelButton.disabled = false;
        editButton.disabled = false;
        changeAvatarButton.disabled = false;
    }
});

setEditMode(false);
loadProfile().catch(error => {
    if (error.status === 401) {
        location.href = FW.url("account/login.html");
        return;
    }
    console.error("Không thể tải hồ sơ:", error);
    nameText.textContent = "Không thể tải thông tin";
});

// ============================ Change password ============================
const changePasswordForm = document.getElementById("changePasswordForm");
const passwordMessage = document.getElementById("passwordMessage");
const changePasswordButton = document.getElementById("changePasswordButton");

const profileCard = document.querySelector(".profile-card");
const passwordCard = document.querySelector(".password-card");

const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

const cancelPasswordButton = document.getElementById("cancelPasswordButton");

showPasswordButton.addEventListener("click", () => {
    profileCard.style.display = "none";
    passwordCard.style.display = "block";
});

cancelPasswordButton.addEventListener("click", () => {
    passwordCard.style.display = "none";
    profileCard.style.display = "block";
    changePasswordForm.reset();
    const message = document.getElementById("passwordMessage");
    message.textContent = "";
    message.className = "password-message";
});

document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        const icon = button.querySelector("i");

        const isPassword = input.type === "password";

        input.type = isPassword ? "text" : "password";

        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);
    });
});

function showPasswordMessage(text, type) {
    passwordMessage.textContent = text;
    passwordMessage.className = `mt-3 ${type}`;
}

changePasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    passwordMessage.textContent = "";
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    if (!currentPassword) {
        showPasswordMessage(
            "Vui lòng nhập mật khẩu hiện tại.",
            "text-danger"
        );
        return;
    }
    if (newPassword.length < 8) {
        showPasswordMessage("Mật khẩu mới phải có ít nhất 8 ký tự.", "text-danger");
        return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        showPasswordMessage("Mật khẩu mới phải bao gồm cả chữ cái và chữ số.", "text-danger");
        return;
    }
    if (newPassword === currentPassword) {
        showPasswordMessage("Mật khẩu mới phải khác mật khẩu hiện tại.", "text-danger");
        return;
    }
    if (newPassword !== confirmPassword) {
        showPasswordMessage("Mật khẩu xác nhận không khớp.", "text-danger");
        return;
    }

    try {
        changePasswordButton.disabled = true;
        cancelPasswordButton.disabled = true;
        changePasswordButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
        passwordMessage.textContent = "Đang cập nhật mật khẩu...";
        await FW_API.changePassword({currentpass: currentPassword, newpass: newPassword});
        showPasswordMessage("Đổi mật khẩu thành công.", "text-success");
        changePasswordForm.reset();
    } catch (error) {
        showPasswordMessage(error.message || "Không thể đổi mật khẩu.", "text-danger");
        if (error.status === 401) {
            location.href = FW.url("account/login.html");
        }
    } finally {
        changePasswordButton.disabled = false;
        cancelPasswordButton.disabled = false;
        changePasswordButton.innerHTML = '<i class="fa-solid fa-key"></i> Đổi mật khẩu';
    }
});