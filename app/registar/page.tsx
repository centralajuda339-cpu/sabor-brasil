"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PersonPlus } from "react-bootstrap-icons";
import CampoSenha from "../componentes/CampoSenha";
import { registarCliente } from "./actions";
import Topo from "../componentes/Topo";
import Mensagem from "../componentes/Mensagem";
import Spinner from "../componentes/Spinner";
import {
  botaoPrimario,
  campo,
  painelFormulario,
  rotulo,
} from "../componentes/estilos";

export default function PaginaRegisto() {
  const [estado, formAction, pendente] = useActionState(registarCliente, {
    sucesso: false,
    mensagem: "",
  });

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Topo />

      <div className={painelFormulario}>
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <PersonPlus size={24} className="text-marca" aria-hidden /> Criar
          conta
        </h1>
        <p className="mb-5 text-sm text-zinc-500">
          Só precisa do nome, do telemóvel e de uma palavra-passe.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="nome" className={rotulo}>
              Nome completo
            </label>
            <input
              id="nome"
              name="nome"
              autoComplete="name"
              required
              className={campo}
            />
          </div>

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

          <CampoSenha
            id="senha"
            name="senha"
            label="Palavra-passe (mínimo 6 caracteres)"
            autoComplete="new-password"
            required
          />

          <CampoSenha
            id="confirmacao"
            name="confirmacao"
            label="Repita a palavra-passe"
            autoComplete="new-password"
            required
          />

          <p className="text-xs text-zinc-500">
            A verificação por código SMS ficará disponível em breve.
          </p>

          <button
            type="submit"
            disabled={pendente}
            className={`${botaoPrimario} w-full`}
          >
            {pendente ? (
              <>
                <Spinner size={16} /> A criar...
              </>
            ) : (
              "Criar conta"
            )}
          </button>

          {estado.mensagem && (
            <Mensagem tipo={estado.sucesso ? "sucesso" : "erro"}>
              {estado.mensagem}
              {estado.sucesso && (
                <>
                  {" "}
                  <Link href="/entrar" className="font-semibold underline">
                    Entrar agora
                  </Link>
                </>
              )}
            </Mensagem>
          )}
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-zinc-500">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="font-medium text-marca-escura underline"
        >
          Entrar
        </Link>
      </p>
    </main>
  );
}
