// Aceita "84 123 4567", "+258 84 123 4567", "258841234567", etc.
// Devolve "+258841234567", ou null se não for um telemóvel de Moçambique.
export function normalizarTelefone(entrada: string): string | null {
  let digitos = entrada.replace(/\D/g, ""); // fica só com os números
  if (digitos.startsWith("258")) digitos = digitos.slice(3);
  if (!/^8[2-7]\d{7}$/.test(digitos)) return null; // 82 a 87 + 7 dígitos
  return `+258${digitos}`;
}
