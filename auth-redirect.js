// auth-redirect.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const hash = window.location.hash.substring(1);
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error("❌ Error al establecer sesión:", error.message);
    } else {
      console.log("✅ Sesión restaurada desde URL");
      // Redirigir al perfil
      window.location.href = "profile.html";
    }
  }
});
