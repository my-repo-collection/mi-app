const SUPABASE_URL = "https://illwxhdyndqkfvvzbasr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHd4aGR5bmRxa2Z2dnpiYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDE1OTMsImV4cCI6MjA3NDQ3NzU5M30.OJJ3TQgsdsCtIbv8DZZ7KZU2FJUjzh0FmeEWZ0Q_ZAs";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const registerBtn = document.getElementById("registerBtn");
const msgBox = document.getElementById("msgBox");
const modal = document.getElementById("successModal");
const goLoginBtn = document.getElementById("goLoginBtn");

function showMessage(msg,type="info"){
  msgBox.textContent = msg;
  msgBox.style.color = type==="error" ? "red" : "green";
}
function validateEmail(email){ return /\S+@\S+\.\S+/.test(email); }

registerBtn.addEventListener("click", async (ev)=>{
  ev.preventDefault();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  if(!validateEmail(email)) return showMessage("Email inválido","error");
  if(password.length < 6) return showMessage("Contraseña demasiado corta","error");

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if(error) throw error;
    await supabase.from("usuarios").insert([{ id: data.user.id, email, name:"", avatar_url:"" }]);
    modal.style.display = "flex";
  } catch(err){
    showMessage(err.message,"error");
  }
});
goLoginBtn.addEventListener("click", ()=>{ window.location.href="login.html"; });
