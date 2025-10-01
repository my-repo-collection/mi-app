// register.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const registerBtn = document.getElementById("registerBtn");
  const msgBox = document.getElementById("msgBox");

  function showMessage(msg, type = "info") {
    msgBox.textContent = msg;
    msgBox.style.color = type === "error" ? "red" : (type === "success" ? "green" : "#333");
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;

      if (!/\S+@\S+\.\S+/.test(email)) return showMessage("Email inválido", "error");
      if (password.length < 6) return showMessage("La contraseña debe tener al menos 6 caracteres", "error");

      registerBtn.disabled = true;
      showMessage("Registrando... Revisa tu correo.", "info");

      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        showMessage("Registro completado. Revisa tu correo para confirmar.", "success");
      } catch (err) {
        console.error(err);
        showMessage(err.message, "error");
      } finally {
        registerBtn.disabled = false;
      }
    });
  }
});
