import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  CashCoin,
  Grid3x3Gap,
  PeopleFill,
  Person,
  ShieldCheck,
  Trash,
} from "react-bootstrap-icons";
import { prisma } from "../../../lib/prisma";
import { obterStaffId } from "../../../lib/sessao";
import { obterConfiguracao } from "../../../lib/configuracao";
import { alternarAtivoStaff, removerMesa } from "./actions";
import {
  FormularioConfiguracao,
  FormularioNovoStaff,
  FormularioNovaMesa,
} from "./Formularios";
import Topo from "../../componentes/Topo";
import IconeZona from "../../componentes/IconeZona";
import { botaoContorno, painelFormulario } from "../../componentes/estilos";

export default function PaginaGestor() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Topo
        marcaHref="/staff"
        voltarPara="/staff"
        voltarTexto="Painel de reservas"
      />
      <h1 className="mb-6 text-2xl font-bold">Área do gestor</h1>
      <Suspense fallback={<p className="text-zinc-500">A carregar...</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  const staffId = await obterStaffId();
  if (!staffId) redirect("/staff/entrar");

  const eu = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!eu || !eu.ativo) redirect("/staff/entrar");
  // Controlo de acesso por perfil: só o gestor vê esta página
  if (eu.perfil !== "GESTOR") redirect("/staff");

  const [config, contas, zonas, reservasComMesa] = await Promise.all([
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
  ]);

  const mesasEmUso = new Set(reservasComMesa.map((r) => r.mesaId));

  return (
    <div className="space-y-6">
      <section className={painelFormulario}>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <CashCoin size={22} className="text-marca" aria-hidden /> Valores da
          reserva
        </h2>
        <FormularioConfiguracao
          taxaPorPessoa={config.taxaPorPessoa}
          percentagemMinima={config.percentagemMinima}
        />
      </section>

      <section className={painelFormulario}>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <PeopleFill size={22} className="text-marca" aria-hidden /> Contas do
          restaurante
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

      <section className={painelFormulario}>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Grid3x3Gap size={22} className="text-marca" aria-hidden /> Zonas e
          mesas
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
                    {zona.mesas.reduce((total, m) => total + m.capacidade, 0)}{" "}
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
  );
}
