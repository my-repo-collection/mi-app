import { supabase } from "./config.js";

// Verificar sesión
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  window.location.href = "login.html";
}

// Subida de imagen
document.getElementById("upload-image-btn").addEventListener("click", () => {
  document.getElementById("image-input").click();
});

document.getElementById("image-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = `img-${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("imagenes")
    .upload(fileName, file);

  if (uploadError) {
    alert("Error subiendo imagen");
    return;
  }

  const { data: signedData } = await supabase.storage
    .from("imagenes")
    .createSignedUrl(fileName, 3600);

  await supabase.from("imagenes").insert({
    user_id: user.id,
    url: signedData.signedUrl,
    name: file.name
  });

  loadImages();
});

// Mostrar imágenes
async function loadImages() {
  const { data, error } = await supabase
    .from("imagenes")
    .select("url, name")
    .eq("user_id", user.id);

  const galeria = document.getElementById("galeria-list");
  galeria.innerHTML = "";

  if (data && data.length > 0) {
    data.forEach(img => {
      const imgEl = document.createElement("img");
      imgEl.src = img.url;
      imgEl.alt = img.name;
      galeria.appendChild(imgEl);
    });
  } else {
    galeria.innerHTML = "<p>No has subido imágenes todavía.</p>";
  }
}

loadImages();

// Logout
document.getElementById("logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});
