// --- CONFIG SUPABASE ---
const SUPABASE_URL = "https://illwxhdyndqkfvvzbasr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHd4aGR5bmRxa2Z2dnpiYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDE1OTMsImV4cCI6MjA3NDQ3NzU5M30.OJJ3TQgsdsCtIbv8DZZ7KZU2FJUjzh0FmeEWZ0Q_ZAs";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- ELEMENTOS DOM ---
const msgBox = document.getElementById("msgBox");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const userNameInput = document.getElementById("userNameInput");
const avatarImg = document.getElementById("avatarImg");
const avatarInput = document.getElementById("avatarInput");
const previewWrap = document.getElementById("previewWrap");
const previewImg = document.getElementById("previewImg");
const uploadBtn = document.getElementById("uploadBtn");
const saveNameBtn = document.getElementById("saveNameBtn");

// --- FUNCIONES ---
function showMessage(msg, type = "info") {
  let readableMsg = msg;

  if (msg.includes("Invalid login credentials")) {
    readableMsg = "Correo o contraseña incorrectos.";
  }
  if (msg.includes("already registered")) {
    readableMsg = "Este correo ya está registrado.";
  }

  msgBox.textContent = readableMsg;
  msgBox.style.color = type === "error" ? "red" : (type === "success" ? "green" : "black");
}

// --- CARGAR USUARIO ACTUAL ---
(async function loadUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    window.location.href = "login.html";
    return;
  }

  const user = data.user;
  userEmail.textContent = user.email;

  // Traer datos extra de la tabla usuarios
  const { data: profile, error: qErr } = await supabase
    .from("usuarios")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile) {
    if (profile.name) userNameInput.value = profile.name;
    if (profile.avatar_url) avatarImg.src = profile.avatar_url;
  }
})();

// --- LOGOUT ---
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

// --- PREVIEW DE IMAGEN ---
avatarInput.addEventListener("change", () => {
  const file = avatarInput.files[0];
  if (file) {
    // validar tipo
    if (!file.type.startsWith("image/")) {
      showMessage("Solo se permiten imágenes.", "error");
      avatarInput.value = "";
      return;
    }
    // validar tamaño
    if (file.size > 2 * 1024 * 1024) { // 2MB
      showMessage("La imagen no debe superar los 2MB.", "error");
      avatarInput.value = "";
      return;
    }

    // mostrar preview
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      previewWrap.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

// --- SUBIR AVATAR ---
uploadBtn.addEventListener("click", async () => {
  const file = avatarInput.files[0];
  if (!file) return showMessage("Selecciona una imagen primero.", "error");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const fileName = `avatar-${user.id}-${Date.now()}`;
  const { data, error } = await supabase.storage
    .from("avatars") // bucket "avatars"
    .upload(fileName, file);

  if (error) return showMessage("Error al subir avatar.", "error");

  const { data: { publicUrl } } = supabase
    .storage
    .from("avatars")
    .getPublicUrl(fileName);

  // actualizar tabla usuarios
  const { error: updateErr } = await supabase
    .from("usuarios")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateErr) return showMessage("Error guardando avatar en BD.", "error");

  avatarImg.src = publicUrl;
  previewWrap.style.display = "none";
  showMessage("✅ Avatar actualizado.", "success");
});

// --- GUARDAR NOMBRE ---
saveNameBtn.addEventListener("click", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const newName = userNameInput.value.trim();
  if (!newName) return showMessage("El nombre no puede estar vacío.", "error");

  const { error } = await supabase
    .from("usuarios")
    .update({ name: newName })
    .eq("id", user.id);

  if (error) return showMessage("Error al guardar nombre.", "error");

  showMessage("✅ Nombre actualizado.", "success");
});
