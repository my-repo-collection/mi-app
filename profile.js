// profile.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Obtener perfil desde la tabla usuarios
  const { data: profile, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("❌ Error cargando perfil:", error.message);
    document.body.innerHTML = "<p>Error cargando perfil.</p>";
    return;
  }

  // Renderizar en la página
  document.getElementById("profileEmail").textContent = profile.email;
  document.getElementById("profileName").textContent = profile.name || "Sin nombre";
  document.getElementById("profileBio").textContent = profile.bio || "Sin biografía";
  if (profile.avatar_url) {
    document.getElementById("profileAvatar").src = profile.avatar_url;
  }
});
