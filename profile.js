// profile.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  // --- Helpers mensajes ---
  function showMsg(text, type = "info") {
    let box = document.getElementById("msgBox");
    if (!box) {
      const owner = document.getElementById("ownerActions");
      box = document.createElement("div");
      box.id = "msgBox";
      box.style.marginTop = "10px";
      box.style.fontSize = "14px";
      if (owner) {
        owner.prepend(box);
      } else {
        document.body.prepend(box);
      }
    }
    box.textContent = text;
    box.style.color =
      type === "error"
        ? "#b91c1c"
        : type === "success"
        ? "#065f46"
        : "#374151";
  }
  function clearMsg() {
    const b = document.getElementById("msgBox");
    if (b) b.textContent = "";
  }

  // --- Detectar perfil ---
  const params = new URLSearchParams(window.location.search);
  const perfilIdParam = params.get("id");

  const sessionResp = await supabase.auth.getUser();
  const user = sessionResp?.data?.user ?? null;

  if (!user && !perfilIdParam) {
    window.location.href = "login.html";
    return;
  }

  const idBuscado = perfilIdParam || user.id;
  const esDueno = user ? idBuscado === user.id : false;

  // --- Cargar perfil ---
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
    console.error("❌ Error cargando perfil:", err.message || err);
    document.body.innerHTML = "<p>Error cargando perfil.</p>";
    return;
  }

  // --- Render perfil ---
  const userNameEl = document.getElementById("userName");
  const userEmailEl = document.getElementById("userEmail");
  const userBioEl = document.getElementById("userBio");
  const avatarPreview = document.getElementById("avatarPreview");

  if (userNameEl) userNameEl.textContent = currentProfile.name || "Sin nombre";
  if (userEmailEl) userEmailEl.textContent = currentProfile.email || "";
  if (userBioEl) userBioEl.textContent = currentProfile.bio || "Sin biografía";
  if (avatarPreview)
    avatarPreview.src =
      currentProfile.avatar_url || "https://via.placeholder.com/120";

  // --- Mostrar/ocultar edición ---
  const ownerActions = document.getElementById("ownerActions");
  if (ownerActions) ownerActions.style.display = esDueno ? "block" : "none";

  // --- Editar perfil ---
  const editToggleBtn = document.getElementById("editToggleBtn");
  const editForm = document.getElementById("editProfileForm");
  const nameInput = document.getElementById("nameInput");
  const bioInput = document.getElementById("bioInput");
  const avatarInput = document.getElementById("avatarInput");

  if (esDueno && editToggleBtn && editForm) {
    nameInput.value = currentProfile.name || "";
    bioInput.value = currentProfile.bio || "";

    editToggleBtn.addEventListener("click", () => {
      editForm.style.display =
        editForm.style.display === "block" ? "none" : "block";
      clearMsg();
    });
  }

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

      if (file) {
        try {
          const ext = file.name.split(".").pop();
          const filePath = `${user.id}/avatar.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, { upsert: true });
          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          avatarUrl = data?.publicUrl || avatarUrl;
        } catch (err) {
          console.error("❌ Error subiendo avatar:", err);
          showMsg("Error subiendo avatar: " + err.message, "error");
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = "1";
          }
          return;
        }
      }

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

        currentProfile.name = newName;
        currentProfile.bio = newBio;
        currentProfile.avatar_url = avatarUrl;

        if (userNameEl) userNameEl.textContent = newName || "Sin nombre";
        if (userBioEl) userBioEl.textContent = newBio || "Sin biografía";
        if (avatarPreview && avatarUrl) avatarPreview.src = avatarUrl;

        showMsg("✅ Perfil actualizado con éxito", "success");
        editForm.style.display = "none";
      } catch (err) {
        console.error("❌ Error actualizando perfil:", err);
        showMsg("No se pudo actualizar el perfil: " + err.message, "error");
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.style.opacity = "1";
        }
      }
    });
  }

  // --- Galería ---
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
      console.error("❌ Error galería:", err);
      showMsg("Error cargando galería: " + err.message, "error");
    }
  }
  await refreshGallery();

  // --- Subir nueva imagen ---
  const uploadForm = document.getElementById("uploadForm");
  if (esDueno && uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMsg();

      const fileInput = document.getElementById("imageInput");
      const file = fileInput?.files?.[0];
      if (!file) {
        showMsg("Selecciona una imagen antes de subir.", "error");
        return;
      }

      const uploadBtn = uploadForm.querySelector("button[type='submit']");
      if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.style.opacity = "0.7";
      }

      try {
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("imagenes")
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("imagenes")
          .getPublicUrl(filePath);
        const publicUrl = data?.publicUrl;

        const { error: insertError } = await supabase
          .from("imagenes")
          .insert([{ user_id: user.id, url: publicUrl, path: filePath }]);
        if (insertError) throw insertError;

        showMsg("✅ Imagen subida", "success");
        fileInput.value = "";
        await refreshGallery();
      } catch (err) {
        console.error("❌ Error subiendo imagen:", err);
        showMsg("Error subiendo imagen: " + err.message, "error");
      } finally {
        if (uploadBtn) {
          uploadBtn.disabled = false;
          uploadBtn.style.opacity = "1";
        }
      }
    });
  }

  // --- Renderizar galería ---
  function renderGallery(images, esDuenoLocal) {
    const gallery = document.getElementById("galleryGrid");
    if (!gallery) return;
    gallery.innerHTML = "";

    if (!images || images.length === 0) {
      gallery.innerHTML = "<p>Sin imágenes todavía.</p>";
      return;
    }

    images.forEach((img) => {
      // fallback si path viene null
      let filePath = img.path;
      if (!filePath && img.url) {
        filePath = img.url.replace(
          /^.+\/storage\/v1\/object\/public\/imagenes\//,
          ""
        );
      }

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
        delBtn.onclick = () => confirmDeleteImage(img.id, filePath);

        const repBtn = document.createElement("button");
        repBtn.textContent = "♻️ Reemplazar";
        repBtn.onclick = () => handleReplaceImage(img.id);

        actions.appendChild(delBtn);
        actions.appendChild(repBtn);
        card.appendChild(actions);
      }

      gallery.appendChild(card);
    });
  }

  // --- Eliminar imagen ---
  async function confirmDeleteImage(imageId, filePath) {
    if (!confirm("¿Seguro que quieres eliminar esta imagen?")) return;

    try {
      const { error: rmError } = await supabase.storage
        .from("imagenes")
        .remove([filePath]);
      if (rmError) console.warn("⚠️ Error borrando storage:", rmError.message);

      const { error: dbError } = await supabase
        .from("imagenes")
        .delete()
        .eq("id", imageId);
      if (dbError) throw dbError;

      showMsg("✅ Imagen eliminada", "success");
      await refreshGallery();
    } catch (err) {
      console.error("❌ Error eliminando:", err);
      showMsg("Error eliminando imagen: " + err.message, "error");
    }
  }

  // --- Reemplazar imagen ---
  function handleReplaceImage(imageId) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      try {
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("imagenes")
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("imagenes")
          .getPublicUrl(filePath);
        const publicUrl = data?.publicUrl;

        const { error: updateError } = await supabase
          .from("imagenes")
          .update({ url: publicUrl, path: filePath })
          .eq("id", imageId);
        if (updateError) throw updateError;

        showMsg("✅ Imagen reemplazada", "success");
        await refreshGallery();
      } catch (err) {
        console.error("❌ Error reemplazando:", err);
        showMsg("Error reemplazando imagen: " + err.message, "error");
      }
    };
  }
});
