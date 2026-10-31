import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Transforma a palavra-passe num "hash" para guardar na base de dados
export function criarHash(senha: string): string {
  const sal = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, sal, 64).toString("hex");
  return `${sal}:${hash}`;
}

// Confirma se a palavra-passe escrita corresponde ao hash guardado
export function verificarSenha(senha: string, guardado: string): boolean {
  const [sal, hash] = guardado.split(":");
  if (!sal || !hash) return false;
  const calculado = scryptSync(senha, sal, 64);
  const original = Buffer.from(hash, "hex");
  return (
    calculado.length === original.length && timingSafeEqual(calculado, original)
  );
}
