import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_CLIENTE = "sessao";
const COOKIE_STAFF = "sessao_staff";

function assinar(valor: string): string {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) throw new Error("Falta SESSION_SECRET no ficheiro .env");
  return createHmac("sha256", segredo).update(valor).digest("hex");
}

async function gravar(nome: string, id: string) {
  const jar = await cookies();
  jar.set(nome, `${id}.${assinar(id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

async function ler(nome: string): Promise<string | null> {
  const jar = await cookies();
  const valor = jar.get(nome)?.value;
  if (!valor) return null;

  const [id, assinatura] = valor.split(".");
  if (!id || !assinatura) return null;

  const esperada = Buffer.from(assinar(id));
  const recebida = Buffer.from(assinatura);
  if (
    esperada.length !== recebida.length ||
    !timingSafeEqual(esperada, recebida)
  ) {
    return null;
  }
  return id;
}

async function apagar(nome: string) {
  const jar = await cookies();
  jar.delete(nome);
}

// Clientes
export async function criarSessao(clienteId: string) {
  await gravar(COOKIE_CLIENTE, clienteId);
}
export async function obterClienteId(): Promise<string | null> {
  return ler(COOKIE_CLIENTE);
}
export async function terminarSessao() {
  await apagar(COOKIE_CLIENTE);
}

// Staff e gestor
export async function criarSessaoStaff(staffId: string) {
  await gravar(COOKIE_STAFF, staffId);
}
export async function obterStaffId(): Promise<string | null> {
  return ler(COOKIE_STAFF);
}
export async function terminarSessaoStaff() {
  await apagar(COOKIE_STAFF);
}
