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

      registerBtn.disabled = true;
      registerBtn.classList.add("btn-loading");
      registerBtn.textContent = "Creando cuenta...";
      showMessage("Registrando usuario...");

      try {
        // Crear en Auth
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data?.user) throw new Error("No se pudo registrar el usuario");

        // Crear en tabla usuarios
        const { error: insertError } = await supabase.from("usuarios").insert({
          id: data.user.id,
          name: email.split("@")[0], // por defecto
          bio: "",
          avatar_url: ""
        });
        if (insertError) throw insertError;

        registerBtn.textContent = "¡Listo!";
        showMessage("Cuenta creada. Redirigiendo al perfil...", "success");

        setTimeout(() => {
          window.location.href = `profile.html?user=${data.user.id}`;
        }, 1200);

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
