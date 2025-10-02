// auth-redirect.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Insertar pantalla de carga
  const loader = document.createElement("div");
  loader.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      height:100vh;
      font-family:Arial, sans-serif;
      background:#f9fafb;
      color:#4c1d95;
    ">
      <div style="
        border:4px solid #ddd;
        border-top:4px solid #7c3aed;
        border-radius:50%;
        width:50px;
        height:50px;
        animation:spin 1s linear infinite;
      "></div>
      <p style="margin-top:20px; font-size:18px;">Confirmando tu cuenta…</p>
    </div>
    <style>
      @keyframes spin {
        from { transform:rotate(0deg); }
        to { transform:rotate(360deg); }
      }
    </style>
  `;
  document.body.innerHTML = "";
  document.body.appendChild(loader);

  const hash = window.location.hash.substring(1);
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error("❌ Error al establecer sesión:", error.message);
      loader.innerHTML = `<p style="color:red;">❌ Error confirmando tu cuenta.<br>${error.message}</p>`;
    } else {
      console.log("✅ Sesión restaurada desde URL");

      // Pequeña pausa para que se vea el loader aunque sea medio segundo
      setTimeout(() => {
        if (type === "signup") {
          window.location.href = "profile.html";
        } else if (type === "recovery") {
          window.location.href = "reset-confirm.html";
        } else {
          window.location.href = "profile.html";
        }
      }, 1000);
    }
  }
});
