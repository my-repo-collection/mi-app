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

    const user = data.user;
    if (!user) {
      errorMsg.textContent = "No se pudo iniciar sesión.";
      return;
    }

    // 2. Verificar si ya existe perfil en 'usuarios'
    const { data: existingProfile, error: profileError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", user.id)
      .single();

    // Si no hay perfil, crearlo automáticamente
    if (!existingProfile) {
      const { error: insertError } = await supabase.from("usuarios").insert({
        id: user.id,
        email: user.email,
        name: null,
        avatar_url: null,
        bio: null,
      });

      if (insertError) {
        console.error("Error creando perfil en login:", insertError.message);
        // No bloquea acceso, pero lo mostramos en pantalla
        errorMsg.textContent = "Accediste pero no se pudo crear el perfil automáticamente.";
      }
    }

    // 3. Redirigir al perfil
    window.location.href = "profile.html";
  });
});
