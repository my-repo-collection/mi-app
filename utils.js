// utils.js
import { supabase } from "./config.js";

/**
 * Simple toast system (usa #toast-container en el DOM)
 */
export function showToast(message, type = "info", timeout = 4500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = message;
  container.appendChild(t);

  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 400);
  }, timeout);
}

/**
 * Resize an image file on the client. Returns a File.
 */
export async function resizeImage(file, maxSize = 1200, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("No se generó el blob"));
          const f = new File([blob], file.name, { type: file.type });
          resolve(f);
        }, file.type, quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

/**
 * Public URL helper: obtiene URL pública para un archivo subido (bucket + path).
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}
