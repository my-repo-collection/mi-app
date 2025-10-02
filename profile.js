import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const userId = user.id;

  // Elementos del DOM
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
  const imageTitle = document.getElementById("imageTitle");
  const imageTema = document.getElementById("imageTema");

  const logoutBtn = document.getElementById("logout");

  // Cargar perfil
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

  // Cambiar avatar
  editAvatarBtn.addEventListener("click", () => avatarInput.click());

  avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files[0];
    if (!file) return;

    const fileName = `avatar-${userId}.${file.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (!uploadError) {
      const { data: publicUrlData } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = publicUrlData.publicUrl;
      avatarEl.src = avatarUrl;

      await supabase.from("usuarios").update({ avatar_url: avatarUrl }).eq("id", userId);
    }
  });

  // Editar nombre
  editNameBtn.addEventListener("click", () => toggleField(nameEl, nameInput, saveNameBtn, true));
  saveNameBtn.addEventListener("click", async () => {
    await supabase.from("usuarios").update({ name: nameInput.value }).eq("id", userId);
    nameEl.textContent = nameInput.value;
    toggleField(nameEl, nameInput, saveNameBtn, false);
  });

  // Editar bio
  editBioBtn.addEventListener("click", () => toggleField(bioEl, bioInput, saveBioBtn, true));
  saveBioBtn.addEventListener("click", async () => {
    await supabase.from("usuarios").update({ bio: bioInput.value }).eq("id", userId);
    bioEl.textContent = bioInput.value;
    toggleField(bioEl, bioInput, saveBioBtn, false);
  });

  function toggleField(textEl, inputEl, btnEl, editMode) {
    if (editMode) {
      inputEl.value = textEl.textContent;
    }
    textEl.style.display = editMode ? "none" : "block";
    inputEl.style.display = editMode ? "block" : "none";
    btnEl.style.display = editMode ? "inline-block" : "none";
  }

  // Subir imágenes
  uploadBtn.addEventListener("click", () => imageInput.click());

  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `img-${userId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("imagenes")
      .upload(fileName, file);

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from("imagenes")
        .getPublicUrl(fileName);

      await supabase.from("imagenes").insert({
        user_id: userId,
        url: publicUrlData.publicUrl,
        name: imageTitle.value || file.name,
        tema: imageTema.value || null
      });

      imageTitle.value = "";
      imageTema.value = "";
      loadImages();
    }
  });

  // Cargar galería
  async function loadImages() {
    const { data } = await supabase
      .from("imagenes")
      .select("id, url, name, tema")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    gallery.innerHTML = "";
    if (data && data.length > 0) {
      data.forEach((img) => {
        const wrapper = document.createElement("div");
        wrapper.className = "bento-item";
        wrapper.innerHTML = `
          <img src="${img.url}" alt="${img.name}">
          <p>${img.name || "Sin título"} ${img.tema ? `· ${img.tema}` : ""}</p>
          <button class="btn small reupload" data-id="${img.id}">Resubir</button>
          <button class="btn small btn-danger delete" data-id="${img.id}">Borrar</button>
        `;
        gallery.appendChild(wrapper);
      });
    } else {
      gallery.innerHTML = "<p>No hay imágenes en este perfil.</p>";
    }
  }

  gallery.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("delete")) {
      await supabase.from("imagenes").delete().eq("id", id);
      loadImages();
    }

    if (e.target.classList.contains("reupload")) {
      imageInput.click();
      imageInput.onchange = async () => {
        const file = imageInput.files[0];
        if (!file) return;

        const fileName = `img-${userId}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("imagenes")
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("imagenes")
            .getPublicUrl(fileName);

          await supabase.from("imagenes").update({
            url: publicUrlData.publicUrl,
            name: file.name
          }).eq("id", id);

          loadImages();
        }
      };
    }
  });

  loadImages();

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
});
