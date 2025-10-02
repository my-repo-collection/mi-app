import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");
  const togglePass = document.getElementById("togglePassLogin");
  const passInput = document.getElementById("password");

  togglePass.addEventListener("click", () => {
    passInput.type = passInput.type === "password" ? "text" : "password";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";
    const btn = document.getElementById("loginBtn");
    btn.disabled = true; btn.textContent = "⏳ Entrando...";

    const email = document.getElementById("email").value.trim();
    const password = passInput.value.trim();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      errorMsg.textContent = "❌ " + error.message;
      btn.disabled = false; btn.textContent = "Entrar";
      return;
    }

    window.location.href = "profile.html";
  });
});
