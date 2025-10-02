// login.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // 1. Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error en login:", error.message);
      errorMsg.textContent = error.message;
      return;
    }

    const { user } = data;
    console.log("🔑 Sesión iniciada:", user);

    // 2. Buscar perfil en tabla usuarios
    const { data: profile, error: profileError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("⚠️ Error cargando perfil:", profileError.message);
      errorMsg.textContent = "Login correcto, pero no se pudo cargar perfil.";
      return;
    }

    console.log("👤 Perfil cargado:", profile);

    // 3. Redirigir al perfil
    window.location.href = "profile.html";
  });
});
