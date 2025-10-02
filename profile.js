// profile.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const perfilIdParam = params.get("id");
  const { data: session } = await supabase.auth.getUser();
  const user = session?.user ?? null;
  if (!user && !perfilIdParam) return (window.location.href = "login.html");

  const idBuscado = perfilIdParam || user.id;
  const esDueno = user ? idBuscado === user.id : false;

  // Helpers
  const showMsg = (txt, type="info") => { console.log(type, txt); };
  const clearMsg = () => {};

  // Perfil
  let currentProfile;
  try {
    const { data, error } = await supabase.from("usuarios").select("*").eq("id", idBuscado).single();
    if (error) throw error;
    currentProfile = data;
  } catch (err) {
    document.body.innerHTML = "<p>Error cargando perfil.</p>";
    return;
  }

  // Render datos
  document.getElementById("userName").textContent = currentProfile.name || "Sin nombre";
  document.getElementById("userEmail").textContent = currentProfile.email || "";
  document.getElementById("userBio").textContent = currentProfile.bio || "Sin biografía";
  document.getElementById("avatarPreview").src = currentProfile.avatar_url || "https://via.placeholder.com/120";
  document.getElementById("coverPreview").src = currentProfile.cover_url || "https://via.placeholder.com/900x200";

  // Owner actions
  const ownerActions = document.getElementById("ownerActions");
  if (ownerActions) ownerActions.style.display = esDueno ? "block" : "none";

  // Compartir
  const shareBtn = document.getElementById("shareProfileBtn");
  if (shareBtn && navigator.share) {
    shareBtn.addEventListener("click", () => {
      navigator.share({
        title: `${currentProfile.name || "Perfil"} en Mi Galería`,
        text: "Mira este perfil creativo 🎨",
        url: window.location.href
      });
    });
  }

  // Editar perfil
  const editForm = document.getElementById("editProfileForm");
  if (esDueno && editForm) {
    document.getElementById("nameInput").value = currentProfile.name || "";
    document.getElementById("bioInput").value = currentProfile.bio || "";
    document.getElementById("editToggleBtn").addEventListener("click", () => {
      editForm.style.display = editForm.style.display === "block" ? "none" : "block";
    });

    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      let avatarUrl = currentProfile.avatar_url;
      let coverUrl = currentProfile.cover_url;

      const avatarFile = document.getElementById("avatarInput")?.files?.[0];
      if (avatarFile) {
        const { data } = await supabase.storage.from("avatars").upload(`${user.id}/avatar.${avatarFile.name.split(".").pop()}`, avatarFile, { upsert: true });
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(`${user.id}/avatar.${avatarFile.name.split(".").pop()}`).data.publicUrl;
      }
      const coverFile = document.getElementById("coverInput")?.files?.[0];
      if (coverFile) {
        await supabase.storage.from("avatars").upload(`${user.id}/cover.${coverFile.name.split(".").pop()}`, coverFile, { upsert: true });
        coverUrl = supabase.storage.from("avatars").getPublicUrl(`${user.id}/cover.${coverFile.name.split(".").pop()}`).data.publicUrl;
      }

      await supabase.from("usuarios").update({
        name: document.getElementById("nameInput").value,
        bio: document.getElementById("bioInput").value,
        avatar_url: avatarUrl,
        cover_url: coverUrl
      }).eq("id", user.id);

      location.reload();
    });
  }

  // Resize helper
  async function resizeImage(file, maxSize = 1200) {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      const canvas = document.createElement("canvas");
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(resolve, file.type, 0.9);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Galería con skeleton
  async function refreshGallery() {
    const gallery = document.getElementById("galleryGrid");
    gallery.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const skel = document.createElement("div");
      skel.className = "skeleton";
      skel.style.height = "180px";
      gallery.appendChild(skel);
    }

    const { data: images } = await supabase.from("imagenes").select("*").eq("user_id", idBuscado).order("created_at", { ascending: false });
    renderGallery(images || []);
  }
  refreshGallery();

  function renderGallery(images) {
    const gallery = document.getElementById("galleryGrid");
    gallery.innerHTML = "";
    if (!images.length) return (gallery.innerHTML = "<p>Sin imágenes todavía.</p>");
    images.forEach((img) => {
      const card = document.createElement("div");
      card.className = "image-card";
      card.innerHTML = `<img src="${img.url}" alt="foto">`;
      if (esDueno) {
        const actions = document.createElement("div");
        actions.className = "image-actions";
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑 Eliminar";
        delBtn.onclick = async () => {
          await supabase.storage.from("imagenes").remove([img.path]);
          await supabase.from("imagenes").delete().eq("id", img.id);
          refreshGallery();
        };
        actions.appendChild(delBtn);
        card.appendChild(actions);
      }
      gallery.appendChild(card);
    });
  }

  // Subir nueva imagen
  if (esDueno) {
    document.getElementById("uploadForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      let file = document.getElementById("imageInput").files[0];
      if (!file) return;
      file = await resizeImage(file);
      const ext = "jpg";
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      await supabase.storage.from("imagenes").upload(filePath, file, { upsert: true });
      const publicUrl = supabase.storage.from("imagenes").getPublicUrl(filePath).data.publicUrl;
      await supabase.from("imagenes").insert([{ user_id: user.id, url: publicUrl, path: filePath }]);
      refreshGallery();
    });
  }
});
