import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  CalendarEvent,
  People,
  PersonPlus,
  Search,
  Telephone,
} from "react-bootstrap-icons";
import { prisma } from "../../../../lib/prisma";
import { obterStaffId } from "../../../../lib/sessao";
import { consultarClientes, MAXIMO_CLIENTES } from "../../../../lib/clientes";
import Topo from "../../../componentes/Topo";
import {
  botaoContorno,
  botaoPrimario,
  campo,
  cartao,
} from "../../../componentes/estilos";

export default function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Topo marcaHref="/staff" voltarPara="/staff/gestor" voltarTexto="Área do gestor" />
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <People size={24} className="text-marca" aria-hidden /> Clientes registados
      </h1>
      <Suspense fallback={<p className="text-zinc-500">A carregar...</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Conteudo({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: pesquisa } = await searchParams;

  const staffId = await obterStaffId();
  if (!staffId) redirect("/staff/entrar");

  const eu = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!eu || !eu.ativo) redirect("/staff/entrar");
  // Controlo de acesso por perfil: só o gestor vê a lista de clientes
  if (eu.perfil !== "GESTOR") redirect("/staff");

  const q = (pesquisa ?? "").trim();
  const { total, novosNaSemana, clientes } = await consultarClientes(q);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className={cartao}>
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <People size={16} aria-hidden /> Total de clientes
          </p>
          <p className="mt-1 text-3xl font-bold text-marca-escura">{total}</p>
        </div>
        <div className={cartao}>
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <PersonPlus size={16} aria-hidden /> Novos nos últimos 7 dias
          </p>
          <p className="mt-1 text-3xl font-bold text-marca-escura">{novosNaSemana}</p>
        </div>
      </div>

      <form action="/staff/gestor/clientes" method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Nome ou telemóvel"
          aria-label="Pesquisar clientes"
          className={`${campo} min-w-0 flex-1`}
        />
        <button type="submit" className={botaoPrimario}>
          <Search size={16} aria-hidden /> Pesquisar
        </button>
        {q && (
          <Link href="/staff/gestor/clientes" className={botaoContorno}>
            Limpar
          </Link>
        )}
      </form>

      {clientes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500">
          {q ? "Nenhum cliente corresponde à pesquisa." : "Ainda não há clientes registados."}
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-zinc-500">
            {q
              ? `${clientes.length} ${clientes.length === 1 ? "resultado" : "resultados"}`
              : total > MAXIMO_CLIENTES
                ? `A mostrar os ${MAXIMO_CLIENTES} mais recentes, de ${total}.`
                : `${total} ${total === 1 ? "cliente" : "clientes"}, do mais recente para o mais antigo.`}
          </p>

          <ul className="space-y-3">
            {clientes.map((c) => (
              <li key={c.id} className={cartao}>
                <p className="text-lg font-semibold">{c.nome}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Telephone size={14} aria-hidden /> {c.telefone}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarEvent size={14} aria-hidden /> Registado em{" "}
                    {c.dataRegisto.toLocaleDateString("pt-PT", {
                      timeZone: "Africa/Maputo",
                      dateStyle: "medium",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarCheck size={14} aria-hidden />
                    {c._count.reservas}{" "}
                    {c._count.reservas === 1 ? "reserva" : "reservas"}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
