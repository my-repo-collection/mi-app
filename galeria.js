// galeria.js
import { supabase } from "./config.js";
import { showToast } from "./utils.js";

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
    img.alt = filename || "Imagen";

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
      } catch {
        copyBtn.textContent = "Error";
      }
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
    try {
      let q = supabase.from("imagenes").select("id, url, name, user_id, created_at").order("created_at", { ascending: false }).limit(50);

      if (query) q = q.ilike("name", `%${query}%`);

      const { data, error } = await q;
      if (error) throw error;
      if (!data || !data.length) {
        gallery.innerHTML = `<p style="padding:20px; text-align:center;">No hay resultados.</p>`;
        return;
      }

      gallery.innerHTML = data.map(img => `
        <div class="bento-item" data-url="${img.url}" data-name="${(img.name||'').replace(/"/g,'')}">
          <img src="${img.url}" alt="${(img.name||'Imagen').replace(/"/g,'')}" loading="lazy">
          <div class="info"><h3>${img.name || 'Sin título'}</h3><p>📅 ${new Date(img.created_at).toLocaleDateString()}</p></div>
        </div>
      `).join("");

      // Attach click handlers
      gallery.querySelectorAll(".bento-item").forEach(el => {
        el.addEventListener("click", () => createLightbox(el.dataset.url, el.dataset.name));
      });
    } catch (err) {
      console.error(err);
      gallery.innerHTML = `<p style="color:red; padding:20px;">Error al cargar imágenes.</p>`;
      showToast("Error al cargar imágenes", "error");
    }
  }

  loadImages();

  searchBar.addEventListener("input", (e) => {
    loadImages(e.target.value.trim());
  });
});
