// config.js
// Configuración centralizada de Supabase

export const SUPABASE_URL = "https://illwxhdyndqkfvvzbasr.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHd4aGR5bmRxa2Z2dnpiYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDE1OTMsImV4cCI6MjA3NDQ3NzU5M30.OJJ3TQgsdsCtIbv8DZZ7KZU2FJUjzh0FmeEWZ0Q_ZAs";

// Cliente Supabase
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
