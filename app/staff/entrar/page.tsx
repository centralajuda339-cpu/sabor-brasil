"use client";

import { useActionState } from "react";
import { ShieldLock } from "react-bootstrap-icons";
import { entrarStaff } from "./actions";
import Topo from "../../componentes/Topo";
import Mensagem from "../../componentes/Mensagem";
import {
  botaoPrimario,
  campo,
  painelFormulario,
  rotulo,
} from "../../componentes/estilos";

export default function PaginaEntrarStaff() {
  const [estado, formAction, pendente] = useActionState(entrarStaff, {
    mensagem: "",
  });

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Topo voltarTexto="Site do cliente" />

      <div className={painelFormulario}>
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <ShieldLock size={24} className="text-marca" aria-hidden /> Área do
          restaurante
        </h1>
        <p className="mb-5 text-sm text-zinc-500">
          Acesso para staff e gestor.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="telefone" className={rotulo}>
              Número de telemóvel
            </label>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="84 123 4567"
              required
              className={campo}
            />
          </div>

          <div>
            <label htmlFor="senha" className={rotulo}>
              Palavra-passe
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className={campo}
            />
          </div>

          <button
            type="submit"
            disabled={pendente}
            className={`${botaoPrimario} w-full`}
          >
            {pendente ? "A entrar..." : "Entrar"}
          </button>

          {estado.mensagem && <Mensagem>{estado.mensagem}</Mensagem>}
        </form>
      </div>
    </main>
  );
}
