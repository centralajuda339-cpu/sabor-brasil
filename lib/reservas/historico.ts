import { prisma } from "../prisma";
import type { Prisma } from "../../app/generated/prisma/client";

// O staff só vê o histórico dos últimos 30 dias; o gestor vê tudo
export const DIAS_HISTORICO_STAFF = 30;
export const MAXIMO_HISTORICO = 100;

// Reservas concluídas e canceladas, da mais recente para a mais antiga.
// pesquisa: nome, telemóvel ou referência de pagamento.
// completo: true = todas as datas (gestor); false = só os últimos 30 dias (staff).
export async function consultarHistorico({
  pesquisa,
  completo,
}: {
  pesquisa: string;
  completo: boolean;
}) {
  const q = pesquisa.trim();
  const digitos = q.replace(/\D/g, ""); // "84 123" -> "84123"

  const filtros: Prisma.ReservaWhereInput[] = [
    { estado: { in: ["CONCLUIDA", "CANCELADA"] } },
  ];

  if (!completo) {
    const desde = new Date(
      Date.now() - DIAS_HISTORICO_STAFF * 24 * 3600 * 1000,
    );
    filtros.push({ dataHora: { gte: desde } });
  }

  if (q) {
    const alternativas: Prisma.ReservaWhereInput[] = [
      { cliente: { nome: { contains: q, mode: "insensitive" } } },
      { pagamento: { referencia: { contains: q, mode: "insensitive" } } },
    ];
    if (digitos.length >= 3) {
      alternativas.push({ cliente: { telefone: { contains: digitos } } });
    }
    filtros.push({ OR: alternativas });
  }

  return prisma.reserva.findMany({
    where: { AND: filtros },
    include: {
      cliente: true,
      zona: true,
      pagamento: true,
      staff: { select: { nome: true } },
      liquidadoPor: { select: { nome: true } },
    },
    orderBy: { dataHora: "desc" },
    take: MAXIMO_HISTORICO,
  });
}
