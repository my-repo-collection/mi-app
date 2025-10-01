// login.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const msgBox = document.getElementById("msgBox");

  function showMessage(msg, type = "info") {
    msgBox.textContent = msg;
    msgBox.style.color = type === "error" ? "red" : (type === "success" ? "green" : "#333");
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      if (!email || !password) return showMessage("Completa los campos", "error");

      loginBtn.disabled = true;
      showMessage("Iniciando sesión...");

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error("No se pudo iniciar sesión");

        showMessage("Login correcto. Redirigiendo...", "success");
        setTimeout(() => window.location.href = "profile.html", 800);
      } catch (err) {
        console.error(err);
        showMessage(err.message, "error");
      } finally {
        loginBtn.disabled = false;
      }
    });
  }
});
