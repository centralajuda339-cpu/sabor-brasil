"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { obterClienteId } from "../../../../lib/sessao";
import { cancelarReservasExpiradas } from "../../../../lib/reservas/ciclo-de-vida";
import { obterPagamento } from "../../../../lib/pagamentos/metodos";
import { calcularValores } from "../../../../lib/pagamentos/valores";

export async function pagarReserva(
  _estadoAnterior: { mensagem: string },
  formData: FormData,
): Promise<{ mensagem: string }> {
  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");

  const reservaId = String(formData.get("reservaId") ?? "");
  const modalidade = String(formData.get("modalidade") ?? "");
  const tipo = String(formData.get("metodo") ?? "");

  // Uma reserva que passou do prazo já não pode ser paga
  await cancelarReservasExpiradas();

  // Só se pode pagar uma reserva própria
  const reserva = await prisma.reserva.findFirst({
    where: { id: reservaId, clienteId },
    include: { pagamento: true },
  });
  if (!reserva) return { mensagem: "Reserva não encontrada." };
  if (reserva.estado !== "AGUARDA_PAGAMENTO" || reserva.pagamento) {
    return { mensagem: "Esta reserva já não está a aguardar pagamento." };
  }

  const metodo = obterPagamento(tipo);
  if (!metodo) return { mensagem: "Escolha um método de pagamento." };
  if (modalidade !== "SINAL" && modalidade !== "TOTAL") {
    return { mensagem: "Escolha se quer fazer o pagamento parcial ou total." };
  }

  // Os valores são sempre calculados aqui, no servidor
  const { total, minimo } = await calcularValores(reserva.nPessoas);
  const valorPago = modalidade === "TOTAL" ? total : minimo;

  const resultado = await metodo.processar(valorPago);
  if (!resultado.sucesso) {
    return { mensagem: "O pagamento não foi aceite. Tente outra vez." };
  }

  // Grava o pagamento e confirma a reserva, as duas coisas juntas
  await prisma.$transaction([
    prisma.pagamento.create({
      data: {
        reservaId: reserva.id,
        tipo: metodo.tipo,
        valorPago,
        valorTotal: total,
        referencia: resultado.referencia,
        estado: valorPago >= total ? "TOTAL" : "PARCIAL",
      },
    }),
    prisma.reserva.update({
      where: { id: reserva.id },
      data: { estado: "CONFIRMADA" },
    }),
  ]);

  redirect("/reservas");
}
