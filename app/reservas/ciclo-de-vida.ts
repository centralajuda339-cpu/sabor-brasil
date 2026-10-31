import { prisma } from "../prisma";

// Regras do restaurante (fáceis de alterar aqui)
export const MINUTOS_PARA_PAGAR = 30;
export const HORAS_MINIMAS_PARA_CANCELAR = 2;

// Uma reserva que ninguém pagou a tempo passa a Cancelada
export async function cancelarReservasExpiradas() {
  const limite = new Date(Date.now() - MINUTOS_PARA_PAGAR * 60000);
  await prisma.reserva.updateMany({
    where: { estado: "AGUARDA_PAGAMENTO", criadaEm: { lt: limite } },
    data: { estado: "CANCELADA" },
  });
}

// O cliente só pode cancelar se faltarem pelo menos 2 horas
export function podeCancelar(reserva: {
  estado: string;
  dataHora: Date;
}): boolean {
  const ativa =
    reserva.estado === "AGUARDA_PAGAMENTO" || reserva.estado === "CONFIRMADA";
  const faltam = reserva.dataHora.getTime() - Date.now();
  return ativa && faltam >= HORAS_MINIMAS_PARA_CANCELAR * 3600000;
}
