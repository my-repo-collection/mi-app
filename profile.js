// profile.js
import { supabase } from "./config.js";
import { resizeImage, showToast } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const perfilIdParam = params.get("id");

  // Get current user session
  const { data: sessionResp } = await supabase.auth.getUser();
  const user = sessionResp?.user ?? null;
  if (!user && !perfilIdParam) return (window.location.href = "login.html");

  const idBuscado = perfilIdParam || user.id;
  const esDueno = user ? idBuscado === user.id : false;

  let currentProfile;

  // --- Obtener perfil desde tabla usuarios
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", idBuscado)
      .single();
    if (error) throw error;
    currentProfile = data;
  } catch (err) {
    console.error("Error cargando perfil:", err);
    document.body.innerHTML = "<p>Error cargando perfil.</p>";
    return;
  }

  // --- Render inicial
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userBioEl = document.getElementById("userBio");
  const avatarPreview = document.getElementById("avatarPreview");
  const coverPreview = document.getElementById("coverPreview");

  if (userNameEl) userNameEl.textContent = currentProfile.name || "Sin nombre";
  if (userEmailEl) userEmailEl.textContent = currentProfile.email || "";
  if (userBioEl) userBioEl.textContent = currentProfile.bio || "Sin biografía";
  if (avatarPreview) avatarPreview.src = currentProfile.avatar_url || "https://via.placeholder.com/120";
  if (coverPreview) coverPreview.src = currentProfile.cover_url || "https://via.placeholder.com/900x200";

  // Mostrar/ocultar owner actions
  const ownerActions = document.getElementById("ownerActions");
  if (ownerActions) ownerActions.style.display = esDueno ? "block" : "none";

  // Compartir (Web Share API)
  const shareBtn = document.getElementById("shareProfileBtn");
  if (shareBtn && navigator.share) {
    shareBtn.addEventListener("click", () => {
      navigator.share({
        title: `${currentProfile.name || "Perfil"} en Mi Galería`,
        text: "Mira este perfil creativo 🎨",
        url: window.location.href
      }).catch(() => {});
    });
  }

  // Lightbox helper
  function createLightbox(url, filename = "") {
    if (document.getElementById("lightbox-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "lightbox-overlay";
    overlay.className = "lightbox-overlay";

    const content = document.createElement("div");
    content.className = "lightbox-content";

    const img = document.createElement("img");
    img.className = "lightbox-img";
    img.src = url;
    img.alt = filename || "Imagen";

    const actions = document.createElement("div");
    actions.className = "lightbox-actions";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Cerrar";
    closeBtn.onclick = () => overlay.remove();

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copiar URL";
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = "Copiado ✓";
        setTimeout(() => (copyBtn.textContent = "Copiar URL"), 1500);
      } catch {
        copyBtn.textContent = "Error";
      }
    };

    const downloadLink = document.createElement("a");
    downloadLink.textContent = "Descargar";
    downloadLink.href = url;
    downloadLink.download = filename || "";
    downloadLink.className = "lightbox-download";

    actions.appendChild(downloadLink);
    actions.appendChild(copyBtn);
    actions.appendChild(closeBtn);

    content.appendChild(img);
    content.appendChild(actions);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
  }

  // --- Edit profile
  const editForm = document.getElementById("editProfileForm");
  if (esDueno && editForm) {
    document.getElementById("nameInput").value = currentProfile.name || "";
    document.getElementById("bioInput").value = currentProfile.bio || "";

    document.getElementById("editToggleBtn").addEventListener("click", () => {
      editForm.style.display = editForm.style.display === "block" ? "none" : "block";
    });

    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newName = document.getElementById("nameInput").value.trim();
      const newBio = document.getElementById("bioInput").value.trim();

      let avatarUrl = currentProfile.avatar_url || null;
      let coverUrl = currentProfile.cover_url || null;

      // Avatar upload
      try {
        const avatarFileRaw = document.getElementById("avatarInput")?.files?.[0];
        if (avatarFileRaw) {
          const avatarFile = await resizeImage(avatarFileRaw, 600);
          const cleanName = avatarFile.name.replace(/\s+/g, "_");
          const filePath = `${user.id}/avatar-${Date.now()}-${cleanName}`;
          const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, { upsert: true });
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
          avatarUrl = data?.publicUrl;
        }
      } catch (err) {
        console.error("Error subiendo avatar:", err);
        showToast("Error subiendo avatar", "error");
        return;
      }

      // Cover upload
      try {
        const coverFileRaw = document.getElementById("coverInput")?.files?.[0];
        if (coverFileRaw) {
          const coverFile = await resizeImage(coverFileRaw, 1800);
          const cleanName = coverFile.name.replace(/\s+/g, "_");
          const filePath = `${user.id}/cover-${Date.now()}-${cleanName}`;
          const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, coverFile, { upsert: true });
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
          coverUrl = data?.publicUrl;
        }
      } catch (err) {
        console.error("Error subiendo portada:", err);
        showToast("Error subiendo portada", "error");
        return;
      }

      // Save to DB
      try {
        const { error: updateError } = await supabase
          .from("usuarios")
          .update({
            name: newName,
            bio: newBio,
            avatar_url: avatarUrl,
            cover_url: coverUrl
          })
          .eq("id", user.id);

        if (updateError) throw updateError;
        showToast("Perfil actualizado", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        console.error("Error guardando perfil:", err);
        showToast("Error guardando perfil", "error");
      }
    });
  }

  // --- Gallery
  async function refreshGallery() {
    const gallery = document.getElementById("galleryGrid");
    if (!gallery) return;
    gallery.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const sk = document.createElement("div");
      sk.className = "skeleton";
      sk.style.height = "180px";
      gallery.appendChild(sk);
    }

    try {
      const { data: images, error } = await supabase
        .from("imagenes")
        .select("*")
        .eq("user_id", idBuscado)
        .order("created_at", { ascending: false });

      if (error) throw error;
      renderGallery(images || []);
    } catch (err) {
      console.error("Error cargando galería:", err);
      const gallery = document.getElementById("galleryGrid");
      if (gallery) gallery.innerHTML = "<p>Error cargando galería.</p>";
      showToast("Error cargando galería", "error");
    }
  }

  function renderGallery(images) {
    const gallery = document.getElementById("galleryGrid");
    gallery.innerHTML = "";
    if (!images.length) {
      gallery.innerHTML = "<p>Sin imágenes todavía.</p>";
      return;
    }

    images.forEach((img) => {
      const card = document.createElement("div");
      card.className = "image-card";

      const imageEl = document.createElement("img");
      imageEl.src = img.url;
      imageEl.alt = img.name || "foto";
      imageEl.style.cursor = "pointer";
      imageEl.addEventListener("click", () => createLightbox(img.url, img.name || ""));

      card.appendChild(imageEl);

      if (esDueno) {
        const actions = document.createElement("div");
        actions.className = "image-actions";

        // Eliminar
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ Eliminar";
        delBtn.onclick = async () => {
          if (!confirm("¿Eliminar esta imagen?")) return;
          try {
            if (img.path) {
              const { error: rmErr } = await supabase.storage.from("imagenes").remove([img.path]);
              if (rmErr) console.warn("Error borrando storage:", rmErr);
            }
            const { error: dbErr } = await supabase.from("imagenes").delete().eq("id", img.id);
            if (dbErr) throw dbErr;
            await refreshGallery();
            showToast("Imagen eliminada", "success");
          } catch (err) {
            console.error("Error eliminando:", err);
            showToast("Error eliminando imagen", "error");
          }
        };

        // Reemplazar
        const repBtn = document.createElement("button");
        repBtn.textContent = "🔁 Reemplazar";
        repBtn.onclick = () => handleReplaceImage(img);

        actions.appendChild(delBtn);
        actions.appendChild(repBtn);
        card.appendChild(actions);
      }

      gallery.appendChild(card);
    });
  }

  async function handleReplaceImage(imgRow) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const fileRaw = input.files[0];
      if (!fileRaw) return;
      try {
        const file = await resizeImage(fileRaw);
        const cleanName = file.name.replace(/\s+/g, "_");
        const newPath = `${user.id}/${Date.now()}-${cleanName}`;
        const { error: uploadError } = await supabase.storage.from("imagenes").upload(newPath, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("imagenes").getPublicUrl(newPath);
        const publicUrl = data?.publicUrl;
        // update DB row
        const { error: updateError } = await supabase.from("imagenes").update({ url: publicUrl, path: newPath, name: file.name }).eq("id", imgRow.id);
        if (updateError) throw updateError;
        // optionally remove old storage file
        if (imgRow.path) {
          await supabase.storage.from("imagenes").remove([imgRow.path]).catch(() => {});
        }
        await refreshGallery();
        showToast("Imagen reemplazada", "success");
      } catch (err) {
        console.error("Error reemplazando imagen:", err);
        showToast("Error reemplazando imagen", "error");
      }
    };
  }

  // Subir nueva imagen (owner)
  if (esDueno) {
    const uploadForm = document.getElementById("uploadForm");
    uploadForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("imageInput");
      const raw = fileInput?.files?.[0];
      if (!raw) {
        showToast("Selecciona una imagen", "info");
        return;
      }
      try {
        const file = await resizeImage(raw, 1600);
        const cleanName = file.name.replace(/\s+/g, "_");
        const filePath = `${user.id}/${Date.now()}-${cleanName}`;
        const { error: uploadError } = await supabase.storage.from("imagenes").upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("imagenes").getPublicUrl(filePath);
        const publicUrl = data?.publicUrl;
        // Insert into table 'imagenes'
        const { error: insertError } = await supabase.from("imagenes").insert([{ user_id: user.id, url: publicUrl, path: filePath, name: file.name }]);
        if (insertError) throw insertError;
        fileInput.value = "";
        await refreshGallery();
        showToast("Imagen subida", "success");
      } catch (err) {
        console.error("Error subiendo imagen:", err);
        showToast("Error subiendo imagen", "error");
      }
    });
  }

  // Inicial
  await refreshGallery();
});
