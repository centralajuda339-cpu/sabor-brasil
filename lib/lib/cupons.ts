import { prisma } from "./prisma";
import { obterConfiguracao } from "./configuracao";

// Mês atual no formato "YYYY-MM" no fuso de Moçambique
export function mesAtualEmMocambique(referencia: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "2-digit",
  }).format(referencia);
}

// Converte "YYYY-MM" num par { inicio, fim } que cobre todo o mês, em UTC
function limitesDoMes(mes: string): { inicio: Date; fim: Date } {
  const [anoStr, mesStr] = mes.split("-");
  const ano = Number(anoStr);
  const m = Number(mesStr);
  // Início: dia 1 às 00:00 no fuso de Moçambique (+02:00)
  const inicio = new Date(Date.UTC(ano, m - 1, 1, -2, 0, 0));
  // Fim: primeiro dia do mês seguinte às 00:00 no fuso de Moçambique
  const fim = new Date(Date.UTC(ano, m, 1, -2, 0, 0));
  return { inicio, fim };
}

function gerarCodigoCupom(): string {
  // 8 caracteres maiúsculos alfanuméricos, sem caracteres ambíguos (0/O, 1/I)
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 8; i++) {
    codigo += letras[Math.floor(Math.random() * letras.length)];
  }
  return `SB-${codigo}`;
}

// Conta as reservas CONCLUÍDAS do cliente num mês específico
export async function contarReservasConcluidasNoMes(
  clienteId: string,
  mes: string,
): Promise<number> {
  const { inicio, fim } = limitesDoMes(mes);
  return prisma.reserva.count({
    where: {
      clienteId,
      estado: "CONCLUIDA",
      dataHora: { gte: inicio, lt: fim },
    },
  });
}

// Verifica se o cliente já tem um cupão para o mês indicado
export async function cupomDoMes(clienteId: string, mes: string) {
  return prisma.cupom.findFirst({
    where: { clienteId, mesReferente: mes },
  });
}

// Gera um cupão para o cliente se ele atingiu o limite de reservas no mês.
// Idempotente: se já existe cupão para o mês, não cria outro.
// Devolve o cupão criado, ou null se o cliente ainda não atingiu o limite.
export async function talvezGerarCupom(clienteId: string): Promise<{
  gerado: boolean;
  motivo: string;
}> {
  const config = await obterConfiguracao();
  const limite = config.reservasParaCupom;
  if (limite <= 0) return { gerado: false, motivo: "Programa desativado." };

  const mes = mesAtualEmMocambique();

  const jaTem = await cupomDoMes(clienteId, mes);
  if (jaTem) {
    return { gerado: false, motivo: "Já tem cupão deste mês." };
  }

  const concluidas = await contarReservasConcluidasNoMes(clienteId, mes);
  if (concluidas < limite) {
    return {
      gerado: false,
      motivo: `Ainda faltam ${limite - concluidas} reserva(s) para o cupão.`,
    };
  }

  // Válido até ao fim do mês seguinte
  const [ano, mesNum] = mes.split("-").map(Number);
  const proximoFim = new Date(Date.UTC(ano, mesNum + 1, 1, -2, 0, 0));
  // Salvaguarda: pelo menos 7 dias de validade
  const minimo = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const validoAte =
    proximoFim.getTime() > minimo.getTime() ? proximoFim : minimo;

  // Garante código único (em caso de colisão, repete até 5 vezes)
  let codigo = "";
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    codigo = gerarCodigoCupom();
    const existe = await prisma.cupom.findUnique({ where: { codigo } });
    if (!existe) break;
  }

  await prisma.cupom.create({
    data: {
      codigo,
      clienteId,
      mesReferente: mes,
      percentagem: config.percentagemCupom,
      validoAte,
    },
  });

  return {
    gerado: true,
    motivo: `Cupão ${codigo} criado (${config.percentagemCupom}% de desconto).`,
  };
}

// Lista cupões do cliente, ordenados do mais recente para o mais antigo
export async function listarCuponsCliente(clienteId: string) {
  return prisma.cupom.findMany({
    where: { clienteId },
    orderBy: { criadoEm: "desc" },
  });
}
