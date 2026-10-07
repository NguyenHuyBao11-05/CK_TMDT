const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPassword = document.getElementById("confirmPassword");

togglePassword.addEventListener("click", () => {
    const isPassword = password.type === "password";
    password.type = isPassword ? "text" : "password";
    togglePassword.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
});
toggleConfirmPassword.addEventListener("click", () => {
    const isPassword = confirmPassword.type === "password";
    confirmPassword.type = confirmPassword.type === "password" ? "text" : "password";
    toggleConfirmPassword.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
});