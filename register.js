// register.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const msgBox = document.getElementById("msgBox");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msgBox.textContent = "";

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const confirmPassword = document.getElementById("registerConfirm").value.trim();

    if (password !== confirmPassword) {
      msgBox.textContent = "❌ Las contraseñas no coinciden.";
      msgBox.style.color = "red";
      return;
    }

    // 1. Crear usuario en auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("❌ Error registrando:", error.message);
      msgBox.textContent = "Error: " + error.message;
      msgBox.style.color = "red";
      return;
    }

    const user = data.user;
    console.log("🔑 Nuevo usuario:", user);

    // 2. Crear perfil en tabla usuarios
    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id: user.id,       // 👈 tiene que coincidir con auth.uid()
        email: user.email,
        name: "",
        avatar_url: "",
        bio: ""
      }
    ]);

    if (insertError) {
      console.error("⚠️ Error insertando perfil:", insertError.message);
      msgBox.textContent = "Cuenta creada, pero error al guardar perfil.";
      msgBox.style.color = "orange";
    } else {
      msgBox.textContent = "✅ Cuenta creada. Revisa tu correo para confirmar.";
      msgBox.style.color = "green";
    }
  });
});
