// register.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const registerBtn = document.getElementById("registerBtn");
  const msgBox = document.getElementById("msgBox");

  function showMessage(msg, type = "info") {
    msgBox.textContent = msg;
    msgBox.style.color =
      type === "error" ? "red" :
      type === "success" ? "green" : "#333";
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;

      if (!email || !password) {
        return showMessage("Completa todos los campos", "error");
      }

      // feedback inmediato en botón
      registerBtn.disabled = true;
      registerBtn.classList.add("btn-loading");
      registerBtn.textContent = "Creando cuenta...";
      showMessage("Registrando usuario...");

      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error("No se pudo registrar el usuario");

        // éxito → feedback + redirigir a perfil
        registerBtn.textContent = "¡Listo!";
        showMessage("Cuenta creada. Redirigiendo al perfil...", "success");

        setTimeout(() => {
          window.location.href = "profile.html";
        }, 1000);
      } catch (err) {
        console.error(err);
        showMessage(err.message, "error");
        registerBtn.textContent = "Registrarme";
      } finally {
        registerBtn.disabled = false;
        registerBtn.classList.remove("btn-loading");
      }
    });
  }
});
