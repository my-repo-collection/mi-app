const SUPABASE_URL = "https://illwxhdyndqkfvvzbasr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHd4aGR5bmRxa2Z2dnpiYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDE1OTMsImV4cCI6MjA3NDQ3NzU5M30.OJJ3TQgsdsCtIbv8DZZ7KZU2FJUjzh0FmeEWZ0Q_ZAs";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const avatarImg = document.getElementById("avatarImg");
const previewImg = document.getElementById("previewImg");
const previewWrap = document.getElementById("previewWrap");
const avatarInput = document.getElementById("avatarInput");
const uploadBtn = document.getElementById("uploadBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmailSpan = document.getElementById("userEmail");
const userNameInput = document.getElementById("userNameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const msgBox = document.querySelector("#msgBox");

function showMessage(msg, type="info"){
  msgBox.textContent = msg;
  msgBox.style.color = type==="error" ? "red" : "green";
}

async function loadProfile(){
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if(!user){ window.location.href="login.html"; return; }

  userEmailSpan.innerText = user.email;

  const { data: row } = await supabase.from("usuarios").select("*").eq("id", user.id).maybeSingle();
  if(row){
    userNameInput.value = row.name || "";
    if(row.avatar_url) avatarImg.src = row.avatar_url;
  }
}

avatarInput.addEventListener("change",(e)=>{
  const file = e.target.files[0];
  if(file){
    previewImg.src = URL.createObjectURL(file);
    previewWrap.style.display="block";
  }
});

uploadBtn.addEventListener("click", async ()=>{
  const file = avatarInput.files[0];
  if(!file) return showMessage("Selecciona un archivo","error");
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const path = `${user.id}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert:true });
  if(error) return showMessage("Error subiendo avatar","error");
  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.from("usuarios").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
  avatarImg.src = pub.publicUrl;
  showMessage("Avatar actualizado","success");
});

saveNameBtn.addEventListener("click", async ()=>{
  const name = userNameInput.value.trim();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  await supabase.from("usuarios").update({ name }).eq("id", user.id);
  showMessage("Nombre guardado","success");
});

logoutBtn.addEventListener("click", async ()=>{ await supabase.auth.signOut(); window.location.href="login.html"; });

loadProfile();
