import { prisma } from "./prisma";
import { inicioDoDiaEmMocambique } from "./datas";

// Estatísticas para o painel do gestor.
// Tudo calculado em tempo real, com base no fuso de Moçambique.
export async function obterEstatisticas() {
  const hoje = inicioDoDiaEmMocambique(0);
  const amanha = inicioDoDiaEmMocambique(1);
  const inicioSemana = inicioDoDiaEmMocambique(-6); // últimos 7 dias incluindo hoje
  const inicioMes = new Date(
    Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1, -2, 0, 0),
  );

  const ESTADOS_ATIVOS = ["AGUARDA_PAGAMENTO", "CONFIRMADA"];

  const [
    reservasHoje,
    reservasSemana,
    reservasMes,
    totalClientes,
    totalStaffAtivo,
    pagamentosMes,
    reservasPorZona,
    ocupacaoHoje,
    cuponsAtivos,
    topClientes,
  ] = await Promise.all([
    prisma.reserva.count({
      where: {
        dataHora: { gte: hoje, lt: amanha },
        estado: { not: "CANCELADA" },
      },
    }),
    prisma.reserva.count({
      where: {
        dataHora: { gte: inicioSemana, lt: amanha },
        estado: { not: "CANCELADA" },
      },
    }),
    prisma.reserva.count({
      where: {
        dataHora: { gte: inicioMes, lt: amanha },
        estado: { not: "CANCELADA" },
      },
    }),
    prisma.cliente.count(),
    prisma.staff.count({ where: { ativo: true } }),
    prisma.pagamento.aggregate({
      _sum: { valorPago: true },
      where: {
        reserva: { dataHora: { gte: inicioMes, lt: amanha } },
      },
    }),
    prisma.zona.findMany({
      include: {
        _count: {
          select: {
            reservas: { where: { estado: { in: ESTADOS_ATIVOS } } },
          },
        },
        mesas: { select: { capacidade: true } },
      },
    }),
    prisma.reserva.findMany({
      where: {
        dataHora: { gte: hoje, lt: amanha },
        estado: { in: ESTADOS_ATIVOS },
      },
      select: { nPessoas: true },
    }),
    prisma.cupom.count({
      where: { usadoEm: null, validoAte: { gte: new Date() } },
    }),
    prisma.cliente.findMany({
      orderBy: { reservas: { _count: "desc" } },
      take: 5,
      select: {
        id: true,
        nome: true,
        telefone: true,
        _count: { select: { reservas: true } },
      },
    }),
  ]);

  const receitaMes = pagamentosMes._sum.valorPago ?? 0;
  const pessoasHoje = ocupacaoHoje.reduce((s, r) => s + r.nPessoas, 0);
  const lugaresTotais = reservasPorZona.reduce(
    (s, z) => s + z.mesas.reduce((t, m) => t + m.capacidade, 0),
    0,
  );

  return {
    hoje: { reservas: reservasHoje, pessoas: pessoasHoje },
    semana: { reservas: reservasSemana },
    mes: { reservas: reservasMes, receita: receitaMes },
    totalClientes,
    totalStaffAtivo,
    cuponsAtivos,
    zonas: reservasPorZona.map((z) => ({
      id: z.id,
      nome: z.nome,
      reservasAtivas: z._count.reservas,
      lugares: z.mesas.reduce((t, m) => t + m.capacidade, 0),
    })),
    lugaresTotais,
    topClientes: topClientes.map((c) => ({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      reservas: c._count.reservas,
    })),
  };
}
