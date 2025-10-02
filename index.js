// index.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🚀 Conecta a tu proyecto Supabase
const SUPABASE_URL = "https://TU-PROJECT.supabase.co"; // cambia esto
const SUPABASE_KEY = "TU-API-KEY"; // cambia esto (anon key)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Contenedor de la galería
const galleryEl = document.getElementById("imagenes-list");

/**
 * Renderiza la galería Bento
 */
function renderGallery(imagenes) {
  galleryEl.innerHTML = "";

  if (!imagenes || imagenes.length === 0) {
    galleryEl.innerHTML = `<p style="text-align:center; color:#666;">No hay imágenes disponibles aún 📭</p>`;
    return;
  }

  imagenes.forEach(img => {
    const item = document.createElement("div");
    item.className = "bento-item";

    // URL pública del archivo
    const url = supabase.storage.from("imagenes").getPublicUrl(img.name).data.publicUrl;

    item.innerHTML = `
      <img src="${url}" alt="${img.name}">
      <div class="info">
        <h3>${img.metadata?.title || "Imagen sin título"}</h3>
        <p>📅 ${new Date(img.created_at).toLocaleDateString()}</p>
      </div>
    `;

    // opcional: abrir en lightbox al hacer clic
    item.addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "lightbox-overlay";
      overlay.innerHTML = `
        <div class="lightbox-content">
          <img class="lightbox-img" src="${url}" alt="${img.name}">
          <div class="lightbox-actions">
            <a class="lightbox-download" href="${url}" download>⬇ Descargar</a>
            <button onclick="this.closest('.lightbox-overlay').remove()">Cerrar ✖</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    });

    galleryEl.appendChild(item);
  });
}

/**
 * Obtiene las últimas imágenes desde Supabase
 */
async function loadImages() {
  try {
    const { data, error } = await supabase.storage.from("imagenes").list("", {
      limit: 6,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" }
    });

    if (error) throw error;

    renderGallery(data);
  } catch (err) {
    console.error("Error cargando imágenes:", err.message);
    galleryEl.innerHTML = `<p style="color:red; text-align:center;">❌ Error cargando imágenes</p>`;
  }
}

// 🚀 Llama a la carga al iniciar
loadImages();
