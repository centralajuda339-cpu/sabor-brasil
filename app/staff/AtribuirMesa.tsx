"use client";

import { useActionState } from "react";
import { Table } from "react-bootstrap-icons";
import { atribuirMesa } from "./actions";
import Mensagem from "../componentes/Mensagem";
import { botaoContorno } from "../componentes/estilos";

export default function AtribuirMesa({
  reservaId,
  mesas,
  mesaAtualId,
}: {
  reservaId: string;
  mesas: { id: string; rotulo: string }[];
  mesaAtualId: string | null;
}) {
  const [estado, formAction, pendente] = useActionState(atribuirMesa, {
    mensagem: "",
  });

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="reservaId" value={reservaId} />

      <div className="flex flex-wrap items-center gap-2">
        <select
          name="mesaId"
          defaultValue={mesaAtualId ?? ""}
          aria-label="Escolher mesa"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-marca focus:outline-none focus:ring-2 focus:ring-marca/30"
        >
          <option value="" disabled>
            Escolher mesa...
          </option>
          {mesas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.rotulo}
            </option>
          ))}
        </select>

        <button type="submit" disabled={pendente} className={botaoContorno}>
          <Table size={15} aria-hidden />
          {mesaAtualId ? "Mudar mesa" : "Atribuir mesa"}
        </button>
      </div>

      {estado.mensagem && (
        <div className="mt-2">
          <Mensagem>{estado.mensagem}</Mensagem>
        </div>
      )}
    </form>
  );
}
