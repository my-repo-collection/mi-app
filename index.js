// index.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const galleryPreview = document.getElementById("galleryPreview");

  async function loadPublicImages() {
    galleryPreview.innerHTML = `<p>Cargando imágenes…</p>`;
    try {
      const { data, error } = await supabase
        .from("imagenes")
        .select("id, url, titulo, tema, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      if (!data.length) {
        galleryPreview.innerHTML = `<p>No hay imágenes aún.</p>`;
        return;
      }

      galleryPreview.innerHTML = data.map(img => `
        <div class="gallery-item" tabindex="0">
          <img src="${img.url}" alt="${img.titulo || 'Imagen pública'}">
        </div>
      `).join("");
    } catch (err) {
      console.error(err);
      galleryPreview.innerHTML = `<p>Error cargando imágenes.</p>`;
    }
  }

  loadPublicImages();
});
