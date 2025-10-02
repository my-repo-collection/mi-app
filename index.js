import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const gallery = document.getElementById("imagenes-list");

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

      gallery.innerHTML = data.map(
        img => `<div class="bento-item"><img src="${img.url}" alt="${img.name || "Imagen"}"></div>`
      ).join("");
    } catch (err) {
      console.error(err);
      gallery.innerHTML = `<p>Error cargando imágenes.</p>`;
    }
  }

  loadPublicImages();

  supabase
    .channel("imagenes-changes")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "imagenes" }, (payload) => {
      const img = payload.new;
      const el = document.createElement("div");
      el.className = "bento-item";
      el.innerHTML = `<img src="${img.url}" alt="${img.name || "Imagen"}">`;
      gallery.prepend(el);
    })
    .subscribe();
});
