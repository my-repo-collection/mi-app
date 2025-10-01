import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Inicializar Supabase
const supabaseUrl = "https://illwxhdyndqkfvvzbasr.supabase.co"; // 👈 tu URL
const supabaseKey = "TU-ANON-KEY"; // 👈 tu anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Login
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert(error.message);
  } else {
    window.location.href = "profile.html";
  }
});

// Registro
document.getElementById("registerBtn").addEventListener("click", async () => {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert(error.message);
  } else {
    // Insertar fila en la tabla "users"
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: data.user.id,  // ID del auth
        email: email,
        name: "",
        avatar_url: ""
      }
    ]);

    if (dbError) {
      console.error(dbError);
    }

    alert("Revisa tu email para confirmar tu cuenta.");
  }
});
