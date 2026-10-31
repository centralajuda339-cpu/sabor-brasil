"use client";

import { useActionState } from "react";
import { Clock } from "react-bootstrap-icons";
import { criarReserva } from "./actions";
import IconeZona from "../componentes/IconeZona";
import Mensagem from "../componentes/Mensagem";
import {
  botaoPrimario,
  campo,
  opcaoSelecionavel,
  rotulo,
} from "../componentes/estilos";

export default function FormularioReserva({
  zonas,
}: {
  zonas: { id: string; nome: string }[];
}) {
  const [estado, formAction, pendente] = useActionState(criarReserva, {
    mensagem: "",
  });

  return (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className={rotulo}>Área preferida</legend>
        <div className="grid grid-cols-3 gap-2">
          {zonas.map((zona, indice) => (
            <label key={zona.id} className="block">
              <input
                type="radio"
                name="zonaId"
                value={zona.id}
                defaultChecked={indice === 0}
                className="peer sr-only"
              />
              <div
                className={`${opcaoSelecionavel} flex-col justify-center py-4 text-center`}
              >
                <span className="text-marca">
                  <IconeZona nome={zona.nome} tamanho={26} />
                </span>
                <span className="text-sm font-medium">{zona.nome}</span>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="nPessoas" className={rotulo}>
          Número de pessoas
        </label>
        <input
          id="nPessoas"
          name="nPessoas"
          type="number"
          min={1}
          defaultValue={2}
          required
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="dataHora" className={rotulo}>
          Data e hora
        </label>
        <input
          id="dataHora"
          name="dataHora"
          type="datetime-local"
          required
          className={campo}
        />
        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
          <Clock size={12} aria-hidden /> Cada reserva dura 2 horas.
        </p>
      </div>

      <button
        type="submit"
        disabled={pendente}
        className={`${botaoPrimario} w-full`}
      >
        {pendente ? "A verificar..." : "Reservar"}
      </button>

      {estado.mensagem && <Mensagem>{estado.mensagem}</Mensagem>}
    </form>
  );
}
