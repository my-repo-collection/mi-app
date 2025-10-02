// config.js
// Configuración centralizada de Supabase

// Usa tu URL y anon key reales
const SUPABASE_URL = "https://illwxhdyndqkfvvzbasr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHd4aGR5bmRxa2Z2dnpiYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDE1OTMsImV4cCI6MjA3NDQ3NzU5M30.OJJ3TQgsdsCtIbv8DZZ7KZU2FJUjzh0FmeEWZ0Q_ZAs";

// Importa el cliente desde CDN en modo ESM
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Exporta un único cliente global
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
