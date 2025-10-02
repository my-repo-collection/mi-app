// auth-redirect.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Some providers return tokens in the hash after redirect
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
      alert("Hubo un error confirmando tu cuenta: " + error.message);
    } else {
      // Redirigir al perfil
      window.location.href = "profile.html";
    }
  }
});
