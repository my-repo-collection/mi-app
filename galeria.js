// galeria.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("explore-gallery");
  const searchBar = document.getElementById("searchBar");

  function createLightbox(url, filename = "") {
    if (document.getElementById("lightbox-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "lightbox-overlay";
    overlay.className = "lightbox-overlay";

    const content = document.createElement("div");
    content.className = "lightbox-content";

    const img = document.createElement("img");
    img.className = "lightbox-img";
    img.src = url;

    const actions = document.createElement("div");
    actions.className = "lightbox-actions";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Cerrar";
    closeBtn.onclick = () => overlay.remove();

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copiar URL";
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = "Copiado ✓";
        setTimeout(() => (copyBtn.textContent = "Copiar URL"), 1500);
      } catch { copyBtn.textContent = "Error"; }
    };

    const downloadLink = document.createElement("a");
    downloadLink.textContent = "Descargar";
    downloadLink.href = url;
    downloadLink.download = filename || "";
    downloadLink.className = "lightbox-download";

    actions.appendChild(downloadLink);
    actions.appendChild(copyBtn);
    actions.appendChild(closeBtn);

    content.appendChild(img);
    content.appendChild(actions);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
  }

  function showSkeletons(count = 12) {
    gallery.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const sk = document.createElement("div");
      sk.className = "skeleton";
      sk.style.height = "180px";
      gallery.appendChild(sk);
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
      console.error(error);
      gallery.innerHTML = `<p>Error al cargar imágenes.</p>`;
      return;
    }
    if (!data.length) {
      gallery.innerHTML = `<p>No hay resultados.</p>`;
      return;
    }

    gallery.innerHTML = data.map(img => `
      <div class="bento-item" data-url="${img.url}" data-name="${(img.name||'').replace(/"/g,'') }">
        <img src="${img.url}" alt="${img.name || "Imagen"}" loading="lazy">
      </div>
    `).join("");

    // Attach click handlers
    gallery.querySelectorAll(".bento-item").forEach(el => {
      el.addEventListener("click", () => createLightbox(el.dataset.url, el.dataset.name));
    });
  }

  loadImages();

  searchBar.addEventListener("input", (e) => {
    loadImages(e.target.value.trim());
  });
});
