// login.js
import { supabase } from "./config.js";
import { showToast, validateEmail } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");
  const togglePass = document.getElementById("togglePassLogin");
  const passInput = document.getElementById("password");

  togglePass?.addEventListener("click", () => {
    passInput.type = passInput.type === "password" ? "text" : "password";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";
    const btn = document.getElementById("loginBtn");
    btn.disabled = true; btn.textContent = "⏳ Entrando...";

    const email = document.getElementById("email").value.trim();
    const password = passInput.value.trim();

    if (!validateEmail(email)) {
      errorMsg.textContent = "✖ Ingresa un email válido.";
      btn.disabled = false; btn.textContent = "Entrar";
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // success
      showToast("Login correcto", "success", 1500);
      window.location.href = "profile.html";
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Error al iniciar sesión";
      errorMsg.textContent = "✖ " + msg;
      showToast(msg, "error");
      btn.disabled = false; btn.textContent = "Entrar";
    }
  });
});
