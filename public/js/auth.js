function togglePassword(button) {
  const input = document.getElementById("password");
  const icon = button.querySelector("i");

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";

  icon.classList.toggle("bi-eye");
  icon.classList.toggle("bi-eye-slash");
}