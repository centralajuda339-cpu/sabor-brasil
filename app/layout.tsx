import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RegistarServiceWorker from "./RegistarServiceWorker";
import BotaoInstalar from "./BotaoInstalar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sabor Brasil — Reserva de mesas",
    template: "%s · Sabor Brasil",
  },
  description: "Reserve a sua mesa no restaurante Sabor Brasil, em Tete.",
  applicationName: "Sabor Brasil",
  appleWebApp: {
    capable: true,
    title: "Sabor Brasil",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

// Corre antes de a página aparecer: usa a escolha guardada ou, se não houver, o tema do aparelho
const SCRIPT_TEMA = `
(function () {
  try {
    var guardado = localStorage.getItem("tema");
    var escuro = guardado
      ? guardado === "escuro"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (escuro) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full">
        {children}
        <RegistarServiceWorker />
        <BotaoInstalar />
      </body>
    </html>
  );
}
