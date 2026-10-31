import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarEvent,
  CalendarPlus,
  Clock,
  CreditCard,
  ExclamationTriangle,
  People,
  XCircle,
} from "react-bootstrap-icons";
import { prisma } from "../../lib/prisma";
import { obterClienteId } from "../../lib/sessao";
import { obterPagamento } from "../../lib/pagamentos/metodos";
import {
  cancelarReservasExpiradas,
  podeCancelar,
  MINUTOS_PARA_PAGAR,
  HORAS_MINIMAS_PARA_CANCELAR,
} from "../../lib/reservas/ciclo-de-vida";
import { cancelarReserva } from "./actions";
import Separadores from "../Separadores";
import Topo from "../componentes/Topo";
import SeloEstado from "../componentes/SeloEstado";
import IconeZona from "../componentes/IconeZona";
import { botaoPerigo, botaoPrimario, cartao } from "../componentes/estilos";

const ESTADOS_ATIVOS = ["PENDENTE", "AGUARDA_PAGAMENTO", "CONFIRMADA"];

export default function PaginaReservas({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Topo />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">As minhas reservas</h1>
        <Link href="/reservar" className={botaoPrimario}>
          <CalendarPlus size={16} aria-hidden /> Nova reserva
        </Link>
      </div>

      <Suspense fallback={<p className="text-zinc-500">A carregar...</p>}>
        <ListaReservas searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ListaReservas({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { vista } = await searchParams;

  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");

  // Cancela as reservas que não foram pagas a tempo
  await cancelarReservasExpiradas();

  const todas = await prisma.reserva.findMany({
    where: { clienteId },
    include: { zona: true, pagamento: true },
    orderBy: { dataHora: "desc" },
  });

  // Ativas: a mais próxima primeiro. Histórico: a mais recente primeiro.
  const ativas = todas
    .filter((r) => ESTADOS_ATIVOS.includes(r.estado))
    .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime());
  const historico = todas.filter((r) => !ESTADOS_ATIVOS.includes(r.estado));

  const vistaAtiva = vista === "historico" ? "historico" : "ativas";
  const reservas = vistaAtiva === "ativas" ? ativas : historico;

  return (
    <>
      <Separadores
        caminho="/reservas"
        ativo={vistaAtiva}
        itens={[
          { chave: "ativas", rotulo: "Ativas", contagem: ativas.length },
          {
            chave: "historico",
            rotulo: "Histórico",
            contagem: historico.length,
          },
        ]}
      />

      {reservas.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500">
          {vistaAtiva === "ativas"
            ? "Não tem reservas ativas."
            : "Ainda não tem reservas no histórico."}
        </p>
      )}

      <ul className="space-y-3">
        {reservas.map((r) => {
          const p = r.pagamento;

          return (
            <li key={r.id} className={cartao}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-lg font-semibold">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marca-clara text-marca">
                      <IconeZona nome={r.zona.nome} />
                    </span>
                    {r.zona.nome}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarEvent size={14} aria-hidden />
                      {r.dataHora.toLocaleString("pt-PT", {
                        timeZone: "Africa/Maputo",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <People size={14} aria-hidden />
                      {r.nPessoas} {r.nPessoas === 1 ? "pessoa" : "pessoas"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} aria-hidden />
                      {r.duracao / 60} horas
                    </span>
                  </p>
                </div>
                <SeloEstado estado={r.estado} />
              </div>

              {r.estado === "AGUARDA_PAGAMENTO" && (
                <div className="mt-3">
                  <Link
                    href={`/reservas/${r.id}/pagar`}
                    className={botaoPrimario}
                  >
                    <CreditCard size={16} aria-hidden /> Pagar agora
                  </Link>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Pague até às{" "}
                    {new Date(
                      r.criadaEm.getTime() + MINUTOS_PARA_PAGAR * 60000,
                    ).toLocaleTimeString("pt-PT", {
                      timeZone: "Africa/Maputo",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    , ou a reserva é cancelada.
                  </p>
                </div>
              )}

              {p && (
                <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm">
                  <p>
                    Pago: <strong>{p.valorPago}</strong> de {p.valorTotal} MT
                    via {obterPagamento(p.tipo)?.nome ?? p.tipo}
                  </p>
                  <p className="text-zinc-600">
                    Referência:{" "}
                    <span className="font-mono">{p.referencia}</span>
                  </p>
                  {r.estado !== "CANCELADA" && p.valorPago < p.valorTotal && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-amber-700">
                      <ExclamationTriangle
                        size={14}
                        className="mt-0.5 shrink-0"
                        aria-hidden
                      />
                      Falta pagar {p.valorTotal - p.valorPago} MT no
                      restaurante, com a mesma referência.
                    </p>
                  )}
                </div>
              )}

              {podeCancelar(r) && (
                <form action={cancelarReserva} className="mt-3">
                  <input type="hidden" name="reservaId" value={r.id} />
                  <button type="submit" className={botaoPerigo}>
                    <XCircle size={16} aria-hidden /> Cancelar reserva
                  </button>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Só é possível cancelar até {HORAS_MINIMAS_PARA_CANCELAR}{" "}
                    horas antes.
                  </p>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
