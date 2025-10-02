// profile.js
import { supabase } from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  const avatarImg = document.getElementById("avatar");
  const userName = document.getElementById("user-name");
  const userBio = document.getElementById("user-bio");

  const editAvatarBtn = document.getElementById("editAvatarBtn");
  const editNameBtn = document.getElementById("editNameBtn");
  const editBioBtn = document.getElementById("editBioBtn");

  if (error || !user) {
    // No logueado → redirige a login o muestra modo visitante
    window.location.href = "login.html";
    return;
  }

  // ✅ Usuario autenticado → activa modo edición
  editAvatarBtn.style.display = "inline-block";
  editNameBtn.style.display = "inline-block";
  editBioBtn.style.display = "inline-block";

  // Cargar datos desde tu tabla "profiles"
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    avatarImg.src = profile.avatar_url || "default-avatar.png";
    userName.textContent = profile.full_name || user.email;
    userBio.textContent = profile.bio || "Escribe algo sobre ti...";
  }

  // --- Eventos de edición ---
  editNameBtn.addEventListener("click", async () => {
    const newName = prompt("Nuevo nombre:", profile?.full_name || "");
    if (newName) {
      await supabase.from("profiles").update({ full_name: newName }).eq("id", user.id);
      userName.textContent = newName;
    }
  });

  editBioBtn.addEventListener("click", async () => {
    const newBio = prompt("Nueva bio:", profile?.bio || "");
    if (newBio) {
      await supabase.from("profiles").update({ bio: newBio }).eq("id", user.id);
      userBio.textContent = newBio;
    }
  });

  editAvatarBtn.addEventListener("click", () => {
    document.getElementById("avatarUpload").click();
  });

  document.getElementById("avatarUpload").addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    if (file) {
      const filePath = `${user.id}/${file.name}`;
      let { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(filePath);
        await supabase.from("profiles").update({ avatar_url: publicUrl.publicUrl }).eq("id", user.id);
        avatarImg.src = publicUrl.publicUrl;
      }
    }
  });

  // Logout
  document.getElementById("logout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
});
