"use client";

import { useSyncExternalStore } from "react";
import { MoonStars, Sun } from "react-bootstrap-icons";

// Acompanha a classe "dark" que está no <html>
function subscrever(aviso: () => void) {
  const observador = new MutationObserver(aviso);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observador.disconnect();
}
const estaEscuro = () => document.documentElement.classList.contains("dark");
const estaEscuroNoServidor = () => false;

export default function AlternarTema() {
  const escuro = useSyncExternalStore(
    subscrever,
    estaEscuro,
    estaEscuroNoServidor,
  );

  function alternar() {
    const novo = !escuro;
    document.documentElement.classList.toggle("dark", novo);
    try {
      localStorage.setItem("tema", novo ? "escuro" : "claro");
    } catch {
      // sem armazenamento: a escolha vale só até recarregar
    }
  }

  const texto = escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={texto}
      title={texto}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:bg-marca-clara"
    >
      {escuro ? (
        <Sun size={16} aria-hidden />
      ) : (
        <MoonStars size={16} aria-hidden />
      )}
    </button>
  );
}
