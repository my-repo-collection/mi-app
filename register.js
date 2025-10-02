import { supabase } from "./config.js";

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
    if (pass1.value !== pass2.value) {
      msg.textContent = "⚠️ Las contraseñas no coinciden";
      btn.disabled = false; btn.textContent = "Registrarme";
      return;
    }

    const { error } = await supabase.auth.signUp({
      email, password: pass1.value
    }, { emailRedirectTo: window.location.origin + "/profile.html" });

    if (error) {
      msg.textContent = "❌ " + error.message;
    } else {
      msg.textContent = "✅ Registro exitoso. Revisa tu email para confirmar.";
    }
    btn.disabled = false; btn.textContent = "Registrarme";
  });
});
