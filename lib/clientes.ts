import { prisma } from "./prisma";
import type { Prisma } from "../app/generated/prisma/client";

export const MAXIMO_CLIENTES = 200;

// Lista os clientes registados. Nunca devolve a palavra-passe (nem o hash).
export async function consultarClientes(pesquisa: string) {
  const q = pesquisa.trim();
  const digitos = q.replace(/\D/g, ""); // "84 123" -> "84123"

  const alternativas: Prisma.ClienteWhereInput[] = [
    { nome: { contains: q, mode: "insensitive" } },
  ];
  if (digitos.length >= 3) {
    alternativas.push({ telefone: { contains: digitos } });
  }

  const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [total, novosNaSemana, clientes] = await Promise.all([
    prisma.cliente.count(),
    prisma.cliente.count({ where: { dataRegisto: { gte: umaSemanaAtras } } }),
    prisma.cliente.findMany({
      where: q ? { OR: alternativas } : undefined,
      select: {
        id: true,
        nome: true,
        telefone: true,
        dataRegisto: true,
        _count: { select: { reservas: true } },
      },
      orderBy: { dataRegisto: "desc" },
      take: MAXIMO_CLIENTES,
    }),
  ]);

  return { total, novosNaSemana, clientes };
}
