// galeria.js
import { supabase } from "./config.js";

const uploadBtn = document.getElementById("upload-image-btn");
const fileInput = document.getElementById("image-input");
const gallery = document.getElementById("galeria-list");
const logoutBtn = document.getElementById("logout");

// Verificar sesión
const { data: { user } } = await supabase.auth.getUser();
if (!user) window.location.href = "login.html";

// Logout
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

// Cargar imágenes desde Supabase
async function loadImages() {
  const { data, error } = await supabase
    .from("imagenes")
    .select("url, name")
    .eq("user_id", user.id)
    .order("id", { ascending: false });

  gallery.innerHTML = "";

  if (error) {
    console.error("Error al cargar imágenes:", error.message);
    gallery.innerHTML = "<p>Error al cargar imágenes.</p>";
    return;
  }

  if (!data || data.length === 0) {
    gallery.innerHTML = "<p style='text-align:center; color:#666;'>No has subido imágenes aún.</p>";
    return;
  }

  data.forEach(img => {
    const el = document.createElement("img");
    el.src = img.url;
    el.alt = img.name;
    gallery.appendChild(el);
  });
}

// Subir nueva imagen
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = `img-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("imagenes")
    .upload(fileName, file);

  if (uploadError) {
    alert("Error al subir imagen: " + uploadError.message);
    return;
  }

  const { data: signedData } = await supabase.storage
    .from("imagenes")
    .createSignedUrl(fileName, 3600);

  if (!signedData?.signedUrl) {
    alert("Error al obtener URL de la imagen");
    return;
  }

  await supabase.from("imagenes").insert({
    user_id: user.id,
    url: signedData.signedUrl,
    name: file.name
  });

  loadImages();
});

// Inicializar
loadImages();
