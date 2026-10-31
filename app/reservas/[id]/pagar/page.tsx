import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { CalendarEvent, CreditCard, People } from "react-bootstrap-icons";
import { prisma } from "../../../../lib/prisma";
import { obterClienteId } from "../../../../lib/sessao";
import { cancelarReservasExpiradas } from "../../../../lib/reservas/ciclo-de-vida";
import { METODOS_DE_PAGAMENTO } from "../../../../lib/pagamentos/metodos";
import { calcularValores } from "../../../../lib/pagamentos/valores";
import FormularioPagamento from "./FormularioPagamento";
import Topo from "../../../componentes/Topo";
import IconeZona from "../../../componentes/IconeZona";
import { painelFormulario } from "../../../componentes/estilos";

export default function PaginaPagar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Topo voltarPara="/reservas" voltarTexto="As minhas reservas" />

      <div className={painelFormulario}>
        <h1 className="mb-5 flex items-center gap-2 text-2xl font-bold">
          <CreditCard size={24} className="text-marca" aria-hidden /> Pagar
          reserva
        </h1>

        <Suspense fallback={<p className="text-zinc-500">A carregar...</p>}>
          <ConteudoPagar params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function ConteudoPagar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");

  // Uma reserva que passou do prazo já não pode ser paga
  await cancelarReservasExpiradas();

  const reserva = await prisma.reserva.findFirst({
    where: { id, clienteId },
    include: { zona: true, pagamento: true },
  });
  if (!reserva) notFound();
  if (reserva.estado !== "AGUARDA_PAGAMENTO" || reserva.pagamento) {
    redirect("/reservas");
  }

  const { total, minimo } = await calcularValores(reserva.nPessoas);

  return (
    <>
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-marca-clara p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-marca">
          <IconeZona nome={reserva.zona.nome} />
        </span>
        <div>
          <p className="font-semibold">{reserva.zona.nome}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <CalendarEvent size={13} aria-hidden />
              {reserva.dataHora.toLocaleString("pt-PT", {
                timeZone: "Africa/Maputo",
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <People size={13} aria-hidden />
              {reserva.nPessoas} {reserva.nPessoas === 1 ? "pessoa" : "pessoas"}
            </span>
          </p>
        </div>
      </div>

      <FormularioPagamento
        reservaId={reserva.id}
        total={total}
        minimo={minimo}
        metodos={METODOS_DE_PAGAMENTO.map((m) => ({
          tipo: m.tipo,
          nome: m.nome,
        }))}
      />
    </>
  );
}
