const SUPABASE_URL = "https://illwxhdyndqkfvvzbasr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHd4aGR5bmRxa2Z2dnpiYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDE1OTMsImV4cCI6MjA3NDQ3NzU5M30.OJJ3TQgsdsCtIbv8DZZ7KZU2FJUjzh0FmeEWZ0Q_ZAs";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginBtn = document.getElementById("loginBtn");
const msgBox = document.getElementById("msgBox");

function showMessage(msg,type="info"){
  msgBox.textContent = msg;
  msgBox.style.color = type==="error" ? "red" : "green";
}

loginBtn.addEventListener("click", async (ev)=>{
  ev.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) throw error;
    showMessage("Login correcto, redirigiendo...","success");
    setTimeout(()=> window.location.href="profile.html", 1200);
  } catch(err){
    showMessage(err.message,"error");
  }
});
