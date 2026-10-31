import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sabor Brasil — Reserva de mesas",
    short_name: "Sabor Brasil",
    description: "Reserve a sua mesa no restaurante Sabor Brasil, em Tete.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#15803d",
    lang: "pt",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Reservar mesa", url: "/reservar" },
      { name: "As minhas reservas", url: "/reservas" },
    ],
  };
}
