import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("explore-gallery");
  const searchBar = document.getElementById("searchBar");

  async function loadImages(query = "") {
    let req = supabase
      .from("imagenes")
      .select("id, url, name, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (query) {
      // Búsqueda parcial (case-insensitive) por nombre
      req = req.ilike("name", `%${query}%`);
    }

    const { data, error } = await req;

    if (error) {
      console.error(error);
      gallery.innerHTML = `<p>Error al cargar imágenes.</p>`;
      return;
    }

    if (!data.length) {
      gallery.innerHTML = `<p>No hay resultados.</p>`;
      return;
    }

    gallery.innerHTML = data
      .map(
        (img) => `
        <div class="bento-item">
          <img src="${img.url}" alt="${img.name || "Imagen"}" loading="lazy">
        </div>
      `
      )
      .join("");
  }

  // Carga inicial
  loadImages();

  // Escuchar cambios en buscador
  searchBar.addEventListener("input", (e) => {
    loadImages(e.target.value.trim());
  });
});
