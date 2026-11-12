import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import { obterClienteId } from "../../../../lib/sessao";
import { obterPagamento } from "../../../../lib/pagamentos/metodos";
import { SUPORTE } from "../../../../lib/suporte";
import Carregando from "../../../componentes/Carregando";
import SeloEstado from "../../../componentes/SeloEstado";
import BotaoImprimir from "../../../componentes/BotaoImprimir";

export const metadata = { title: "Recibo de reserva" };

// Esta página foi desenhada para impressão: o browser gera o PDF.
// Em qualquer navegador, Cmd/Ctrl+P abre o diálogo de impressão, onde se
// pode escolher "Guardar como PDF".
export default function PaginaRecibo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 print:py-0">
      <Suspense fallback={<Carregando texto="A carregar recibo..." />}>
        <ConteudoRecibo params={params} />
      </Suspense>
    </main>
  );
}

async function ConteudoRecibo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");

  const r = await prisma.reserva.findFirst({
    where: { id, clienteId },
    include: {
      cliente: true,
      zona: true,
      pagamento: true,
      staff: { select: { nome: true } },
      liquidadoPor: { select: { nome: true } },
    },
  });
  if (!r) notFound();

  const p = r.pagamento;
  const dataHoraTxt = r.dataHora.toLocaleString("pt-PT", {
    timeZone: "Africa/Maputo",
    dateStyle: "long",
    timeStyle: "short",
  });
  const criadaTxt = r.criadaEm.toLocaleString("pt-PT", {
    timeZone: "Africa/Maputo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <>
      {/* Botão de imprimir: só aparece no ecrã, não sai no PDF */}
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/conta"
          className="text-sm font-medium text-marca-escura hover:underline"
        >
          ← Voltar à minha conta
        </Link>
        <BotaoImprimir />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        {/* Cabeçalho do recibo */}
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <p className="text-xl font-bold text-marca-escura">Sabor Brasil</p>
            <p className="mt-1 text-xs text-zinc-500">{SUPORTE.endereco}</p>
            <p className="text-xs text-zinc-500">{SUPORTE.horario}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Tel: {SUPORTE.telefone} · {SUPORTE.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Recibo
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-marca-escura">
              {(p?.referencia ?? r.id.slice(-8)).toUpperCase()}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Emitido em {criadaTxt}</p>
          </div>
        </header>

        {/* Dados do cliente */}
        <section className="mt-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Cliente
          </p>
          <p className="mt-1 font-semibold">{r.cliente.nome}</p>
          <p className="text-zinc-600">{r.cliente.telefone}</p>
        </section>

        {/* Dados da reserva */}
        <section className="mt-4">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Detalhes da reserva
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-zinc-500">Área</dt>
            <dd className="font-medium">{r.zona.nome}</dd>

            <dt className="text-zinc-500">Data e hora</dt>
            <dd className="font-medium">{dataHoraTxt}</dd>

            <dt className="text-zinc-500">Duração</dt>
            <dd className="font-medium">{r.duracao / 60} horas</dd>

            <dt className="text-zinc-500">Pessoas</dt>
            <dd className="font-medium">
              {r.nPessoas} {r.nPessoas === 1 ? "pessoa" : "pessoas"}
            </dd>

            <dt className="text-zinc-500">Estado</dt>
            <dd>
              <SeloEstado estado={r.estado} />
            </dd>
          </dl>
        </section>

        {/* Pagamento */}
        {p && (
          <section className="mt-4">
            <h2 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
              Pagamento
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-zinc-500">Método</dt>
              <dd className="font-medium">
                {obterPagamento(p.tipo)?.nome ?? p.tipo}
              </dd>

              <dt className="text-zinc-500">Referência</dt>
              <dd className="font-mono font-medium">{p.referencia}</dd>

              <dt className="text-zinc-500">Valor pago</dt>
              <dd className="font-medium">
                {p.valorPago.toLocaleString("pt-PT")} MT
              </dd>

              <dt className="text-zinc-500">Valor total</dt>
              <dd className="font-medium">
                {p.valorTotal.toLocaleString("pt-PT")} MT
              </dd>

              {p.valorPago < p.valorTotal && (
                <>
                  <dt className="text-zinc-500">Falta pagar</dt>
                  <dd className="font-semibold text-amber-700">
                    {(p.valorTotal - p.valorPago).toLocaleString("pt-PT")} MT no
                    restaurante
                  </dd>
                </>
              )}
            </dl>
          </section>
        )}

        {/* Atendimento */}
        {(r.staff?.nome || r.liquidadoPor?.nome) && (
          <section className="mt-4">
            <h2 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
              Atendimento
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {r.staff?.nome && (
                <>
                  <dt className="text-zinc-500">Mesa atribuída por</dt>
                  <dd className="font-medium">{r.staff.nome}</dd>
                </>
              )}
              {r.liquidadoPor?.nome && (
                <>
                  <dt className="text-zinc-500">Pagamento confirmado por</dt>
                  <dd className="font-medium">{r.liquidadoPor.nome}</dd>
                </>
              )}
            </dl>
          </section>
        )}

        {/* Apoio */}
        <footer className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-500">
          <p>
            Para qualquer reclamação, contacte o Sabor Brasil via WhatsApp{" "}
            {SUPORTE.telefone}, chamada {SUPORTE.telefone} ou email{" "}
            {SUPORTE.email}.
          </p>
          <p className="mt-2 italic">
            Este recibo é gerado automaticamente pelo sistema de reservas. Em
            caso de discrepância, o registo interno do restaurante prevalece.
          </p>
        </footer>
      </div>
    </>
  );
}
