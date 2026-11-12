"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { obterClienteId } from "../../lib/sessao";
import { criarCadeiaDeValidacao } from "../../lib/reservas/validadores";
import { cancelarReservasExpiradas } from "../../lib/reservas/ciclo-de-vida";

const DURACAO_MINUTOS = 120;
const ESTADOS_ATIVOS = ["PENDENTE", "AGUARDA_PAGAMENTO", "CONFIRMADA"];

export async function criarReserva(
  _estadoAnterior: { mensagem: string },
  formData: FormData,
): Promise<{ mensagem: string }> {
  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");

  const zonaId = String(formData.get("zonaId") ?? "");
  const nPessoas = Number(formData.get("nPessoas"));
  const dataHora = String(formData.get("dataHora") ?? "");
  const mesaId = String(formData.get("mesaId") ?? "");

  // O campo de data/hora não tem fuso horário: interpretamos como hora de Moçambique (UTC+2)
  const inicio = new Date(`${dataHora}:00+02:00`);

  if (!zonaId || Number.isNaN(inicio.getTime())) {
    return {
      mensagem: "Preencha a área, o número de pessoas e a data e hora.",
    };
  }

  // Liberta os lugares das reservas que não foram pagas a tempo
  await cancelarReservasExpiradas();

  // A cadeia de responsabilidade decide se a reserva pode avançar
  const resultado = await criarCadeiaDeValidacao().validar({
    zonaId,
    nPessoas,
    inicio,
    duracao: DURACAO_MINUTOS,
  });
  if (!resultado.valida) {
    return { mensagem: resultado.motivo };
  }

  // Se o cliente escolheu uma mesa, validar que ela pertence à zona e está livre
  let mesaFinalId: string | null = null;
  if (mesaId) {
    const mesa = await prisma.mesa.findUnique({ where: { id: mesaId } });
    if (!mesa || mesa.zonaId !== zonaId) {
      return {
        mensagem: "A mesa escolhida não pertence à área selecionada.",
      };
    }

    // Verificar conflito de horário na mesma mesa
    const fim = new Date(inicio.getTime() + DURACAO_MINUTOS * 60000);
    const limiteInferior = new Date(inicio.getTime() - DURACAO_MINUTOS * 60000);
    const conflito = await prisma.reserva.findFirst({
      where: {
        mesaId,
        estado: { in: ESTADOS_ATIVOS },
        dataHora: { gt: limiteInferior, lt: fim },
      },
      select: { id: true },
    });
    if (conflito) {
      return {
        mensagem:
          "Essa mesa já está reservada para esse horário. Escolha outra ou continue sem preferência.",
      };
    }

    // Verificar capacidade suficiente para o grupo
    if (nPessoas > mesa.capacidade) {
      return {
        mensagem: `A mesa escolhida só tem ${mesa.capacidade} lugares. Escolha outra ou continue sem preferência.`,
      };
    }

    mesaFinalId = mesaId;
  }

  await prisma.reserva.create({
    data: {
      clienteId,
      zonaId,
      mesaId: mesaFinalId,
      nPessoas,
      dataHora: inicio,
      duracao: DURACAO_MINUTOS,
      estado: "AGUARDA_PAGAMENTO",
    },
  });

  redirect("/reservas");
}
