// profile.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const userEmail = document.getElementById("userEmail");
  const userNameInput = document.getElementById("userNameInput");
  const userBioInput = document.getElementById("userBioInput");
  const avatarImg = document.getElementById("avatarImg");
  const avatarInput = document.getElementById("avatarInput");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userGallery = document.getElementById("userGallery");
  const msgBox = document.getElementById("msgBox");

  function showMessage(msg, type = "info") {
    msgBox.textContent = msg;
    msgBox.style.color = type === "error" ? "red" : (type === "success" ? "green" : "#333");
  }

  async function loadProfile() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return window.location.href = "login.html";

    const user = auth.user;
    userEmail.textContent = user.email;

    const { data: profile } = await supabase.from("usuarios").select("name, avatar_url, bio").eq("id", user.id).single();
    if (profile) {
      userNameInput.value = profile.name || "";
      userBioInput.value = profile.bio || "";
      if (profile.avatar_url) avatarImg.src = profile.avatar_url;
    }

    loadUserImages(user.id);
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      const user = auth.user;

      const updates = {
        name: userNameInput.value.trim(),
        bio: userBioInput.value.trim(),
      };

      const { error } = await supabase.from("usuarios").update(updates).eq("id", user.id);
      if (error) return showMessage("Error guardando perfil", "error");

      showMessage("Perfil actualizado", "success");
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener("change", async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      const user = auth.user;

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}.${fileExt}`;
      await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await supabase.from("usuarios").update({ avatar_url: publicUrl }).eq("id", user.id);
      avatarImg.src = publicUrl;
      showMessage("Avatar actualizado", "success");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }

  async function loadUserImages(userId) {
    const { data, error } = await supabase.from("imagenes").select("url, titulo").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) return;

    if (!data.length) {
      userGallery.innerHTML = "<p>No has subido imágenes aún.</p>";
      return;
    }

    userGallery.innerHTML = data.map(img => `
      <div class="gallery-item">
        <img src="${img.url}" alt="${img.titulo || 'Tu imagen'}">
      </div>
    `).join("");
  }

  loadProfile();
});
