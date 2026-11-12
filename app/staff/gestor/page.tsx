import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  CalendarCheck,
  CalendarWeek,
  CashCoin,
  ChevronRight,
  GraphUpArrow,
  Grid3x3Gap,
  People,
  PeopleFill,
  Person,
  ShieldCheck,
  Ticket,
  TrophyFill,
  Trash,
  BoxArrowRight,
} from "react-bootstrap-icons";
import { prisma } from "../../../lib/prisma";
import { obterStaffId } from "../../../lib/sessao";
import { obterConfiguracao } from "../../../lib/configuracao";
import { obterEstatisticas } from "../../../lib/dashboard";
import { agora } from "../../../lib/datas";
import { alternarAtivoStaff, removerMesa } from "./actions";
import { sairStaff } from "../actions";
import {
  FormularioConfiguracao,
  FormularioCupomConfig,
  FormularioNovoStaff,
  FormularioNovaMesa,
} from "./Formularios";
import Topo from "../../componentes/Topo";
import Carregando from "../../componentes/Carregando";
import IconeZona from "../../componentes/IconeZona";
import Separadores from "../../Separadores";
import {
  botaoContorno,
  cartao,
  painelFormulario,
} from "../../componentes/estilos";

const ABAS = ["dashboard", "fidelidade", "operacao"] as const;
type Aba = (typeof ABAS)[number];

export default function PaginaGestor({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Topo
        marcaHref="/staff"
        voltarPara="/staff"
        voltarTexto="Painel de reservas"
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Área do gestor</h1>
        <form action={sairStaff}>
          <button type="submit" className={botaoContorno}>
            <BoxArrowRight size={16} aria-hidden /> Sair
          </button>
        </form>
      </div>
      <Suspense fallback={<Carregando />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Conteudo({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;

  const staffId = await obterStaffId();
  if (!staffId) redirect("/staff/entrar");

  const eu = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!eu || !eu.ativo) redirect("/staff/entrar");
  if (eu.perfil !== "GESTOR") redirect("/staff");

  // Estatísticas dependem da hora atual: a página é dinâmica.
  await connection();

  const [config, contas, zonas, reservasComMesa, totalClientes, stats, cupons] =
    await Promise.all([
      obterConfiguracao(),
      prisma.staff.findMany({ orderBy: { nome: "asc" } }),
      prisma.zona.findMany({
        include: { mesas: { orderBy: [{ capacidade: "asc" }, { id: "asc" }] } },
        orderBy: { nome: "asc" },
      }),
      prisma.reserva.findMany({
        where: { estado: "CONFIRMADA", mesaId: { not: null } },
        select: { mesaId: true },
      }),
      prisma.cliente.count(),
      obterEstatisticas(),
      prisma.cupom.findMany({
        orderBy: { criadoEm: "desc" },
        take: 10,
        include: { cliente: { select: { nome: true } } },
      }),
    ]);

  const mesasEmUso = new Set(reservasComMesa.map((r) => r.mesaId));
  const agoraMs = agora();
  const abaAtiva: Aba = ABAS.find((a) => a === aba) ?? "dashboard";

  // ---- Painel de estatísticas (Dashboard) ----
  const painelStats = (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <GraphUpArrow size={22} className="text-marca" aria-hidden /> Visão
        geral
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={cartao}>
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CalendarCheck size={14} aria-hidden /> Reservas hoje
          </p>
          <p className="mt-1 text-2xl font-bold text-marca-escura">
            {stats.hoje.reservas}
          </p>
          <p className="text-xs text-zinc-500">{stats.hoje.pessoas} pessoas</p>
        </div>
        <div className={cartao}>
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CalendarWeek size={14} aria-hidden /> Esta semana
          </p>
          <p className="mt-1 text-2xl font-bold text-marca-escura">
            {stats.semana.reservas}
          </p>
        </div>
        <div className={cartao}>
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CashCoin size={14} aria-hidden /> Receita do mês
          </p>
          <p className="mt-1 text-2xl font-bold text-marca-escura">
            {stats.mes.receita.toLocaleString("pt-PT")} MT
          </p>
          <p className="text-xs text-zinc-500">{stats.mes.reservas} reservas</p>
        </div>
        <div className={cartao}>
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Ticket size={14} aria-hidden /> Cupões ativos
          </p>
          <p className="mt-1 text-2xl font-bold text-marca-escura">
            {stats.cuponsAtivos}
          </p>
        </div>
      </div>

      {/* Ocupação por zona */}
      <div className={cartao}>
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">
          Ocupação por área (reservas ativas)
        </h3>
        <ul className="space-y-2">
          {stats.zonas.map((z) => {
            const pct =
              z.lugares > 0
                ? Math.round((z.reservasAtivas / z.lugares) * 100)
                : 0;
            return (
              <li key={z.id} className="flex items-center gap-3 text-sm">
                <span className="flex w-32 items-center gap-1.5">
                  <span className="text-marca">
                    <IconeZona nome={z.nome} tamanho={14} />
                  </span>
                  {z.nome}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-marca"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <span className="w-24 text-right text-xs text-zinc-500">
                  {z.reservasAtivas} / {z.lugares} lugares
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Top clientes */}
      <div className={cartao}>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
          <TrophyFill size={14} className="text-ouro" aria-hidden /> Top 5
          clientes
        </h3>
        {stats.topClientes.length === 0 ? (
          <p className="text-sm text-zinc-500">Sem dados ainda.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {stats.topClientes.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2"
              >
                <span>
                  <span className="mr-2 text-xs font-bold text-zinc-400">
                    #{i + 1}
                  </span>
                  {c.nome}
                </span>
                <span className="text-xs text-zinc-500">
                  {c.reservas} {c.reservas === 1 ? "reserva" : "reservas"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Atalhos para as outras abas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/staff/gestor?aba=fidelidade"
          className={`${cartao} flex items-center gap-3 transition hover:bg-marca-clara`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marca-clara text-marca">
            <Ticket size={20} aria-hidden />
          </span>
          <span>
            <span className="block font-semibold">Gerir fidelidade</span>
            <span className="block text-sm text-zinc-500">
              {stats.cuponsAtivos} cupões ativos
            </span>
          </span>
        </Link>
        <Link
          href="/staff/gestor?aba=operacao"
          className={`${cartao} flex items-center gap-3 transition hover:bg-marca-clara`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marca-clara text-marca">
            <Grid3x3Gap size={20} aria-hidden />
          </span>
          <span>
            <span className="block font-semibold">Operação</span>
            <span className="block text-sm text-zinc-500">
              Mesas, contas e valores
            </span>
          </span>
        </Link>
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      {/* Separadores principais */}
      <Separadores
        caminho="/staff/gestor"
        ativo={abaAtiva}
        paramName="aba"
        itens={[
          { chave: "dashboard", rotulo: "Dashboard" },
          { chave: "fidelidade", rotulo: "Fidelidade" },
          { chave: "operacao", rotulo: "Operação" },
        ]}
      />

      {/* ================= ABA: DASHBOARD ================= */}
      {abaAtiva === "dashboard" && painelStats}

      {/* ================= ABA: FIDELIDADE ================= */}
      {abaAtiva === "fidelidade" && (
        <section className={painelFormulario}>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Ticket size={22} className="text-marca" aria-hidden /> Programa de
            fidelidade
          </h2>
          <FormularioCupomConfig
            reservasParaCupom={config.reservasParaCupom}
            percentagemCupom={config.percentagemCupom}
          />

          <h3 className="mb-3 mt-6 text-sm font-semibold text-zinc-700">
            Últimos cupões emitidos
          </h3>
          {cupons.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Ainda não foram emitidos cupões.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {cupons.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 p-2"
                >
                  <span>
                    <span className="font-mono font-bold text-marca-escura">
                      {c.codigo}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {c.cliente.nome} · {c.percentagem}%
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500">
                    {c.usadoEm
                      ? "usado"
                      : c.validoAte.getTime() < agoraMs
                        ? "expirado"
                        : `válido até ${c.validoAte.toLocaleDateString(
                            "pt-PT",
                            {
                              timeZone: "Africa/Maputo",
                              dateStyle: "short",
                            },
                          )}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ================= ABA: OPERAÇÃO ================= */}
      {abaAtiva === "operacao" && (
        <div className="space-y-6">
          {/* Atalho para clientes */}
          <Link
            href="/staff/gestor/clientes"
            className={`${cartao} flex items-center justify-between gap-3 transition hover:bg-marca-clara`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marca-clara text-marca">
                <People size={20} aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">Clientes registados</span>
                <span className="block text-sm text-zinc-500">
                  {totalClientes} {totalClientes === 1 ? "cliente" : "clientes"}{" "}
                  · ver quem são
                </span>
              </span>
            </span>
            <ChevronRight size={16} aria-hidden />
          </Link>

          {/* Valores da reserva */}
          <section className={painelFormulario}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <CashCoin size={22} className="text-marca" aria-hidden /> Valores
              da reserva
            </h2>
            <FormularioConfiguracao
              taxaPorPessoa={config.taxaPorPessoa}
              percentagemMinima={config.percentagemMinima}
            />
          </section>

          {/* Contas do restaurante */}
          <section className={painelFormulario}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <PeopleFill size={22} className="text-marca" aria-hidden /> Contas
              do restaurante
            </h2>

            <ul className="mb-6 space-y-2">
              {contas.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3"
                >
                  <div>
                    <p className="font-medium">
                      {c.nome}{" "}
                      <span className="text-sm font-normal text-zinc-500">
                        {c.telefone}
                      </span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">
                        {c.perfil === "GESTOR" ? (
                          <ShieldCheck size={13} aria-hidden />
                        ) : (
                          <Person size={13} aria-hidden />
                        )}
                        {c.perfil === "GESTOR" ? "Gestor" : "Staff"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 ${
                          c.ativo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.ativo ? "Ativa" : "Desativada"}
                      </span>
                    </p>
                  </div>
                  {c.id !== eu.id && (
                    <form action={alternarAtivoStaff}>
                      <input type="hidden" name="staffId" value={c.id} />
                      <button type="submit" className={botaoContorno}>
                        {c.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>

            <h3 className="mb-3 font-semibold">Criar nova conta</h3>
            <FormularioNovoStaff />
          </section>

          {/* Zonas e mesas */}
          <section className={painelFormulario}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Grid3x3Gap size={22} className="text-marca" aria-hidden /> Zonas
              e mesas
            </h2>

            <div className="mb-6 space-y-3">
              {zonas.map((zona) => (
                <div
                  key={zona.id}
                  className="rounded-xl border border-zinc-200 p-4"
                >
                  <p className="flex items-center gap-3 font-semibold">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marca-clara text-marca">
                      <IconeZona nome={zona.nome} />
                    </span>
                    <span>
                      {zona.nome}
                      <span className="block text-sm font-normal text-zinc-500">
                        {zona.mesas.length} mesas ·{" "}
                        {zona.mesas.reduce(
                          (total, m) => total + m.capacidade,
                          0,
                        )}{" "}
                        lugares
                      </span>
                    </span>
                  </p>

                  <ul className="mt-3 divide-y divide-zinc-100">
                    {zona.mesas.map((m, indice) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span>
                          {zona.nome} {indice + 1}{" "}
                          <span className="text-zinc-500">
                            ({m.capacidade} lugares)
                          </span>
                        </span>
                        {mesasEmUso.has(m.id) ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            atribuída a uma reserva
                          </span>
                        ) : (
                          <form action={removerMesa}>
                            <input type="hidden" name="mesaId" value={m.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 text-red-700 hover:underline"
                            >
                              <Trash size={14} aria-hidden /> Remover
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h3 className="mb-3 font-semibold">Adicionar mesa</h3>
            <FormularioNovaMesa
              zonas={zonas.map((z) => ({ id: z.id, nome: z.nome }))}
            />
          </section>
        </div>
      )}
    </div>
  );
}
