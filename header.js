import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loginNav = document.getElementById("loginNav");
  const profileNav = document.getElementById("profileNav");
  const logoutBtn = document.getElementById("logoutBtn");

  // Comprobar sesión actual
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (session) {
    // Usuario logueado
    if (loginNav) loginNav.style.display = "none";
    if (profileNav) profileNav.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    // Invitado
    if (loginNav) loginNav.style.display = "inline-block";
    if (profileNav) profileNav.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // Listener para cambios de sesión
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      if (loginNav) loginNav.style.display = "none";
      if (profileNav) profileNav.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "inline-block";
    } else {
      if (loginNav) loginNav.style.display = "inline-block";
      if (profileNav) profileNav.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  });
});
