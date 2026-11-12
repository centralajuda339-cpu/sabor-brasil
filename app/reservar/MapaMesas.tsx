"use client";

import { Table } from "react-bootstrap-icons";

// Representa uma mesa disponível para seleção no formulário de reserva.
export type MesaMapa = {
  id: string;
  capacidade: number;
  indice: number; // posição visual dentro da zona (1, 2, 3...)
};

// Planta visual das mesas da zona escolhida.
// - O cliente pode clicar para escolher uma mesa específica (ou "sem preferência").
// - A cor indica a seleção atual.
// - Não mostra ocupação em tempo real (essa validação acontece no servidor ao submeter).
export default function MapaMesas({
  mesas,
  mesaSelecionadaId,
  onSelecionar,
}: {
  mesas: MesaMapa[];
  mesaSelecionadaId: string | null;
  onSelecionar: (mesaId: string | null) => void;
}) {
  if (mesas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500">
        Esta área não tem mesas configuradas. Pode continuar — o staff atribui
        uma mesa à chegada.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {mesas.map((m) => {
          const selecionada = m.id === mesaSelecionadaId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelecionar(selecionada ? null : m.id)}
              aria-pressed={selecionada}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 transition ${
                selecionada
                  ? "border-marca bg-marca-clara text-marca-escura ring-2 ring-marca/40"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <Table
                size={22}
                className={selecionada ? "text-marca" : "text-zinc-400"}
                aria-hidden
              />
              <span className="text-xs font-semibold">Mesa {m.indice}</span>
              <span className="text-[11px] text-zinc-500">
                {m.capacidade} lugares
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
            mesaSelecionadaId
              ? "bg-marca-clara text-marca-escura"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {mesaSelecionadaId ? (
            <>Mesa preferida selecionada</>
          ) : (
            <>Sem preferência — o staff atribui à chegada</>
          )}
        </span>
        {mesaSelecionadaId && (
          <button
            type="button"
            onClick={() => onSelecionar(null)}
            className="text-marca-escura underline hover:no-underline"
          >
            Limpar escolha
          </button>
        )}
      </div>
    </div>
  );
}
