// --- CONFIG: pega tus credenciales aquí ---
const SUPABASE_URL = "https://illwxhdyndqkfvvzbasr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHd4aGR5bmRxa2Z2dnpiYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDE1OTMsImV4cCI6MjA3NDQ3NzU5M30.OJJ3TQgsdsCtIbv8DZZ7KZU2FJUjzh0FmeEWZ0Q_ZAs";
// ------------------------------------------
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const msgBox = document.getElementById("msgBox");

function showMessage(msg, type = "info", timeout = 6000){
  msgBox.innerText = msg;
  msgBox.className = "msgBox " + (type === "error" ? "error" : type === "success" ? "success" : "info");
  if(timeout){
    setTimeout(()=>{ msgBox.innerText = ""; msgBox.className = "msgBox"; }, timeout);
  }
}

function validateEmail(email){
  return /\S+@\S+\.\S+/.test(email);
}

/* Registro */
registerBtn.addEventListener("click", async (ev) => {
  ev.preventDefault();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  if(!validateEmail(email)) return showMessage("Ingresa un email válido.", "error");
  if(password.length < 6) return showMessage("La contraseña debe tener al menos 6 caracteres.", "error");

  registerBtn.disabled = true;
  showMessage("Registrando... revisa tu correo para confirmar.", "info", 8000);

  try{
    // El emailRedirectTo ayuda a que, cuando confirmen, se redirija a profile.html
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    }, { emailRedirectTo: window.location.origin + "/profile.html" });

    if(error) throw error;
    showMessage("✅ Registro OK. Revisa tu email y confirma la cuenta.", "success", 10000);
  }catch(err){
    console.error(err);
    showMessage(err?.message || "Error al registrar.", "error", 8000);
  }finally{
    registerBtn.disabled = false;
  }
});

/* Login */
loginBtn.addEventListener("click", async (ev) => {
  ev.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if(!validateEmail(email)) return showMessage("Ingresa un email válido.", "error");
  if(password.length < 6) return showMessage("La contraseña debe tener al menos 6 caracteres.", "error");

  loginBtn.disabled = true;
  showMessage("Iniciando sesión...", "info");

  try{
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) throw error;

    const user = data.user;
    if(!user) {
      // Puede suceder si la cuenta no está confirmada
      showMessage("No se pudo iniciar sesión. ¿Has confirmado tu email?", "error");
      loginBtn.disabled = false;
      return;
    }

    // Asegurar que exista la fila en la tabla "usuarios" (consistencia)
    await ensureUserRow(user);

    showMessage("Login correcto. Redirigiendo...", "success", 1500);
    setTimeout(()=> window.location.href = "profile.html", 900);
  }catch(err){
    console.error(err);
    showMessage(err?.message || "Error al iniciar sesión.", "error", 6000);
    loginBtn.disabled = false;
  }
});

/* Si el usuario llega directamente con sesión ya activa, redirigir al perfil */
(async function autoRedirectIfLogged(){
  try{
    const { data } = await supabase.auth.getUser();
    if(data?.user){
      // Ya hay sesión, ir al perfil
      // no forzamos la redirección inmediata para no molestar en testing; solo si estás en login
      // window.location.href = "profile.html";
    }
  }catch(e){ console.warn(e); }
})();

/* Helper: crea fila en usuarios si no existe */
async function ensureUserRow(user){
  if(!user?.id) return;
  try{
    const { data: existing, error: qErr } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", user.id)
      .single();

    if(existing && existing.id) return; // ya existe

    // Insertar nueva fila
    const { error: insErr } = await supabase
      .from("usuarios")
      .insert([{ id: user.id, email: user.email, name: "", avatar_url: "" }]);

    if(insErr) {
      console.error("Error insert usuarios:", insErr);
      // No mostrar al usuario detalle de DB, solo aviso sutil
    }
  }catch(err){
    // si single() falla al no encontrar, entra aquí; intentamos insertar igualmente
    try{
      await supabase.from("usuarios").insert([{ id: user.id, email: user.email, name: "", avatar_url: "" }]);
    }catch(e){
      console.error(e);
    }
  }
}
