"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, XLg } from "react-bootstrap-icons";

type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Está a usar a aplicação já instalada (janela própria, sem barra do navegador)?
function estaNaAppInstalada(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPhone e iPad (só no Safari): não existe botão de instalar, só instruções
function ehSafariIos(): boolean {
  const ua = navigator.userAgent;
  const ios =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && !/crios|fxios|edgios/i.test(ua);
}

export default function BotaoInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [aviso, setAviso] = useState("");
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    // O navegador avisa quando a aplicação pode ser instalada
    const aoPoderInstalar = (e: Event) => {
      e.preventDefault(); // guarda o evento para o botão o usar
      setEvento(e as EventoInstalar);
    };
    const aoInstalar = () => {
      setEvento(null);
      setAviso("Aplicação instalada com sucesso.");
    };

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);

    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  async function instalar() {
    // Caso normal: o navegador permite instalar agora
    if (evento) {
      await evento.prompt();
      await evento.userChoice;
      setEvento(null); // o evento só pode ser usado uma vez
      return;
    }

    // Sem instalação possível: explica o que se passa
    if (estaNaAppInstalada()) {
      setAviso("Já está a usar a aplicação instalada.");
    } else if (ehSafariIos()) {
      setAviso("Toque em Partilhar e depois em «Adicionar ao ecrã principal».");
    } else {
      setAviso(
        "Se já a instalou, abra-a pelo ícone. Se não, use o menu do navegador e escolha «Instalar aplicação».",
      );
    }
  }

  if (fechado) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicação"
      className="fixed bottom-3 left-3 right-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 shadow-lg sm:left-auto sm:right-4 sm:mx-0 sm:max-w-sm"
    >
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        className="rounded-xl"
      />
      <p className="flex-1">
        {aviso || "Instale o Sabor Brasil no seu dispositivo."}
      </p>
      <button
        type="button"
        onClick={instalar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-marca px-3 py-1.5 font-semibold text-white transition hover:bg-marca-escura"
      >
        <Download size={15} aria-hidden /> Instalar
      </button>
      <button
        type="button"
        onClick={() => setFechado(true)}
        aria-label="Fechar"
        className="rounded p-1 text-zinc-500 transition hover:bg-zinc-100"
      >
        <XLg size={14} aria-hidden />
      </button>
    </div>
  );
}
