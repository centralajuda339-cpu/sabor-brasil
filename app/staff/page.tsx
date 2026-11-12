import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BoxArrowRight,
  CalendarCheck,
  CalendarEvent,
  CashCoin,
  CheckAll,
  ClockHistory,
  ExclamationTriangle,
  Gear,
  People,
  Person,
  Search,
  Table,
  Telephone,
  XCircle,
} from "react-bootstrap-icons";
import { prisma } from "../../lib/prisma";
import { obterStaffId } from "../../lib/sessao";
import { obterPagamento } from "../../lib/pagamentos/metodos";
import { bordaEstado } from "../componentes/estilos";
import { cancelarReservasExpiradas } from "../../lib/reservas/ciclo-de-vida";
import {
  consultarHistorico,
  DIAS_HISTORICO_STAFF,
  MAXIMO_HISTORICO,
} from "../../lib/reservas/historico";
import { inicioDoDiaEmMocambique } from "../../lib/datas";
import {
  confirmarLiquidacao,
  concluirReserva,
  cancelarReservaStaff,
  sairStaff,
} from "./actions";
import AtribuirMesa from "./AtribuirMesa";
import Carregando from "../componentes/Carregando";
import Separadores from "../Separadores";
import Marca from "../componentes/Marca";
import SeloEstado from "../componentes/SeloEstado";
import IconeZona from "../componentes/IconeZona";
import {
  botaoContorno,
  botaoPerigo,
  botaoPrimario,
  campo,
  cartao,
} from "../componentes/estilos";

const VISTAS = [
  "hoje",
  "amanha",
  "proximos",
  "anteriores",
  "todas",
  "historico",
] as const;

type ReservaParaMostrar = {
  id: string;
  estado: string;
  nPessoas: number;
  dataHora: Date;
  mesaId: string | null;
  cliente: { nome: string; telefone: string };
  zona: { nome: string };
  pagamento: {
    valorPago: number;
    valorTotal: number;
    tipo: string;
    referencia: string;
  } | null;
  staff: { nome: string } | null;
  liquidadoPor: { nome: string } | null;
};

export default function PaginaStaff({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; q?: string }>;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Suspense fallback={<Carregando />}>
        <Painel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// A parte de cima de cada reserva (igual nas ativas e no histórico)
function CorpoReserva({
  r,
  rotuloMesa,
}: {
  r: ReservaParaMostrar;
  rotuloMesa: Record<string, string>;
}) {
  const p = r.pagamento;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{r.cliente.nome}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <Telephone size={14} aria-hidden /> {r.cliente.telefone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconeZona nome={r.zona.nome} tamanho={14} /> {r.zona.nome}
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
              {r.nPessoas} {r.nPessoas === 1 ? "pessoa" : "pessoas"}
            </span>
          </p>
        </div>
        <SeloEstado estado={r.estado} />
      </div>

      {p && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm">
          <p>
            Pago <strong>{p.valorPago}</strong> de {p.valorTotal} MT via{" "}
            {obterPagamento(p.tipo)?.nome ?? p.tipo}
          </p>
          <p className="text-zinc-600">
            Referência: <span className="font-mono">{p.referencia}</span>
          </p>
          {r.estado === "CANCELADA" && (
            <p className="mt-1.5 flex items-start gap-1.5 text-amber-700">
              <ExclamationTriangle
                size={14}
                className="mt-0.5 shrink-0"
                aria-hidden
              />
              Reserva cancelada com pagamento registado (sem reembolso
              automático).
            </p>
          )}
        </div>
      )}

      {r.mesaId && rotuloMesa[r.mesaId] && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-marca-clara px-3 py-1.5 text-sm font-medium text-marca-escura">
          <Table size={15} aria-hidden /> Mesa atribuída: {rotuloMesa[r.mesaId]}
        </p>
      )}

      {(r.staff?.nome || r.liquidadoPor?.nome) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {r.staff?.nome && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-marca-clara px-2.5 py-1 text-marca-escura">
              <Person size={12} aria-hidden /> Mesa atribuída por{" "}
              <strong>{r.staff.nome}</strong>
            </span>
          )}
          {r.liquidadoPor?.nome && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
              <CashCoin size={12} aria-hidden /> Pagamento confirmado por{" "}
              <strong>{r.liquidadoPor.nome}</strong>
            </span>
          )}
        </div>
      )}
    </>
  );
}

async function Painel({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; q?: string }>;
}) {
  const { vista, q: pesquisa } = await searchParams;

  const staffId = await obterStaffId();
  if (!staffId) redirect("/staff/entrar");
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff || !staff.ativo) redirect("/staff/entrar");

  const ehGestor = staff.perfil === "GESTOR";

  // Cancela as reservas que não foram pagas a tempo
  await cancelarReservasExpiradas();

  const [ativas, mesas] = await Promise.all([
    prisma.reserva.findMany({
      where: { estado: { in: ["AGUARDA_PAGAMENTO", "CONFIRMADA"] } },
      include: {
        cliente: true,
        zona: true,
        pagamento: true,
        staff: { select: { nome: true } },
        liquidadoPor: { select: { nome: true } },
      },
      orderBy: { dataHora: "asc" },
    }),
    prisma.mesa.findMany({
      include: { zona: true },
      orderBy: [{ capacidade: "asc" }, { id: "asc" }],
    }),
  ]);

  const vistaAtiva = VISTAS.find((v) => v === vista) ?? "hoje";
  const q = (pesquisa ?? "").trim();

  // O histórico só é consultado quando o separador está aberto
  let historico: typeof ativas = [];
  if (vistaAtiva === "historico") {
    historico = await consultarHistorico({ pesquisa: q, completo: ehGestor });
  }

  // Separa as reservas ativas por dia (hora de Moçambique)
  const hoje = inicioDoDiaEmMocambique(0).getTime();
  const amanha = inicioDoDiaEmMocambique(1).getTime();
  const depois = inicioDoDiaEmMocambique(2).getTime();

  const grupos = {
    hoje: ativas.filter(
      (r) => r.dataHora.getTime() >= hoje && r.dataHora.getTime() < amanha,
    ),
    amanha: ativas.filter(
      (r) => r.dataHora.getTime() >= amanha && r.dataHora.getTime() < depois,
    ),
    proximos: ativas.filter((r) => r.dataHora.getTime() >= depois),
    anteriores: ativas.filter((r) => r.dataHora.getTime() < hoje),
    todas: ativas,
  };

  // Dá um nome legível a cada mesa, por exemplo "Piscina 2 (4 lugares)"
  const contador: Record<string, number> = {};
  const rotuloMesa: Record<string, string> = {};
  const mesasDaZona: Record<string, { id: string; rotulo: string }[]> = {};
  for (const m of mesas) {
    contador[m.zonaId] = (contador[m.zonaId] ?? 0) + 1;
    const rotulo = `${m.zona.nome} ${contador[m.zonaId]} (${m.capacidade} lugares)`;
    rotuloMesa[m.id] = rotulo;
    (mesasDaZona[m.zonaId] ??= []).push({ id: m.id, rotulo });
  }

  const separadores = (
    <Separadores
      caminho="/staff"
      ativo={vistaAtiva}
      itens={[
        { chave: "hoje", rotulo: "Hoje", contagem: grupos.hoje.length },
        { chave: "amanha", rotulo: "Amanhã", contagem: grupos.amanha.length },
        {
          chave: "proximos",
          rotulo: "Próximos",
          contagem: grupos.proximos.length,
        },
        {
          chave: "anteriores",
          rotulo: "Anteriores",
          contagem: grupos.anteriores.length,
        },
        { chave: "todas", rotulo: "Todas", contagem: grupos.todas.length },
        { chave: "historico", rotulo: "Histórico" },
      ]}
    />
  );

  const cabecalho = (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <Marca href="/staff" tamanho={36} />
      <nav className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 pr-1 text-sm text-zinc-600">
          <Person size={16} aria-hidden /> {staff.nome} ·{" "}
          {ehGestor ? "Gestor" : "Staff"}
        </span>
        {ehGestor && (
          <Link href="/staff/gestor" className={botaoContorno}>
            <Gear size={16} aria-hidden /> Área do gestor
          </Link>
        )}
        <form action={sairStaff}>
          <button type="submit" className={botaoContorno}>
            <BoxArrowRight size={16} aria-hidden /> Sair
          </button>
        </form>
      </nav>
    </header>
  );

  // ----------- Separador "Histórico" -----------
  if (vistaAtiva === "historico") {
    return (
      <>
        {cabecalho}

        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <ClockHistory size={24} className="text-marca" aria-hidden />{" "}
          Histórico de reservas
        </h1>
        <p className="mb-4 text-sm text-zinc-500">
          {ehGestor
            ? `Concluídas e canceladas, de todas as datas (máximo ${MAXIMO_HISTORICO} resultados).`
            : `Concluídas e canceladas dos últimos ${DIAS_HISTORICO_STAFF} dias (máximo ${MAXIMO_HISTORICO} resultados).`}
        </p>

        {separadores}

        <form
          action="/staff"
          method="get"
          className="mb-4 flex flex-wrap gap-2"
        >
          <input type="hidden" name="vista" value="historico" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Nome, telemóvel ou referência de pagamento"
            aria-label="Pesquisar no histórico"
            className={`${campo} min-w-0 flex-1`}
          />
          <button type="submit" className={botaoPrimario}>
            <Search size={16} aria-hidden /> Pesquisar
          </button>
          {q && (
            <Link href="/staff?vista=historico" className={botaoContorno}>
              Limpar
            </Link>
          )}
        </form>

        {historico.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500">
            {q
              ? "Nenhuma reserva corresponde à pesquisa."
              : "Não há reservas no histórico."}
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-zinc-500">
              {historico.length}{" "}
              {historico.length === 1 ? "resultado" : "resultados"}
            </p>
            <ul className="space-y-3">
              {historico.map((r) => (
                <li key={r.id} className={`${cartao} ${bordaEstado(r.estado)}`}>
                  <CorpoReserva r={r} rotuloMesa={rotuloMesa} />
                </li>
              ))}
            </ul>
          </>
        )}
      </>
    );
  }

  // ----------- Reservas ativas -----------
  const reservas = grupos[vistaAtiva];

  return (
    <>
      {cabecalho}

      <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold">
        <CalendarCheck size={24} className="text-marca" aria-hidden /> Reservas
        ativas
      </h1>

      {separadores}

      {reservas.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500">
          Não há reservas neste separador.
        </p>
      )}

      <ul className="space-y-3">
        {reservas.map((r) => {
          const p = r.pagamento;
          const emFalta = p ? p.valorTotal - p.valorPago : 0;
          const totalmentePago = p ? p.valorPago >= p.valorTotal : false;

          return (
            <li key={r.id} className={`${cartao} ${bordaEstado(r.estado)}`}>
              <CorpoReserva r={r} rotuloMesa={rotuloMesa} />

              {r.estado === "CONFIRMADA" && (
                <>
                  <AtribuirMesa
                    reservaId={r.id}
                    mesas={mesasDaZona[r.zonaId] ?? []}
                    mesaAtualId={r.mesaId}
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    {p && emFalta > 0 && (
                      <form action={confirmarLiquidacao}>
                        <input type="hidden" name="reservaId" value={r.id} />
                        <button type="submit" className={botaoContorno}>
                          <CashCoin size={16} aria-hidden /> Confirmar pagamento
                          do restante ({emFalta} MT)
                        </button>
                      </form>
                    )}
                    {r.mesaId && totalmentePago && (
                      <form action={concluirReserva}>
                        <input type="hidden" name="reservaId" value={r.id} />
                        <button type="submit" className={botaoContorno}>
                          <CheckAll size={16} aria-hidden /> Concluir
                          atendimento
                        </button>
                      </form>
                    )}
                  </div>
                </>
              )}

              <form
                action={cancelarReservaStaff}
                className="mt-3 border-t border-zinc-100 pt-3"
              >
                <input type="hidden" name="reservaId" value={r.id} />
                <button type="submit" className={botaoPerigo}>
                  <XCircle size={16} aria-hidden /> Cancelar reserva
                </button>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Liberta os lugares da área (e a mesa, se estava atribuída).
                </p>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
}
