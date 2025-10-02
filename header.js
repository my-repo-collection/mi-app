// header.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Intenta encontrar nav elements en la página (si existen)
  const loginNav = document.getElementById("loginNav");
  const profileNav = document.getElementById("profileNav");
  const logoutBtn = document.getElementById("logoutBtn");

  // Check session
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    setNav(session ? true : false);
  } catch (e) {
    setNav(false);
  }

  function setNav(logged) {
    if (loginNav) loginNav.style.display = logged ? "none" : "inline-block";
    if (profileNav) profileNav.style.display = logged ? "inline-block" : "none";
    if (logoutBtn) logoutBtn.style.display = logged ? "inline-block" : "none";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      setNav(false);
      window.location.href = "index.html";
    });
  }

  // Listener global
  supabase.auth.onAuthStateChange((event, session) => {
    setNav(session ? true : false);
  });
});
