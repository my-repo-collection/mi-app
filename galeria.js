// galeria.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const galleryList = document.getElementById("galeria-list");
  const uploadSection = document.getElementById("upload-section");
  const uploadBtn = document.getElementById("upload-image-btn");
  const imageInput = document.getElementById("image-input");
  const galleryDesc = document.getElementById("gallery-desc");
  const logoutBtn = document.getElementById("logout");

  // Detectar usuario en URL
  const urlParams = new URLSearchParams(window.location.search);
  const viewedUserId = urlParams.get("user");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) window.location.href = "login.html";

  const isOwner = !viewedUserId || viewedUserId === user.id;
  const userId = viewedUserId || user.id;

  if (isOwner) {
    galleryDesc.textContent = "Aquí puedes ver y subir tus imágenes.";
    uploadSection.style.display = "block";
  } else {
    galleryDesc.textContent = "Galería pública de este usuario.";
    uploadSection.style.display = "none";
    logoutBtn.style.display = "none";
  }

  // Cargar imágenes
  async function loadImages() {
    galleryList.innerHTML = "<p>Cargando imágenes...</p>";

    const { data, error } = await supabase
      .from("imagenes")
      .select("url, name")
      .eq("user_id", userId)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
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
      el.alt = img.name;
      galleryList.appendChild(el);
    });
  }
  loadImages();

  // Subir imágenes (solo dueño)
  if (isOwner) {
    uploadBtn.addEventListener("click", () => imageInput.click());

    imageInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileName = `img-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("imagenes")
        .upload(fileName, file);

      if (uploadError) {
        alert("Error al subir imagen: " + uploadError.message);
        return;
      }

      const { data: signedData } = await supabase.storage
        .from("imagenes")
        .createSignedUrl(fileName, 3600);

      if (!signedData?.signedUrl) return;

      await supabase.from("imagenes").insert({
        user_id: user.id,
        url: signedData.signedUrl,
        name: file.name
      });

      loadImages();
    });

    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }
});
