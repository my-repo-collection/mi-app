import { supabase } from "./config.js";

// Detectar si estamos viendo nuestro perfil o el de otro
const urlParams = new URLSearchParams(window.location.search);
const viewedUserId = urlParams.get("user");

const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  window.location.href = "login.html";
}

const isOwner = !viewedUserId || viewedUserId === user.id;
const userId = viewedUserId || user.id;

// Ocultar botones de edición si no es dueño
if (!isOwner) {
  document.querySelectorAll(".icon-btn").forEach(btn => btn.style.display = "none");
  document.getElementById("logout").style.display = "none";
}

// Cargar perfil
const { data: perfil, error } = await supabase
  .from("usuarios")
  .select("name, bio, avatar_url")
  .eq("id", userId)
  .single();

if (perfil) {
  document.getElementById("user-name").textContent = perfil.name || user.email;
  document.getElementById("user-bio").textContent = perfil.bio || "Este usuario aún no escribió nada.";
  if (perfil.avatar_url) {
    document.getElementById("avatar").src = perfil.avatar_url;
  }
}

// --- Cambiar Avatar ---
if (isOwner) {
  document.getElementById("change-avatar").addEventListener("click", () => {
    document.getElementById("avatar-input").click();
  });

  document.getElementById("avatar-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `avatar-${user.id}.${file.name.split(".").pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      alert("Error subiendo avatar");
      return;
    }

    const { data: signedData } = await supabase.storage
      .from("avatars")
      .createSignedUrl(fileName, 3600);

    const avatarUrl = signedData?.signedUrl;
    document.getElementById("avatar").src = avatarUrl;

    await supabase.from("usuarios").update({ avatar_url: avatarUrl }).eq("id", user.id);
  });
}

// --- Cambiar Nombre ---
if (isOwner) {
  const nameInput = document.getElementById("name-input");
  const nameEl = document.getElementById("user-name");

  document.getElementById("edit-name").addEventListener("click", async () => {
    nameInput.classList.toggle("hidden");
    if (!nameInput.classList.contains("hidden")) {
      nameInput.value = nameEl.textContent;
      nameInput.focus();
      nameInput.addEventListener("blur", async () => {
        await supabase.from("usuarios").update({ name: nameInput.value }).eq("id", user.id);
        nameEl.textContent = nameInput.value;
        nameInput.classList.add("hidden");
      });
    }
  });
}

// --- Cambiar Bio ---
if (isOwner) {
  const bioInput = document.getElementById("bio-input");
  const bioEl = document.getElementById("user-bio");

  document.getElementById("edit-bio").addEventListener("click", async () => {
    bioInput.classList.toggle("hidden");
    if (!bioInput.classList.contains("hidden")) {
      bioInput.value = bioEl.textContent;
      bioInput.focus();
      bioInput.addEventListener("blur", async () => {
        await supabase.from("usuarios").update({ bio: bioInput.value }).eq("id", user.id);
        bioEl.textContent = bioInput.value;
        bioInput.classList.add("hidden");
      });
    }
  });
}

// --- Logout ---
if (isOwner) {
  document.getElementById("logout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
}
