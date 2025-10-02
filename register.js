import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const errorMsg = document.getElementById("errorMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // 1. Crear usuario en auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error en signUp:", error.message);
      errorMsg.textContent = error.message;
      return;
    }

    const user = data.user;
    if (!user) {
      errorMsg.textContent = "No se pudo registrar el usuario.";
      return;
    }

    // 2. Insertar perfil en la tabla usuarios
    const { error: insertError } = await supabase.from("usuarios").insert({
      id: user.id,          // 👈 usar mismo ID que auth.users
      email: user.email,
      name: null,
      avatar_url: null,
      bio: null
    });

    if (insertError) {
      console.error("Error insertando en usuarios:", insertError.message);
      errorMsg.textContent = "Error creando el perfil: " + insertError.message;
      return;
    }

    // 3. Redirigir al perfil
    window.location.href = "profile.html";
  });
});
