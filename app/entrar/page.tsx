"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BoxArrowInRight } from "react-bootstrap-icons";
import { entrarCliente } from "./actions";
import Topo from "../componentes/Topo";
import Mensagem from "../componentes/Mensagem";
import {
  botaoPrimario,
  campo,
  painelFormulario,
  rotulo,
} from "../componentes/estilos";

export default function PaginaEntrar() {
  const [estado, formAction, pendente] = useActionState(entrarCliente, {
    sucesso: false,
    mensagem: "",
  });

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Topo />

      <div className={painelFormulario}>
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <BoxArrowInRight size={24} className="text-marca" aria-hidden />{" "}
          Entrar
        </h1>
        <p className="mb-5 text-sm text-zinc-500">
          Use o número de telemóvel e a palavra-passe da sua conta.
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

      <p className="mt-5 text-center text-sm text-zinc-500">
        Ainda não tem conta?{" "}
        <Link
          href="/registar"
          className="font-medium text-marca-escura underline"
        >
          Criar conta
        </Link>
      </p>
    </main>
  );
}
