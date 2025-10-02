// index.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("imagenes-list");

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

  function showSkeletons(count = 6) {
    gallery.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const skel = document.createElement("div");
      skel.className = "skeleton";
      skel.style.height = "180px";
      gallery.appendChild(skel);
    }
  }

  async function loadPublicImages() {
    showSkeletons();
    try {
      const { data, error } = await supabase
        .from("imagenes")
        .select("id, url, name, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      if (!data.length) {
        gallery.innerHTML = `<p>No hay imágenes aún.</p>`;
        return;
      }

      gallery.innerHTML = data.map(img => `
        <div class="bento-item" data-url="${img.url}" data-name="${(img.name||'').replace(/"/g,'')}">
          <img src="${img.url}" alt="${img.name || "Imagen"}" loading="lazy">
        </div>
      `).join("");

      // attach
      gallery.querySelectorAll(".bento-item").forEach(el => {
        el.addEventListener("click", () => createLightbox(el.dataset.url, el.dataset.name));
      });

    } catch (err) {
      console.error(err);
      gallery.innerHTML = `<p>Error cargando imágenes.</p>`;
    }
  }

  loadPublicImages();

  // realtime new images
  supabase
    .channel("imagenes-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "imagenes" },
      (payload) => {
        const img = payload.new;
        const el = document.createElement("div");
        el.className = "bento-item";
        el.innerHTML = `<img src="${img.url}" alt="${img.name || "Imagen"}" loading="lazy">`;
        el.addEventListener("click", () => createLightbox(img.url, img.name || ""));
        gallery.prepend(el);
      }
    )
    .subscribe();
});
