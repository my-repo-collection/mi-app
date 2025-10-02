// galeria.js
import { supabase } from "./config.js";
import { showToast } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("explore-gallery");
  const searchBar = document.getElementById("searchBar");

  function createLightbox(url, nombre = "") {
    if (document.getElementById("lightbox-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "lightbox-overlay";
    overlay.className = "lightbox-overlay";

    overlay.innerHTML = `
      <div class="lightbox-content">
        <img class="lightbox-img" src="${url}" alt="${nombre}">
        <div class="lightbox-actions">
          <a href="${url}" download class="lightbox-download">Descargar</a>
          <button id="copyUrlBtn">Copiar URL</button>
          <button id="closeLightbox">Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#closeLightbox").onclick = () => overlay.remove();
    overlay.querySelector("#copyUrlBtn").onclick = async () => {
      await navigator.clipboard.writeText(url);
      showToast("URL copiada ✅", "success");
    };
  }

  async function loadImages(query = "") {
    gallery.innerHTML = `<p>Cargando...</p>`;
    try {
      let q = supabase.from("imagenes")
        .select("id, url, name, titulo, created_at, fecha, descripcion, tema")
        .order("created_at", { ascending: false });

      if (query) q = q.ilike("name", `%${query}%`).ilike("titulo", `%${query}%`);

      const { data, error } = await q;
      if (error) throw error;

      if (!data || !data.length) {
        gallery.innerHTML = `<p>No hay resultados.</p>`;
        return;
      }

      gallery.innerHTML = data.map(img => {
        const nombre = img.name || img.titulo || "Sin título";
        const fecha = img.created_at || img.fecha;
        return `
          <div class="bento-item" data-url="${img.url}" data-name="${nombre}">
            <img src="${img.url}" alt="${nombre}" loading="lazy">
            <div class="info">
              <h3>${nombre}</h3>
              <p>${img.descripcion || ""}</p>
              <p>📅 ${fecha ? new Date(fecha).toLocaleDateString() : ""}</p>
            </div>
          </div>
        `;
      }).join("");

      gallery.querySelectorAll(".bento-item").forEach(el => {
        el.addEventListener("click", () => createLightbox(el.dataset.url, el.dataset.name));
      });
    } catch (err) {
      console.error(err);
      gallery.innerHTML = `<p style="color:red;">Error al cargar imágenes.</p>`;
      showToast("Error al cargar imágenes", "error");
    }
  }

  loadImages();
  searchBar.addEventListener("input", (e) => loadImages(e.target.value.trim()));
});
