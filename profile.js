import { supabase } from "./config.js";

const urlParams = new URLSearchParams(window.location.search);
const viewedUserId = urlParams.get("user");

const { data: { user } } = await supabase.auth.getUser();
if (!user) window.location.href = "login.html";

const isOwner = !viewedUserId || viewedUserId === user.id;
const userId = viewedUserId || user.id;

// Ocultar edición si no es dueño
if (!isOwner) {
  document.querySelectorAll(".icon-btn, .btn.small, #upload-image-btn").forEach(el => el.style.display = "none");
  document.getElementById("logout").style.display = "none";
}

// Cargar perfil
const { data: perfil } = await supabase.from("usuarios").select("name, bio, avatar_url").eq("id", userId).single();

if (perfil) {
  document.getElementById("user-name").textContent = perfil.name || user.email;
  document.getElementById("user-bio").textContent = perfil.bio || "Este usuario aún no escribió nada.";
  if (perfil.avatar_url) document.getElementById("avatar").src = perfil.avatar_url;
}

// ------------------- Avatar -------------------
if (isOwner) {
  const avatarInput = document.getElementById("avatar-input");
  document.getElementById("change-avatar").addEventListener("click", () => avatarInput.click());
  
  avatarInput.addEventListener("change", () => {
    document.getElementById("save-avatar").classList.remove("hidden");
  });

  document.getElementById("save-avatar").addEventListener("click", async () => {
    const file = avatarInput.files[0];
    if (!file) return;

    const fileName = `avatar-${user.id}.${file.name.split(".").pop()}`;
    await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });

    const { data: signedData } = await supabase.storage.from("avatars").createSignedUrl(fileName, 3600);
    const avatarUrl = signedData?.signedUrl;

    document.getElementById("avatar").src = avatarUrl;
    await supabase.from("usuarios").update({ avatar_url: avatarUrl }).eq("id", user.id);

    document.getElementById("save-avatar").classList.add("hidden");
  });
}

// ------------------- Nombre -------------------
if (isOwner) {
  const nameEl = document.getElementById("user-name");
  const nameInput = document.getElementById("name-input");

  document.getElementById("edit-name").addEventListener("click", () => {
    nameInput.value = nameEl.textContent;
    nameInput.classList.remove("hidden");
    nameEl.classList.add("hidden");
    document.getElementById("save-name").classList.remove("hidden");
  });

  document.getElementById("save-name").addEventListener("click", async () => {
    await supabase.from("usuarios").update({ name: nameInput.value }).eq("id", user.id);
    nameEl.textContent = nameInput.value;
    nameEl.classList.remove("hidden");
    nameInput.classList.add("hidden");
    document.getElementById("save-name").classList.add("hidden");
  });
}

// ------------------- Bio -------------------
if (isOwner) {
  const bioEl = document.getElementById("user-bio");
  const bioInput = document.getElementById("bio-input");

  document.getElementById("edit-bio").addEventListener("click", () => {
    bioInput.value = bioEl.textContent;
    bioInput.classList.remove("hidden");
    bioEl.classList.add("hidden");
    document.getElementById("save-bio").classList.remove("hidden");
  });

  document.getElementById("save-bio").addEventListener("click", async () => {
    await supabase.from("usuarios").update({ bio: bioInput.value }).eq("id", user.id);
    bioEl.textContent = bioInput.value;
    bioEl.classList.remove("hidden");
    bioInput.classList.add("hidden");
    document.getElementById("save-bio").classList.add("hidden");
  });
}

// ------------------- Galería en perfil -------------------
async function loadImages() {
  const { data } = await supabase.from("imagenes").select("url, name").eq("user_id", userId);

  const gallery = document.getElementById("profile-gallery");
  gallery.innerHTML = "";

  if (data && data.length > 0) {
    data.forEach(img => {
      const el = document.createElement("img");
      el.src = img.url;
      el.alt = img.name;
      gallery.appendChild(el);
    });
  } else {
    gallery.innerHTML = "<p>No hay imágenes en este perfil.</p>";
  }
}
loadImages();

if (isOwner) {
  const input = document.getElementById("image-input");
  document.getElementById("upload-image-btn").addEventListener("click", () => input.click());

  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `img-${Date.now()}-${file.name}`;
    await supabase.storage.from("imagenes").upload(fileName, file);

    const { data: signedData } = await supabase.storage.from("imagenes").createSignedUrl(fileName, 3600);

    await supabase.from("imagenes").insert({ user_id: user.id, url: signedData.signedUrl, name: file.name });
    loadImages();
  });
}

// ------------------- Logout -------------------
if (isOwner) {
  document.getElementById("logout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
}


if (!isOwner) {
  // ocultar botones de edición
  document.querySelectorAll(".icon-btn, .btn.small, #upload-image-btn, #avatar-input, #image-input").forEach(el => el.style.display = "none");

  // ocultar logout (no tiene sentido en perfil ajeno)
  document.getElementById("logout").style.display = "none";

  // marcar el perfil como público
  document.getElementById("profile-card").classList.add("public-mode");
}
