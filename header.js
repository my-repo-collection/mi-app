// header.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loginNav = document.getElementById("loginNav");
  const profileNav = document.getElementById("profileNav");
  const logoutBtn = document.getElementById("logoutBtn");

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("❌ Error al obtener sesión:", error.message);
  }

  if (user) {
    // Usuario logueado → ocultar "Login", mostrar "Mi perfil" y "Cerrar sesión"
    if (loginNav) loginNav.style.display = "none";
    if (profileNav) profileNav.style.display = "inline";
    if (logoutBtn) logoutBtn.style.display = "inline";

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const { error: logoutError } = await supabase.auth.signOut();
        if (logoutError) {
          console.error("❌ Error cerrando sesión:", logoutError.message);
        } else {
          window.location.href = "index.html";
        }
      });
    }
  } else {
    // Usuario NO logueado → mostrar "Login", ocultar "Mi perfil" y "Cerrar sesión"
    if (loginNav) loginNav.style.display = "inline";
    if (profileNav) profileNav.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});
