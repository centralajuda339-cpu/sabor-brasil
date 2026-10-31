"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { obterClienteId } from "../../lib/sessao";
import { criarCadeiaDeValidacao } from "../../lib/reservas/validadores";
import { cancelarReservasExpiradas } from "../../lib/reservas/ciclo-de-vida";

const DURACAO_MINUTOS = 120;

export async function criarReserva(
  _estadoAnterior: { mensagem: string },
  formData: FormData,
): Promise<{ mensagem: string }> {
  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");

  const zonaId = String(formData.get("zonaId") ?? "");
  const nPessoas = Number(formData.get("nPessoas"));
  const dataHora = String(formData.get("dataHora") ?? "");

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

  await prisma.reserva.create({
    data: {
      clienteId,
      zonaId,
      nPessoas,
      dataHora: inicio,
      duracao: DURACAO_MINUTOS,
      estado: "AGUARDA_PAGAMENTO",
    },
  });

  redirect("/reservas");
}
