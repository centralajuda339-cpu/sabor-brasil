"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Clock } from "react-bootstrap-icons";
import { criarReserva } from "./actions";
import MapaMesas, { type MesaMapa } from "./MapaMesas";
import IconeZona from "../componentes/IconeZona";
import Spinner from "../componentes/Spinner";
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
  zonas: {
    id: string;
    nome: string;
    mesas: { id: string; capacidade: number; indice: number }[];
  }[];
}) {
  const [estado, formAction, pendente] = useActionState(criarReserva, {
    mensagem: "",
  });
  const [zonaSelecionada, setZonaSelecionada] = useState(zonas[0]?.id ?? "");
  const [mesaSelecionada, setMesaSelecionada] = useState<string | null>(null);

  // Mapa de mesas por zona (pré-carregado do servidor)
  const mesasDaZona: MesaMapa[] =
    zonas.find((z) => z.id === zonaSelecionada)?.mesas ?? [];

  function aoMudarZona(novaZona: string) {
    setZonaSelecionada(novaZona);
    setMesaSelecionada(null); // reset da mesa ao mudar de zona
  }

  return (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className={rotulo}>Área preferida</legend>
        <div className="grid grid-cols-3 gap-2">
          {zonas.map((zona) => (
            <label key={zona.id} className="block">
              <input
                type="radio"
                name="zonaId"
                value={zona.id}
                checked={zonaSelecionada === zona.id}
                onChange={() => aoMudarZona(zona.id)}
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

      {/* Planta visual das mesas */}
      <div>
        <p className={rotulo}>Escolha uma mesa (opcional)</p>
        <MapaMesas
          mesas={mesasDaZona}
          mesaSelecionadaId={mesaSelecionada}
          onSelecionar={setMesaSelecionada}
        />
        {/* Campo hidden para enviar a mesa preferida ao submeter */}
        <input type="hidden" name="mesaId" value={mesaSelecionada ?? ""} />
      </div>

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
        {pendente ? (
          <>
            <Spinner size={16} /> A verificar...
          </>
        ) : (
          "Reservar"
        )}
      </button>

      {estado.mensagem && <Mensagem>{estado.mensagem}</Mensagem>}
    </form>
  );
}
