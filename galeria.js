// galeria.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const galleryList = document.getElementById("galeria-list");
  const uploadSection = document.getElementById("upload-section");
  const uploadBtn = document.getElementById("upload-image-btn");
  const imageInput = document.getElementById("image-input");
  const galleryDesc = document.getElementById("gallery-desc");
  const logoutBtn = document.getElementById("logout");

  // Detectar usuario en URL (?user=...)
  const urlParams = new URLSearchParams(window.location.search);
  const viewedUserId = urlParams.get("user");

  // Usuario logueado
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error("Error al obtener usuario:", userError.message);
    window.location.href = "login.html";
    return;
  }
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const isOwner = !viewedUserId || viewedUserId === user.id;
  const userId = viewedUserId || user.id;

  // Texto y botones según dueño o público
  if (isOwner) {
    galleryDesc.textContent = "Aquí puedes ver y subir tus imágenes.";
    uploadSection.style.display = "block";
  } else {
    galleryDesc.textContent = "Galería pública de este usuario.";
    uploadSection.style.display = "none";
    logoutBtn.style.display = "none";
  }

  // ------------------- Cargar imágenes -------------------
  async function loadImages() {
    galleryList.innerHTML = "<p>Cargando imágenes...</p>";

    const { data, error } = await supabase
      .from("imagenes")
      .select("url, name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar imágenes:", error.message);
      galleryList.innerHTML = "<p>Error al cargar imágenes.</p>";
      return;
    }

    if (!data || data.length === 0) {
      galleryList.innerHTML = "<p>No hay imágenes en esta galería.</p>";
      return;
    }

    galleryList.innerHTML = "";
    data.forEach(img => {
      const el = document.createElement("img");
      el.src = img.url;
      el.alt = img.name || "Imagen subida";
      galleryList.appendChild(el);
    });
  }
  loadImages();

  // ------------------- Subir imágenes (solo dueño) -------------------
  if (isOwner) {
    uploadBtn.addEventListener("click", () => imageInput.click());

    imageInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = `img-${user.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("imagenes")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        alert("Error al subir imagen: " + uploadError.message);
        return;
      }

      // URL pública
      const { data: publicUrlData } = supabase
        .storage
        .from("imagenes")
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        alert("Error al obtener URL pública de la imagen");
        return;
      }

      // Guardar en tabla
      const { error: insertError } = await supabase.from("imagenes").insert({
        user_id: user.id,
        url: publicUrlData.publicUrl,
        name: file.name
      });

      if (insertError) {
        console.error("Error insertando en DB:", insertError.message);
      }

      loadImages();
    });

    // Logout
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }
});
