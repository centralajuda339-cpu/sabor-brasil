"use client";

import { useEffect } from "react";

export default function RegistarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Se falhar, a aplicação funciona na mesma, só não fica instalável
      });
    }
  }, []);

  return null;
}
