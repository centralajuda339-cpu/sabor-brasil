"use client";

import { useActionState } from "react";
import { KeyFill } from "react-bootstrap-icons";
import { mudarSenha } from "../actions";
import Mensagem from "../../componentes/Mensagem";
import Spinner from "../../componentes/Spinner";
import CampoSenha from "../../componentes/CampoSenha";
import { botaoPrimario } from "../../componentes/estilos";

const ESTADO_INICIAL = { mensagem: "", sucesso: false };

export default function FormularioSenha() {
  const [estado, formAction, pendente] = useActionState(
    mudarSenha,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="space-y-4">
      <CampoSenha
        id="senhaAtual"
        name="senhaAtual"
        label="Palavra-passe atual"
        autoComplete="current-password"
        required
      />
      <CampoSenha
        id="novaSenha"
        name="novaSenha"
        label="Nova palavra-passe (mínimo 6 caracteres)"
        autoComplete="new-password"
        required
      />
      <CampoSenha
        id="confirmarSenha"
        name="confirmarSenha"
        label="Confirmar nova palavra-passe"
        autoComplete="new-password"
        required
      />

      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        A confirmação por SMS ainda não está ativa (integração pendente). A
        mudança fica registada de imediato.
      </p>

      <button type="submit" disabled={pendente} className={botaoPrimario}>
        <KeyFill size={16} aria-hidden />
        {pendente ? (
          <>
            <Spinner size={16} /> A guardar...
          </>
        ) : (
          "Atualizar palavra-passe"
        )}
      </button>

      {estado.mensagem && (
        <Mensagem tipo={estado.sucesso ? "sucesso" : "erro"}>
          {estado.mensagem}
        </Mensagem>
      )}
    </form>
  );
}
