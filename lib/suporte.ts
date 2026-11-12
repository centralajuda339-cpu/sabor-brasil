// Contactos de apoio ao cliente.
// São fictícios mas realistas para Moçambique — substitui pelos reais antes de publicar.

export const SUPORTE = {
  restaurante: "Sabor Brasil",
  // Tete, Moçambique
  telefone: "+25884 123 4567",
  telefoneLink: "+258841234567",
  whatsapp: "258841234567", // wa.me usa só dígitos, com código do país
  email: "apoio@saborbrasil.co.mz",
  endereco: "Av. Eduardo Mondlane, 1234 — Tete, Moçambique",
  horario: "Todos os dias, das 11:00 às 22:00",
} as const;

export function linkWhatsApp(mensagem: string): string {
  const texto = encodeURIComponent(mensagem);
  return `https://wa.me/${SUPORTE.whatsapp}?text=${texto}`;
}

export function linkTelefone(): string {
  return `tel:${SUPORTE.telefoneLink}`;
}

export function linkEmail(assunto: string): string {
  return `mailto:${SUPORTE.email}?subject=${encodeURIComponent(assunto)}`;
}
