// Inicializar Supabase
const supabaseUrl = "https://illwxhdyndqkfvvzbasr.supabase.co"; // ✅ tu URL real
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHd4aGR5bmRxa2Z2dnpiYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDE1OTMsImV4cCI6MjA3NDQ3NzU5M30.OJJ3TQgsdsCtIbv8DZZ7KZU2FJUjzh0FmeEWZ0Q_ZAs"; // ✅ tu anon key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Cargar datos de usuario
async function loadProfile() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userEmail").innerText = user.email;

  // Buscar en tabla "usuarios"
  let { data, error: userError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", user.email)
    .single();

  if (userError) {
    console.error("Error cargando datos:", userError.message);
    return;
  }

  if (data) {
    document.getElementById("userName").innerText = data.name || "Sin nombre";
    if (data.avatar_url) {
      document.getElementById("avatarImg").src = data.avatar_url;
    }
  }
}

// Subir avatar
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const file = document.getElementById("avatarInput").files[0];
  if (!file) return alert("Selecciona un archivo primero.");

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return alert("Debes iniciar sesión primero.");

  const filePath = `${user.id}/${file.name}`;

  let { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return alert("Error al subir avatar: " + uploadError.message);

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Guardar URL en tabla usuarios
  await supabase
    .from("usuarios")
    .update({ avatar_url: publicUrl.publicUrl })
    .eq("email", user.email);

  document.getElementById("avatarImg").src = publicUrl.publicUrl;
  alert("Avatar actualizado!");
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// Al cargar página
loadProfile();
