// register.js
import { supabase } from "./config.js";
import { showToast, validateEmail } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const msg = document.getElementById("regMsg");
  const pass1 = document.getElementById("regPass");
  const pass2 = document.getElementById("regPass2");

  document.getElementById("toggleRegPass").addEventListener("click", () => {
    pass1.type = pass1.type === "password" ? "text" : "password";
  });
  document.getElementById("toggleRegPass2").addEventListener("click", () => {
    pass2.type = pass2.type === "password" ? "text" : "password";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    const btn = document.getElementById("registerBtn");
    btn.disabled = true; btn.textContent = "⏳ Creando...";

    const email = document.getElementById("regEmail").value.trim();
    if (!validateEmail(email)) {
      msg.textContent = "✖ Ingresa un email válido";
      btn.disabled = false; btn.textContent = "Registrarme";
      return;
    }

    if (pass1.value !== pass2.value) {
      msg.textContent = "✖ Las contraseñas no coinciden";
      btn.disabled = false; btn.textContent = "Registrarme";
      return;
    }

    if (pass1.value.length < 6) {
      msg.textContent = "✖ La contraseña debe tener al menos 6 caracteres";
      btn.disabled = false; btn.textContent = "Registrarme";
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass1.value
      }, {
        emailRedirectTo: window.location.origin + "/profile.html"
      });

      if (error) throw error;
      msg.textContent = "✓ Registro exitoso. Revisa tu email para confirmar.";
      showToast("Registro creado. Confirma tu email.", "success");
    } catch (err) {
      console.error(err);
      msg.textContent = "✖ " + (err?.message || "Error al registrar.");
      showToast(err?.message || "Error al registrar", "error");
    } finally {
      btn.disabled = false; btn.textContent = "Registrarme";
    }
  });
});
