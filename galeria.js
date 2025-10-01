// galeria.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const galleryGrid = document.getElementById("galleryGrid");
  const searchInput = document.getElementById("searchInput");

  async function loadGallery(filter = "") {
    galleryGrid.innerHTML = `<p>Cargando galería…</p>`;
    try {
      let query = supabase.from("imagenes")
        .select("id, url, titulo, tema, created_at, usuarios(name)")
        .order("created_at", { ascending: false });

      if (filter) {
        query = supabase.from("imagenes")
          .select("id, url, titulo, tema, created_at, usuarios(name)")
          .or(`titulo.ilike.%${filter}%,tema.ilike.%${filter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data.length) {
        galleryGrid.innerHTML = `<p>No se encontraron imágenes.</p>`;
        return;
      }

      galleryGrid.innerHTML = data.map(img => `
        <article class="gallery-item">
          <img src="${img.url}" alt="${img.titulo || 'Imagen de la galería'}">
          <div class="tile-meta">
            <p class="tile-title">${img.titulo || ""}</p>
            <p class="tile-author">by ${img.usuarios?.name || "Usuario"}</p>
          </div>
        </article>
      `).join("");
    } catch (err) {
      console.error(err);
      galleryGrid.innerHTML = `<p>Error cargando galería.</p>`;
    }
  }

  let debounce;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => loadGallery(e.target.value.trim()), 300);
    });
  }

  loadGallery();
});
