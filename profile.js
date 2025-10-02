import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userId = user.id;

  // Elementos
  const avatarEl = document.getElementById("avatar");
  const avatarInput = document.getElementById("avatarInput");
  const editAvatarBtn = document.getElementById("editAvatarBtn");

  const nameEl = document.getElementById("userName");
  const nameInput = document.getElementById("nameInput");
  const editNameBtn = document.getElementById("editNameBtn");
  const saveNameBtn = document.getElementById("saveNameBtn");

  const bioEl = document.getElementById("userBio");
  const bioInput = document.getElementById("bioInput");
  const editBioBtn = document.getElementById("editBioBtn");
  const saveBioBtn = document.getElementById("saveBioBtn");

  const gallery = document.getElementById("profileGallery");
  const uploadBtn = document.getElementById("uploadImageBtn");
  const imageInput = document.getElementById("imageInput");

  const logoutBtn = document.getElementById("logout");

  // 📌 Cargar perfil
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("name, bio, avatar_url")
    .eq("id", userId)
    .single();

  if (perfil) {
    nameEl.textContent = perfil.name || "Usuario sin nombre";
    bioEl.textContent = perfil.bio || "Este usuario aún no escribió nada.";
    if (perfil.avatar_url) avatarEl.src = perfil.avatar_url;
  }

  // 🖼️ Cambiar avatar
  editAvatarBtn.addEventListener("click", () => avatarInput.click());

  avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files[0];
    if (!file) return;

    const fileName = `avatar-${userId}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      return;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    avatarEl.src = avatarUrl;
    await supabase.from("usuarios").update({ avatar_url: avatarUrl }).eq("id", userId);
  });

  // ✏️ Editar nombre
  editNameBtn.addEventListener("click", () => {
    nameInput.value = nameEl.textContent;
    nameEl.style.display = "none";
    nameInput.style.display = "block";
    saveNameBtn.style.display = "inline-block";
  });

  saveNameBtn.addEventListener("click", async () => {
    await supabase.from("usuarios").update({ name: nameInput.value }).eq("id", userId);
    nameEl.textContent = nameInput.value;
    nameEl.style.display = "block";
    nameInput.style.display = "none";
    saveNameBtn.style.display = "none";
  });

  // 📝 Editar bio
  editBioBtn.addEventListener("click", () => {
    bioInput.value = bioEl.textContent;
    bioEl.style.display = "none";
    bioInput.style.display = "block";
    saveBioBtn.style.display = "inline-block";
  });

  saveBioBtn.addEventListener("click", async () => {
    await supabase.from("usuarios").update({ bio: bioInput.value }).eq("id", userId);
    bioEl.textContent = bioInput.value;
    bioEl.style.display = "block";
    bioInput.style.display = "none";
    saveBioBtn.style.display = "none";
  });

  // 📤 Subir imágenes a galería personal
  uploadBtn.addEventListener("click", () => imageInput.click());

  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `img-${userId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("imagenes")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      return;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from("imagenes")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("imagenes").insert({
      user_id: userId,
      url: publicUrlData.publicUrl,
      name: file.name,
    });

    if (insertError) {
      console.error(insertError);
    }

    loadImages();
  });

  // 🖼️ Cargar imágenes del perfil
  async function loadImages() {
    const { data } = await supabase
      .from("imagenes")
      .select("url, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    gallery.innerHTML = "";
    if (data && data.length > 0) {
      data.forEach((img) => {
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

  // 🚪 Logout
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
});
