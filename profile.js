// profile.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Helpers UI
  function showMsg(text, type = "info") {
    let box = document.getElementById("msgBox");
    if (!box) {
      // crear msgBox dentro de ownerActions si no existe
      const owner = document.getElementById("ownerActions");
      if (owner) {
        box = document.createElement("div");
        box.id = "msgBox";
        box.style.marginTop = "10px";
        owner.prepend(box);
      } else {
        // fallback: body
        box = document.createElement("div");
        box.id = "msgBox";
        document.body.prepend(box);
      }
    }
    box.textContent = text;
    box.style.color = type === "error" ? "#b91c1c" : type === "success" ? "#065f46" : "#374151";
  }
  function clearMsg() {
    const b = document.getElementById("msgBox");
    if (b) b.textContent = "";
  }

  // 1) detectar parámetro id (si visita otro perfil)
  const params = new URLSearchParams(window.location.search);
  const perfilIdParam = params.get("id");

  // 2) obtener sesión (puede no haber si visitante)
  const sessionResp = await supabase.auth.getUser();
  const user = sessionResp?.data?.user ?? null;
  if (!user && !perfilIdParam) {
    // no hay sesión y no se pide perfil público: forzar login
    window.location.href = "login.html";
    return;
  }

  const idBuscado = perfilIdParam || user.id;
  const esDueno = user ? idBuscado === user.id : false;

  // 3) cargar perfil desde DB
  let currentProfile = null;
  try {
    const { data: profile, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", idBuscado)
      .single();

    if (error) throw error;
    currentProfile = profile;
  } catch (err) {
    console.error("Error cargando perfil:", err.message || err);
    document.body.innerHTML = "<p>Error cargando perfil.</p>";
    return;
  }

  // 4) Renderizar datos básicos
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userBioEl = document.getElementById("userBio");
  const avatarPreview = document.getElementById("avatarPreview");

  if (userNameEl) userNameEl.textContent = currentProfile.name || "Sin nombre";
  if (userEmailEl) userEmailEl.textContent = currentProfile.email || "";
  if (userBioEl) userBioEl.textContent = currentProfile.bio || "Sin biografía";
  if (avatarPreview) avatarPreview.src = currentProfile.avatar_url || "https://via.placeholder.com/120";

  // 5) Mostrar/ocultar zona de edición para dueño
  const ownerActions = document.getElementById("ownerActions");
  if (ownerActions) ownerActions.style.display = esDueno ? "block" : "none";

  // 6) LOGICA: Toggle formulario editar
  const editToggleBtn = document.getElementById("editToggleBtn");
  const editForm = document.getElementById("editProfileForm");
  const nameInput = document.getElementById("nameInput");
  const bioInput = document.getElementById("bioInput");
  const avatarInput = document.getElementById("avatarInput");

  if (esDueno && editToggleBtn && editForm) {
    // poblar valores iniciales
    if (nameInput) nameInput.value = currentProfile.name || "";
    if (bioInput) bioInput.value = currentProfile.bio || "";

    editToggleBtn.addEventListener("click", () => {
      editForm.style.display = editForm.style.display === "block" ? "none" : "block";
      clearMsg();
    });
  }

  // 7) Handler: guardar cambios de perfil (avatar, name, bio)
  if (esDueno && editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMsg();

      const saveBtn = editForm.querySelector("button[type='submit']");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.style.opacity = "0.7";
      }

      const newName = (nameInput?.value || "").trim();
      const newBio = (bioInput?.value || "").trim();
      const file = avatarInput?.files?.[0] ?? null;

      let avatarUrl = currentProfile.avatar_url || null;

      // Subir avatar si hay archivo
      if (file) {
        try {
          // crear path único
          const ext = file.name.split(".").pop();
          const filePath = `avatars/${user.id}/avatar-${Date.now()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, { upsert: true });

          if (uploadError) {
            console.error("Error subiendo avatar:", uploadError.message);
            showMsg("Error subiendo la imagen de perfil: " + uploadError.message, "error");
            if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = "1"; }
            return;
          }

          // getPublicUrl (no es async)
          const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
          avatarUrl = data?.publicUrl || avatarUrl;
        } catch (err) {
          console.error("Excepción subiendo avatar:", err);
          showMsg("Error subiendo la imagen de perfil.", "error");
          if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = "1"; }
          return;
        }
      }

      // Actualizar fila en usuarios
      try {
        const { error: updateError } = await supabase
          .from("usuarios")
          .update({
            name: newName,
            bio: newBio,
            avatar_url: avatarUrl,
          })
          .eq("id", user.id);

        if (updateError) throw updateError;

        // actualizar UI sin recargar
        currentProfile.name = newName;
        currentProfile.bio = newBio;
        currentProfile.avatar_url = avatarUrl;

        if (userNameEl) userNameEl.textContent = newName || "Sin nombre";
        if (userBioEl) userBioEl.textContent = newBio || "Sin biografía";
        if (avatarPreview && avatarUrl) avatarPreview.src = avatarUrl;

        showMsg("✅ Perfil actualizado con éxito", "success");
        // cerrar form
        editForm.style.display = "none";
      } catch (err) {
        console.error("Error actualizando perfil:", err.message || err);
        showMsg("No se pudo actualizar el perfil: " + (err.message || err), "error");

        // si es error RLS típico, indicar al usuario
        if (err?.message && err.message.includes("row-level")) {
          showMsg("Permiso denegado: revisa la policy RLS en la tabla 'usuarios'.", "error");
        }
      } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = "1"; }
      }
    });
  }

  // 8) Cargar galería y render
  async function refreshGallery() {
    try {
      const { data: images, error: imgError } = await supabase
        .from("imagenes")
        .select("*")
        .eq("user_id", idBuscado)
        .order("created_at", { ascending: false });

      if (imgError) throw imgError;
      renderGallery(images || [], esDueno);
    } catch (err) {
      console.error("Error cargando galería:", err.message || err);
      showMsg("Error cargando galería: " + (err.message || err), "error");
    }
  }

  await refreshGallery();

  // 9) Upload nueva imagen (si es dueño)
  const uploadForm = document.getElementById("uploadForm");
  if (esDueno && uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMsg();

      const fileInput = document.getElementById("imageInput");
      const file = fileInput?.files?.[0];
      if (!file) { showMsg("Selecciona una imagen antes de subir.", "error"); return; }

      const uploadBtn = uploadForm.querySelector("button[type='submit']");
      if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.style.opacity = "0.7"; }

      try {
        const ext = file.name.split(".").pop();
        const filePath = `images/${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage.from("imagenes").upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("imagenes").getPublicUrl(filePath);
        const publicUrl = data?.publicUrl;

        const { error: insertError } = await supabase.from("imagenes").insert([
          { user_id: user.id, url: publicUrl, titulo: null, categoria: null }
        ]);
        if (insertError) throw insertError;

        showMsg("✅ Imagen subida", "success");
        fileInput.value = "";
        await refreshGallery();
      } catch (err) {
        console.error("Error subiendo imagen:", err.message || err);
        showMsg("Error subiendo imagen: " + (err.message || err), "error");
      } finally {
        if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.style.opacity = "1"; }
      }
    });
  }

  // 10) Render de gallery con acciones
  function renderGallery(images, esDuenoLocal) {
    const gallery = document.getElementById("galleryGrid");
    if (!gallery) return;
    gallery.innerHTML = "";

    if (!images || images.length === 0) {
      gallery.innerHTML = "<p>Sin imágenes todavía.</p>";
      return;
    }

    images.forEach(img => {
      const card = document.createElement("div");
      card.className = "image-card";

      const imageEl = document.createElement("img");
      imageEl.src = img.url;
      imageEl.alt = img.titulo || "foto";
      card.appendChild(imageEl);

      if (esDuenoLocal) {
        const actions = document.createElement("div");
        actions.className = "image-actions";

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑 Eliminar";
        delBtn.classList.add("delete");
        delBtn.onclick = () => confirmDeleteImage(img.id, img.url);

        const repBtn = document.createElement("button");
        repBtn.textContent = "♻️ Reemplazar";
        repBtn.classList.add("replace");
        repBtn.onclick = () => handleReplaceImage(img.id, img.url);

        actions.appendChild(delBtn);
        actions.appendChild(repBtn);
        card.appendChild(actions);
      }

      gallery.appendChild(card);
    });
  }

  // eliminar imagen: borra del storage (por path) y de la tabla
  async function confirmDeleteImage(imageId, imageUrl) {
    if (!confirm("¿Seguro que quieres eliminar esta imagen?")) return;

    try {
      // intentar deducir path (asume que guardaste con estructura 'images/{user.id}/...' )
      const parts = imageUrl.split("/");
      const filePath = parts.slice(-2).join("/"); // por ejemplo "USERID/12345.jpg" o ajuste según tu URL
      // Mejor buscar fila y extraer path desde url si tu app guarda 'path' también; aquí hacemos un intento
      const { error: rmError } = await supabase.storage.from("imagenes").remove([filePath]);
      if (rmError) console.warn("warning al borrar del storage:", rmError.message);

      const { error: dbError } = await supabase.from("imagenes").delete().eq("id", imageId);
      if (dbError) throw dbError;

      showMsg("✅ Imagen eliminada", "success");
      await refreshGallery();
    } catch (err) {
      console.error("Error eliminando imagen:", err.message || err);
      showMsg("Error eliminando imagen: " + (err.message || err), "error");
    }
  }

  // reemplazar imagen: abrir input file, subir, actualizar fila
  function handleReplaceImage(imageId /*, oldUrl */) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      try {
        const ext = file.name.split(".").pop();
        const filePath = `images/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("imagenes").upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("imagenes").getPublicUrl(filePath);
        const publicUrl = data?.publicUrl;

        const { error: updateError } = await supabase.from("imagenes").update({ url: publicUrl }).eq("id", imageId);
        if (updateError) throw updateError;

        showMsg("✅ Imagen reemplazada", "success");
        await refreshGallery();
      } catch (err) {
        console.error("Error reemplazando imagen:", err.message || err);
        showMsg("Error reemplazando imagen: " + (err.message || err), "error");
      }
    };
  }
});
