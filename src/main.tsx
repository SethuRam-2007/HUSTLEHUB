import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 🔍 DEBUG (add these two lines)
console.log("SUPABASE URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE ANON KEY =", import.meta.env.VITE_SUPABASE_ANON_KEY);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
