import { Suspense } from "react";
import Link from "next/link";
import Carregando from "../componentes/Carregando";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  CalendarCheck,
  CalendarEvent,
  CashStack,
  CheckAll,
  ClockHistory,
  FileEarmarkPdf,
  GiftFill,
  KeyFill,
  People,
  Person,
  Search,
  Telephone,
  Ticket,
} from "react-bootstrap-icons";
import { prisma } from "../../lib/prisma";
import { obterClienteId } from "../../lib/sessao";
import { obterPagamento } from "../../lib/pagamentos/metodos";
import { listarCuponsCliente } from "../../lib/cupons";
import { agora } from "../../lib/datas";
import { bordaEstado } from "../componentes/estilos";
import Topo from "../componentes/Topo";
import Avatar from "../componentes/Avatar";
import EstadoVazio from "../componentes/EstadoVazio";
import SeloEstado from "../componentes/SeloEstado";
import IconeZona from "../componentes/IconeZona";
import Suporte from "../componentes/Suporte";
import Separadores from "../Separadores";
import FormularioAvatar from "./FormularioAvatar";
import BotaoCupom from "./BotaoCupom";
import {
  botaoContorno,
  botaoPrimario,
  campo,
  cartao,
  painelFormulario,
} from "../componentes/estilos";

export const metadata = { title: "Minha conta" };

const ABAS = ["resumo", "reservas", "perfil"] as const;
type Aba = (typeof ABAS)[number];

export default function PaginaConta({
  searchParams,
}: {
  searchParams: Promise<{
    aba?: string;
    vista?: string;
    q?: string;
    data?: string;
  }>;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Topo />
      <Suspense fallback={<Carregando />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function formatarDuracao(ms: number): string {
  const dias = Math.floor(ms / (24 * 3600 * 1000));
  if (dias < 1) return "hoje";
  if (dias < 30) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  if (mesesRestantes === 0) return `há ${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `há ${anos} ${anos === 1 ? "ano" : "anos"} e ${mesesRestantes} ${
    mesesRestantes === 1 ? "mês" : "meses"
  }`;
}

async function Conteudo({
  searchParams,
}: {
  searchParams: Promise<{
    aba?: string;
    vista?: string;
    q?: string;
    data?: string;
  }>;
}) {
  const { aba, vista, q: pesquisa, data } = await searchParams;

  // Indica ao Next.js que esta página depende da hora atual (não pode ser estática)
  await connection();

  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) redirect("/entrar");

  // Todas as reservas do cliente com zona, pagamento e staff
  const todas = await prisma.reserva.findMany({
    where: { clienteId },
    include: {
      zona: true,
      pagamento: true,
      staff: { select: { nome: true } },
      liquidadoPor: { select: { nome: true } },
    },
    orderBy: { dataHora: "desc" },
  });

  // Estatísticas
  const agoraMs = agora();
  const reservasConcluidas = todas.filter((r) => r.estado === "CONCLUIDA");
  const totalGasto = todas
    .filter((r) => r.pagamento)
    .reduce((s, r) => s + (r.pagamento!.valorPago || 0), 0);
  const totalReservas = todas.length;
  const tempoComoCliente = formatarDuracao(
    agoraMs - cliente.dataRegisto.getTime(),
  );

  // Cupões
  const cupons = await listarCuponsCliente(clienteId);

  // Filtros da pesquisa (só usados na aba Reservas)
  const termo = (pesquisa ?? "").trim().toLowerCase();
  const dataFiltro = (data ?? "").trim();

  const filtradas = todas.filter((r) => {
    if (dataFiltro) {
      const dataReserva = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Maputo",
      }).format(r.dataHora);
      if (dataReserva !== dataFiltro) return false;
    }
    if (termo) {
      const ref = r.pagamento?.referencia.toLowerCase() ?? "";
      const idCurto = r.id.toLowerCase().slice(-6);
      const zona = r.zona.nome.toLowerCase();
      const estado = r.estado.toLowerCase();
      const staffMesaMatch = (r.staff?.nome?.toLowerCase() ?? "").includes(
        termo,
      );
      const liquidadoMatch = (
        r.liquidadoPor?.nome?.toLowerCase() ?? ""
      ).includes(termo);
      if (
        !ref.includes(termo) &&
        !idCurto.includes(termo) &&
        !zona.includes(termo) &&
        !estado.includes(termo) &&
        !staffMesaMatch &&
        !liquidadoMatch
      ) {
        return false;
      }
    }
    return true;
  });

  // Separar ativas e histórico
  const ESTADOS_ATIVOS = ["PENDENTE", "AGUARDA_PAGAMENTO", "CONFIRMADA"];
  const ativas = filtradas
    .filter((r) => ESTADOS_ATIVOS.includes(r.estado))
    .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime());
  const historico = filtradas.filter((r) => !ESTADOS_ATIVOS.includes(r.estado));
  const vistaAtiva = vista === "historico" ? "historico" : "ativas";
  const reservasAMostrar = vistaAtiva === "ativas" ? ativas : historico;

  const abaAtiva: Aba = ABAS.find((a) => a === aba) ?? "resumo";

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página com título explícito */}
      <section>
        <h1 className="text-2xl font-bold text-marca-escura">Minha conta</h1>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Avatar
            nome={cliente.nome}
            avatarUrl={cliente.avatarUrl}
            tamanho={56}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{cliente.nome}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <Telephone size={14} aria-hidden /> {cliente.telefone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClockHistory size={14} aria-hidden /> Cliente{" "}
                {tempoComoCliente}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Separadores principais */}
      <Separadores
        caminho="/conta"
        ativo={abaAtiva}
        paramName="aba"
        itens={[
          { chave: "resumo", rotulo: "Resumo" },
          { chave: "reservas", rotulo: "Reservas" },
          { chave: "perfil", rotulo: "Perfil" },
        ]}
      />

      {/* ================= ABA: RESUMO ================= */}
      {abaAtiva === "resumo" && (
        <div className="space-y-6">
          {/* Estatísticas */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={cartao}>
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CalendarCheck size={14} aria-hidden /> Reservas
              </p>
              <p className="mt-1 text-2xl font-bold text-marca-escura">
                {totalReservas}
              </p>
            </div>
            <div className={cartao}>
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckAll size={14} aria-hidden /> Concluídas
              </p>
              <p className="mt-1 text-2xl font-bold text-marca-escura">
                {reservasConcluidas.length}
              </p>
            </div>
            <div className={cartao}>
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CashStack size={14} aria-hidden /> Total gasto
              </p>
              <p className="mt-1 text-2xl font-bold text-marca-escura">
                {totalGasto.toLocaleString("pt-PT")} MT
              </p>
            </div>
            <div className={cartao}>
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Ticket size={14} aria-hidden /> Cupões
              </p>
              <p className="mt-1 text-2xl font-bold text-marca-escura">
                {cupons.filter((c) => !c.usadoEm).length}
              </p>
            </div>
          </section>

          {/* Cupões */}
          <section className={painelFormulario}>
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
              <GiftFill size={20} className="text-marca" aria-hidden />
              Cupões de fidelidade
            </h2>
            <p className="mb-4 text-sm text-zinc-500">
              Conclua várias reservas no mesmo mês e recebe um cupão de desconto
              para a próxima visita.
            </p>

            {cupons.length === 0 ? (
              <EstadoVazio
                icone={Ticket}
                titulo="Ainda não tem cupões"
                mensagem="Conclua reservas neste mês para ganhar o primeiro."
              />
            ) : (
              <ul className="space-y-2">
                {cupons.map((c) => {
                  const valido = !c.usadoEm && c.validoAte.getTime() > agoraMs;
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 p-3"
                    >
                      <div>
                        <p className="font-mono text-base font-bold tracking-wider text-marca-escura">
                          {c.codigo}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {c.percentagem}% de desconto ·{" "}
                          {valido
                            ? `válido até ${c.validoAte.toLocaleDateString(
                                "pt-PT",
                                {
                                  timeZone: "Africa/Maputo",
                                  dateStyle: "medium",
                                },
                              )}`
                            : c.usadoEm
                              ? "já utilizado"
                              : "expirado"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          valido
                            ? "bg-green-100 text-green-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {valido
                          ? "Pronto a usar"
                          : c.usadoEm
                            ? "Usado"
                            : "Expirado"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4">
              <BotaoCupom />
            </div>
          </section>

          {/* Atalhos rápidos para as outras abas */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/conta?aba=reservas"
              className={`${cartao} flex items-center gap-3 transition hover:bg-marca-clara`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marca-clara text-marca">
                <CalendarEvent size={20} aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">
                  Ver as minhas reservas
                </span>
                <span className="block text-sm text-zinc-500">
                  {ativas.length} ativas · {historico.length} no histórico
                </span>
              </span>
            </Link>
            <Link
              href="/conta?aba=perfil"
              className={`${cartao} flex items-center gap-3 transition hover:bg-marca-clara`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-marca-clara text-marca">
                <Person size={20} aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">Editar perfil</span>
                <span className="block text-sm text-zinc-500">
                  Foto, palavra-passe e dados
                </span>
              </span>
            </Link>
          </section>

          {/* Apoio */}
          <Suporte />
        </div>
      )}

      {/* ================= ABA: RESERVAS ================= */}
      {abaAtiva === "reservas" && (
        <div className="space-y-6">
          {/* Pesquisa */}
          <section className={painelFormulario}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Search size={20} className="text-marca" aria-hidden /> Procurar
              reserva
            </h2>
            <form action="/conta" method="get" className="flex flex-wrap gap-2">
              <input type="hidden" name="aba" value="reservas" />
              <input
                type="search"
                name="q"
                defaultValue={termo}
                placeholder="Referência, número, zona ou estado"
                aria-label="Termo de pesquisa"
                className={`${campo} min-w-0 flex-1`}
              />
              <input
                type="date"
                name="data"
                defaultValue={dataFiltro}
                aria-label="Filtrar por data"
                className={`${campo} sm:w-auto`}
              />
              <button type="submit" className={botaoPrimario}>
                <Search size={16} aria-hidden /> Pesquisar
              </button>
              {(termo || dataFiltro) && (
                <Link href="/conta?aba=reservas" className={botaoContorno}>
                  Limpar
                </Link>
              )}
            </form>
          </section>

          {/* Sub-separadores Ativas / Histórico — custom para preservar aba=reservas */}
          <section>
            <nav
              className="mb-4 flex flex-wrap gap-2"
              aria-label="Filtros de reservas"
            >
              <Link
                href="/conta?aba=reservas&vista=ativas"
                aria-current={vistaAtiva === "ativas" ? "page" : undefined}
                className={
                  vistaAtiva === "ativas"
                    ? "inline-flex items-center gap-2 rounded-full bg-marca px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
                    : "inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-700 transition hover:bg-marca-clara"
                }
              >
                Ativas
                <span
                  className={
                    vistaAtiva === "ativas"
                      ? "rounded-full bg-white/20 px-1.5 text-xs"
                      : "rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-600"
                  }
                >
                  {ativas.length}
                </span>
              </Link>
              <Link
                href="/conta?aba=reservas&vista=historico"
                aria-current={vistaAtiva === "historico" ? "page" : undefined}
                className={
                  vistaAtiva === "historico"
                    ? "inline-flex items-center gap-2 rounded-full bg-marca px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
                    : "inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-700 transition hover:bg-marca-clara"
                }
              >
                Histórico
                <span
                  className={
                    vistaAtiva === "historico"
                      ? "rounded-full bg-white/20 px-1.5 text-xs"
                      : "rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-600"
                  }
                >
                  {historico.length}
                </span>
              </Link>
            </nav>

            {reservasAMostrar.length === 0 ? (
              <EstadoVazio
                icone={CalendarEvent}
                titulo={
                  termo || dataFiltro
                    ? "Nenhum resultado"
                    : vistaAtiva === "ativas"
                      ? "Sem reservas ativas"
                      : "Sem histórico"
                }
                mensagem={
                  termo || dataFiltro
                    ? "Nenhuma reserva corresponde à pesquisa."
                    : vistaAtiva === "ativas"
                      ? "Faça uma nova reserva para aparecer aqui."
                      : "As reservas concluídas e canceladas aparecem aqui."
                }
              />
            ) : (
              <ul className="space-y-3">
                {reservasAMostrar.map((r) => {
                  const p = r.pagamento;
                  const staffMesa = r.staff?.nome;
                  const staffLiq = r.liquidadoPor?.nome;

                  return (
                    <li
                      key={r.id}
                      className={`${cartao} ${bordaEstado(r.estado)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 text-lg font-semibold">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marca-clara text-marca">
                              <IconeZona nome={r.zona.nome} tamanho={16} />
                            </span>
                            {r.zona.nome}
                          </p>
                          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
                            <span className="inline-flex items-center gap-1.5">
                              Ref.:{" "}
                              <span className="font-mono">
                                {(
                                  p?.referencia ?? r.id.slice(-6)
                                ).toUpperCase()}
                              </span>
                            </span>
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
                              {r.nPessoas}{" "}
                              {r.nPessoas === 1 ? "pessoa" : "pessoas"}
                            </span>
                          </p>
                        </div>
                        <SeloEstado estado={r.estado} />
                      </div>

                      {(staffMesa || staffLiq) && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {staffMesa && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-marca-clara px-2.5 py-1 text-marca-escura">
                              <Person size={12} aria-hidden /> Mesa atribuída
                              por <strong>{staffMesa}</strong>
                            </span>
                          )}
                          {staffLiq && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
                              <CashStack size={12} aria-hidden /> Pagamento
                              confirmado por <strong>{staffLiq}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {p && (
                        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm">
                          <p>
                            Pago <strong>{p.valorPago}</strong> de{" "}
                            {p.valorTotal} MT via{" "}
                            {obterPagamento(p.tipo)?.nome ?? p.tipo}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/reservas/${r.id}/recibo`}
                          className={botaoContorno}
                          target="_blank"
                        >
                          <FileEarmarkPdf size={16} aria-hidden /> Ver recibo
                          (PDF)
                        </Link>
                        {r.estado === "AGUARDA_PAGAMENTO" && (
                          <Link
                            href={`/reservas/${r.id}/pagar`}
                            className={botaoPrimario}
                          >
                            <CashStack size={16} aria-hidden /> Pagar
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* ================= ABA: PERFIL ================= */}
      {abaAtiva === "perfil" && (
        <div className="space-y-6">
          {/* Dados pessoais */}
          <section className={painelFormulario}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Person size={20} className="text-marca" aria-hidden /> Dados
              pessoais
            </h2>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Nome
                </dt>
                <dd className="mt-1 font-medium">{cliente.nome}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Telemóvel
                </dt>
                <dd className="mt-1 font-medium">{cliente.telefone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Cliente desde
                </dt>
                <dd className="mt-1 font-medium">
                  {cliente.dataRegisto.toLocaleDateString("pt-PT", {
                    timeZone: "Africa/Maputo",
                    dateStyle: "long",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Tempo como cliente
                </dt>
                <dd className="mt-1 font-medium">{tempoComoCliente}</dd>
              </div>
            </dl>
          </section>

          {/* Foto de perfil */}
          <section className={painelFormulario}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Person size={20} className="text-marca" aria-hidden /> Foto de
              perfil
            </h2>
            <FormularioAvatar avatarUrl={cliente.avatarUrl} />
          </section>

          {/* Segurança */}
          <section className={painelFormulario}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <KeyFill size={20} className="text-marca" aria-hidden /> Segurança
            </h2>
            <p className="mb-4 text-sm text-zinc-500">
              Mantenha a sua conta segura. Pode mudar a palavra-passe a qualquer
              momento.
            </p>
            <Link href="/conta/senha" className={botaoPrimario}>
              <KeyFill size={16} aria-hidden /> Mudar palavra-passe
            </Link>
          </section>

          {/* Apoio */}
          <Suporte />
        </div>
      )}
    </div>
  );
}

