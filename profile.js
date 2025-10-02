// profile.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const perfilId = params.get("id");

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("❌ No hay sesión activa.");
    window.location.href = "login.html";
    return;
  }

  const idBuscado = perfilId || user.id;
  const esDueno = idBuscado === user.id;

  const { data: profile, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", idBuscado)
    .single();

  if (error) {
    console.error("❌ Error cargando perfil:", error.message);
    document.body.innerHTML = "<p>Error cargando perfil.</p>";
    return;
  }

  // Mostrar datos
  document.getElementById("userEmail").textContent = profile.email;
  document.getElementById("userName").textContent = profile.name || "Sin nombre";
  document.getElementById("userBio").textContent = profile.bio || "Sin biografía";
  document.getElementById("avatarPreview").src = profile.avatar_url || "https://via.placeholder.com/120";

  // Mostrar/ocultar edición
  const ownerSection = document.getElementById("ownerActions");
  if (esDueno) {
    ownerSection.style.display = "block";
  } else {
    ownerSection.style.display = "none";
  }

  // Cargar imágenes
  const { data: images, error: imgError } = await supabase
    .from("imagenes")
    .select("*")
    .eq("user_id", idBuscado)
    .order("created_at", { ascending: false });

  if (imgError) {
    console.error("❌ Error cargando imágenes:", imgError.message);
  } else {
    renderGallery(images, esDueno);
  }

  // Botón compartir
  const shareBtn = document.getElementById("shareProfileBtn");
  if (shareBtn) {
    const profileUrl = `${window.location.origin}${window.location.pathname}?id=${profile.id}`;
    shareBtn.addEventListener("click", async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Perfil de ${profile.name || "usuario"}`,
            text: "Mira mi perfil en Mi Galería 📸",
            url: profileUrl,
          });
        } catch (err) {
          console.error("❌ Error al compartir:", err);
        }
      } else {
        navigator.clipboard.writeText(profileUrl);
        alert("📋 Enlace copiado: " + profileUrl);
      }
    });
  }
});

// Renderizar galería
function renderGallery(images, esDueno) {
  const gallery = document.getElementById("galleryGrid");
  gallery.innerHTML = "";

  images.forEach(img => {
    const card = document.createElement("div");
    card.className = "image-card";

    const imageEl = document.createElement("img");
    imageEl.src = img.url;
    card.appendChild(imageEl);

    if (esDueno) {
      const actions = document.createElement("div");
      actions.className = "image-actions";

      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑 Eliminar";
      delBtn.classList.add("delete");
      delBtn.onclick = () => deleteImage(img.id);

      const repBtn = document.createElement("button");
      repBtn.textContent = "♻️ Reemplazar";
      repBtn.classList.add("replace");
      repBtn.onclick = () => replaceImage(img.id);

      actions.appendChild(delBtn);
      actions.appendChild(repBtn);
      card.appendChild(actions);
    }

    gallery.appendChild(card);
  });
}

// TODO: Implementar con Supabase Storage + DB
function deleteImage(id) {
  console.log("Eliminar imagen:", id);
}
function replaceImage(id) {
  console.log("Reemplazar imagen:", id);
}


// --- Guardar cambios de perfil ---
const editForm = document.getElementById("editProfileForm");
if (editForm) {
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("nameInput").value.trim();
    const bio = document.getElementById("bioInput").value.trim();
    const file = document.getElementById("avatarInput").files[0];

    let avatarUrl = profile.avatar_url;

    // 1. Si subió nueva foto de perfil
    if (file) {
      const filePath = `avatars/${user.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Error subiendo avatar:", uploadError.message);
        alert("Error subiendo la foto de perfil");
        return;
      }

      // Obtener URL pública
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      avatarUrl = data.publicUrl;
    }

    // 2. Actualizar la tabla usuarios
    const { error: updateError } = await supabase
      .from("usuarios")
      .update({
        name,
        bio,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ Error actualizando perfil:", updateError.message);
      alert("No se pudo actualizar el perfil.");
    } else {
      alert("✅ Perfil actualizado con éxito");
      location.reload();
    }
  });
}

// --- Botón de mostrar formulario ---
const editToggleBtn = document.getElementById("editToggleBtn");
if (editToggleBtn) {
  editToggleBtn.addEventListener("click", () => {
    const form = document.getElementById("editProfileForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
  });
}
