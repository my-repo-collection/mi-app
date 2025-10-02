// profile.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const viewedUserId = urlParams.get("user");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) window.location.href = "login.html";

  const isOwner = !viewedUserId || viewedUserId === user.id;
  const userId = viewedUserId || user.id;

  // Elementos
  const nameEl = document.getElementById("user-name");
  const bioEl = document.getElementById("user-bio");
  const avatarEl = document.getElementById("avatar");
  const nameInput = document.getElementById("name-input");
  const bioInput = document.getElementById("bio-input");
  const avatarInput = document.getElementById("avatar-input");
  const editNameBtn = document.getElementById("edit-name");
  const saveNameBtn = document.getElementById("save-name");
  const editBioBtn = document.getElementById("edit-bio");
  const saveBioBtn = document.getElementById("save-bio");
  const changeAvatarBtn = document.getElementById("change-avatar");
  const saveAvatarBtn = document.getElementById("save-avatar");
  const uploadBtn = document.getElementById("upload-image-btn");
  const imageInput = document.getElementById("image-input");
  const gallery = document.getElementById("profile-gallery");
  const logoutBtn = document.getElementById("logout");

  // Ocultar controles si no es dueño
  if (!isOwner) {
    document.querySelectorAll(".icon-btn, .btn.small, #upload-image-btn").forEach(el => el.style.display = "none");
    if (logoutBtn) logoutBtn.style.display = "none";
  }

  // Cargar datos del perfil
  const { data: perfil } = await supabase.from("usuarios").select("name, bio, avatar_url").eq("id", userId).single();

  if (perfil) {
    nameEl.textContent = perfil.name || "Usuario sin nombre";
    bioEl.textContent = perfil.bio || "Este usuario aún no escribió nada.";
    if (perfil.avatar_url) avatarEl.src = perfil.avatar_url;
  }

  // Editar avatar
  if (isOwner) {
    changeAvatarBtn.addEventListener("click", () => avatarInput.click());
    avatarInput.addEventListener("change", () => saveAvatarBtn.classList.remove("hidden"));

    saveAvatarBtn.addEventListener("click", async () => {
      const file = avatarInput.files[0];
      if (!file) return;

      const fileName = `avatar-${user.id}.${file.name.split(".").pop()}`;
      await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });

      const { data: signedData } = await supabase.storage.from("avatars").createSignedUrl(fileName, 3600);
      const avatarUrl = signedData?.signedUrl;

      avatarEl.src = avatarUrl;
      await supabase.from("usuarios").update({ avatar_url: avatarUrl }).eq("id", user.id);

      saveAvatarBtn.classList.add("hidden");
    });
  }

  // Editar nombre
  if (isOwner) {
    editNameBtn.addEventListener("click", () => {
      nameInput.value = nameEl.textContent;
      nameInput.classList.remove("hidden");
      nameEl.classList.add("hidden");
      saveNameBtn.classList.remove("hidden");
    });

    saveNameBtn.addEventListener("click", async () => {
      await supabase.from("usuarios").update({ name: nameInput.value }).eq("id", user.id);
      nameEl.textContent = nameInput.value;
      nameEl.classList.remove("hidden");
      nameInput.classList.add("hidden");
      saveNameBtn.classList.add("hidden");
    });
  }

  // Editar bio
  if (isOwner) {
    editBioBtn.addEventListener("click", () => {
      bioInput.value = bioEl.textContent;
      bioInput.classList.remove("hidden");
      bioEl.classList.add("hidden");
      saveBioBtn.classList.remove("hidden");
    });

    saveBioBtn.addEventListener("click", async () => {
      await supabase.from("usuarios").update({ bio: bioInput.value }).eq("id", user.id);
      bioEl.textContent = bioInput.value;
      bioEl.classList.remove("hidden");
      bioInput.classList.add("hidden");
      saveBioBtn.classList.add("hidden");
    });
  }

  // Galería del perfil
  async function loadImages() {
    const { data } = await supabase.from("imagenes").select("url, name").eq("user_id", userId).order("id", { ascending: false });

    gallery.innerHTML = "";
    if (data && data.length > 0) {
      data.forEach(img => {
        const el = document.createElement("img");
        el.src = img.url;
        el.alt = img.name;
        gallery.appendChild(el);
      });
    } else {
      gallery.innerHTML = "<p>No hay imágenes en este perfil.</p>";
    }
  }
  loadImages();

  // Subir imágenes al perfil
  if (isOwner) {
    uploadBtn.addEventListener("click", () => imageInput.click());

    imageInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = `img-${Date.now()}-${file.name}`;
      await supabase.storage.from("imagenes").upload(fileName, file);

      const { data: signedData } = await supabase.storage.from("imagenes").createSignedUrl(fileName, 3600);

      await supabase.from("imagenes").insert({ user_id: user.id, url: signedData.signedUrl, name: file.name });
      loadImages();
    });

    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }
});
