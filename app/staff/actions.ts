"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { obterStaffId, terminarSessaoStaff } from "../../lib/sessao";

// Só staff ou gestor com sessão iniciada pode usar estas ações
async function exigirStaff() {
  const id = await obterStaffId();
  if (!id) redirect("/staff/entrar");
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff || !staff.ativo) redirect("/staff/entrar");
  return staff;
}

export async function atribuirMesa(
  _estadoAnterior: { mensagem: string },
  formData: FormData,
): Promise<{ mensagem: string }> {
  const staff = await exigirStaff();

  const reservaId = String(formData.get("reservaId") ?? "");
  const mesaId = String(formData.get("mesaId") ?? "");
  if (!mesaId) return { mensagem: "Escolha uma mesa." };

  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva || reserva.estado !== "CONFIRMADA") {
    return { mensagem: "Só se atribui mesa a reservas confirmadas." };
  }

  const mesa = await prisma.mesa.findUnique({ where: { id: mesaId } });
  if (!mesa || mesa.zonaId !== reserva.zonaId) {
    return { mensagem: "Esta mesa não pertence à área da reserva." };
  }

  // A mesma mesa não pode estar atribuída a duas reservas ao mesmo tempo
  const fim = new Date(reserva.dataHora.getTime() + reserva.duracao * 60000);
  const limiteInferior = new Date(reserva.dataHora.getTime() - 120 * 60000);
  const outras = await prisma.reserva.findMany({
    where: {
      mesaId,
      id: { not: reserva.id },
      estado: "CONFIRMADA",
      dataHora: { gt: limiteInferior, lt: fim },
    },
    select: { dataHora: true, duracao: true },
  });
  const conflito = outras.some(
    (o) =>
      o.dataHora.getTime() + o.duracao * 60000 > reserva.dataHora.getTime(),
  );
  if (conflito) {
    return {
      mensagem: "Esta mesa já está atribuída a outra reserva nesse horário.",
    };
  }

  await prisma.reserva.update({
    where: { id: reserva.id },
    data: { mesaId, staffId: staff.id },
  });

  revalidatePath("/staff");
  return { mensagem: "" };
}

// O cliente pagou o restante no restaurante
export async function confirmarLiquidacao(formData: FormData) {
  const staff = await exigirStaff();
  const reservaId = String(formData.get("reservaId") ?? "");

  const pagamento = await prisma.pagamento.findUnique({ where: { reservaId } });
  if (!pagamento || pagamento.valorPago >= pagamento.valorTotal) return;

  await prisma.$transaction([
    prisma.pagamento.update({
      where: { reservaId },
      data: { valorPago: pagamento.valorTotal, estado: "TOTAL" },
    }),
    prisma.reserva.update({
      where: { id: reservaId },
      data: {
        liquidadoPorStaffId: staff.id,
        dataLiquidacao: new Date(),
      },
    }),
  ]);

  revalidatePath("/staff");
}

// O cliente chegou, foi servido e a conta está paga
export async function concluirReserva(formData: FormData) {
  const staff = await exigirStaff();
  const reservaId = String(formData.get("reservaId") ?? "");

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { pagamento: true },
  });
  if (
    !reserva ||
    reserva.estado !== "CONFIRMADA" ||
    !reserva.mesaId ||
    !reserva.pagamento ||
    reserva.pagamento.valorPago < reserva.pagamento.valorTotal
  ) {
    return;
  }

  await prisma.reserva.update({
    where: { id: reserva.id },
    data: {
      estado: "CONCLUIDA",
      // Se ninguém tinha registado a liquidação, fica associada a quem conclui
      liquidadoPorStaffId: reserva.liquidadoPorStaffId ?? staff.id,
      dataLiquidacao: reserva.dataLiquidacao ?? new Date(),
    },
  });

  revalidatePath("/staff");
}

// O staff cancela uma reserva e liberta os lugares (e a mesa, se estava atribuída)
export async function cancelarReservaStaff(formData: FormData) {
  await exigirStaff();
  const reservaId = String(formData.get("reservaId") ?? "");

  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (
    !reserva ||
    (reserva.estado !== "AGUARDA_PAGAMENTO" && reserva.estado !== "CONFIRMADA")
  ) {
    return;
  }

  await prisma.reserva.update({
    where: { id: reserva.id },
    data: { estado: "CANCELADA", mesaId: null },
  });

  revalidatePath("/staff");
}

export async function sairStaff() {
  await terminarSessaoStaff();
  redirect("/staff/entrar");
}
