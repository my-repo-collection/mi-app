// index.js
import { supabase } from "./config.js";
import { showToast } from "./utils.js";

const galleryEl = document.getElementById("imagenes-list");

function renderGallery(imagenes) {
  galleryEl.innerHTML = "";

  if (!imagenes || imagenes.length === 0) {
    galleryEl.innerHTML = `<p style="text-align:center; color:#666;">No hay imágenes disponibles aún 📭</p>`;
    return;
  }

  imagenes.forEach(img => {
    const nombre = img.name || img.titulo || "Imagen sin título";
    const fecha = img.created_at || img.fecha;

    const item = document.createElement("div");
    item.className = "bento-item";
    item.innerHTML = `
      <img src="${img.url}" alt="${nombre.replace(/"/g,'')}" loading="lazy">
      <div class="info">
        <h3>${nombre}</h3>
        <p>📅 ${fecha ? new Date(fecha).toLocaleDateString() : ""}</p>
      </div>
    `;

    item.addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.className = "lightbox-overlay";
      overlay.innerHTML = `
        <div class="lightbox-content">
          <img class="lightbox-img" src="${img.url}" alt="${nombre}">
          <div class="lightbox-actions">
            <a class="lightbox-download" href="${img.url}" download>⬇ Descargar</a>
            <button id="closeLightbox">Cerrar ✖</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector("#closeLightbox").addEventListener("click", () => overlay.remove());
    });

    galleryEl.appendChild(item);
  });
}

async function loadImages() {
  galleryEl.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const sk = document.createElement("div");
    sk.className = "skeleton";
    sk.style.height = "200px";
    galleryEl.appendChild(sk);
  }

  try {
    const { data, error } = await supabase
      .from("imagenes")
      .select("id, url, name, titulo, created_at, fecha")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) throw error;
    renderGallery(data || []);
  } catch (err) {
    console.error("Error cargando imágenes:", err);
    galleryEl.innerHTML = `<p style="color:red; text-align:center;">❌ Error cargando imágenes</p>`;
    showToast("Error cargando imágenes", "error");
  }
}

loadImages();
