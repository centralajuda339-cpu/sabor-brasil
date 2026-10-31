"use client";

import { useActionState } from "react";
import { Bank, Phone } from "react-bootstrap-icons";
import { pagarReserva } from "./actions";
import Mensagem from "../../../componentes/Mensagem";
import {
  botaoPrimario,
  opcaoSelecionavel,
  rotulo,
} from "../../../componentes/estilos";

function IconeMetodo({ tipo }: { tipo: string }) {
  return tipo === "BANCO" ? (
    <Bank size={20} aria-hidden />
  ) : (
    <Phone size={20} aria-hidden />
  );
}

export default function FormularioPagamento({
  reservaId,
  total,
  minimo,
  metodos,
}: {
  reservaId: string;
  total: number;
  minimo: number;
  metodos: { tipo: string; nome: string }[];
}) {
  const [estado, formAction, pendente] = useActionState(pagarReserva, {
    mensagem: "",
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="reservaId" value={reservaId} />

      <fieldset className="space-y-2">
        <legend className={rotulo}>Quanto quer pagar agora?</legend>

        <label className="block">
          <input
            type="radio"
            name="modalidade"
            value="SINAL"
            defaultChecked
            className="peer sr-only"
          />
          <div className={opcaoSelecionavel}>
            <div>
              <p>
                Pagamento parcial: <strong>{minimo} MT</strong>
              </p>
              <p className="text-xs text-zinc-500">
                Garante a sua reserva. Os restantes {total - minimo} MT paga no
                restaurante, com a mesma referência.
              </p>
            </div>
          </div>
        </label>

        <label className="block">
          <input
            type="radio"
            name="modalidade"
            value="TOTAL"
            className="peer sr-only"
          />
          <div className={opcaoSelecionavel}>
            <div>
              <p>
                Pagamento total: <strong>{total} MT</strong>
              </p>
              <p className="text-xs text-zinc-500">Reserva totalmente paga.</p>
            </div>
          </div>
        </label>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={rotulo}>Método de pagamento</legend>
        {metodos.map((m, indice) => (
          <label key={m.tipo} className="block">
            <input
              type="radio"
              name="metodo"
              value={m.tipo}
              defaultChecked={indice === 0}
              className="peer sr-only"
            />
            <div className={opcaoSelecionavel}>
              <span className="text-marca">
                <IconeMetodo tipo={m.tipo} />
              </span>
              {m.nome}
            </div>
          </label>
        ))}
      </fieldset>

      <p className="text-xs text-zinc-500">
        Pagamento simulado: não é feita nenhuma cobrança real.
      </p>

      <button
        type="submit"
        disabled={pendente}
        className={`${botaoPrimario} w-full`}
      >
        {pendente ? "A processar..." : "Pagar"}
      </button>

      {estado.mensagem && <Mensagem>{estado.mensagem}</Mensagem>}
    </form>
  );
}
