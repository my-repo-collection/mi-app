import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("explore-gallery");
  const searchBar = document.getElementById("searchBar");

  function showSkeletons(count = 12) {
    gallery.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const skel = document.createElement("div");
      skel.className = "skeleton";
      skel.style.height = "180px";
      gallery.appendChild(skel);
    }
  }

  async function loadImages(query = "") {
    showSkeletons();
    let req = supabase.from("imagenes")
      .select("id, url, name, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (query) req = req.ilike("name", `%${query}%`);

    const { data, error } = await req;
    if (error) {
      gallery.innerHTML = `<p>Error al cargar imágenes.</p>`;
      return;
    }
    if (!data.length) {
      gallery.innerHTML = `<p>No hay resultados.</p>`;
      return;
    }

    gallery.innerHTML = data.map(
      img => `<div class="bento-item"><img src="${img.url}" alt="${img.name || "Imagen"}"></div>`
    ).join("");
  }

  loadImages();
  searchBar.addEventListener("input", e => loadImages(e.target.value.trim()));
});
