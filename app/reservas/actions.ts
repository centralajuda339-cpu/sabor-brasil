"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { obterClienteId } from "../../lib/sessao";
import { podeCancelar } from "../../lib/reservas/ciclo-de-vida";

export async function cancelarReserva(formData: FormData) {
  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");

  const reservaId = String(formData.get("reservaId") ?? "");

  // Só se pode cancelar uma reserva própria
  const reserva = await prisma.reserva.findFirst({
    where: { id: reservaId, clienteId },
  });
  if (!reserva || !podeCancelar(reserva)) return;

  await prisma.reserva.update({
    where: { id: reserva.id },
    data: { estado: "CANCELADA", mesaId: null },
  });

  revalidatePath("/reservas");
}
