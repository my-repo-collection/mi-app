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
    const item = document.createElement("div");
    item.className = "bento-item";
    item.innerHTML = `
      <img src="${img.url}" alt="${(img.name || 'Imagen').replace(/"/g,'')}" loading="lazy">
      <div class="info">
        <h3>${img.name || "Imagen sin título"}</h3>
        <p>📅 ${new Date(img.created_at).toLocaleDateString()}</p>
      </div>
    `;

    item.addEventListener("click", () => {
      // lightbox
      const overlay = document.createElement("div");
      overlay.className = "lightbox-overlay";
      overlay.innerHTML = `
        <div class="lightbox-content">
          <img class="lightbox-img" src="${img.url}" alt="${img.name || ''}">
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
  // skeletons
  for (let i = 0; i < 6; i++) {
    const sk = document.createElement("div");
    sk.className = "skeleton";
    sk.style.height = "200px";
    galleryEl.appendChild(sk);
  }

  try {
    const { data, error } = await supabase
      .from("imagenes")
      .select("id, url, name, created_at")
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
