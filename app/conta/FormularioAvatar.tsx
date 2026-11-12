"use client";

import { useActionState } from "react";
import { Image as ImageIcon } from "react-bootstrap-icons";
import { atualizarAvatar } from "./actions";
import Mensagem from "../componentes/Mensagem";
import { botaoPrimario, campo, rotulo } from "../componentes/estilos";

export default function FormularioAvatar({
  avatarUrl,
}: {
  avatarUrl: string | null;
}) {
  const [estado, formAction, pendente] = useActionState(atualizarAvatar, {
    mensagem: "",
    sucesso: false,
  });

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="avatarUrl" className={rotulo}>
          Foto de perfil (URL)
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="text"
          inputMode="url"
          defaultValue={avatarUrl ?? ""}
          placeholder="https://exemplo.com/foto.jpg"
          className={campo}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Coloque o endereço de uma imagem. Deixe vazio para usar as suas
          iniciais.
        </p>
      </div>
      <button type="submit" disabled={pendente} className={botaoPrimario}>
        <ImageIcon size={16} aria-hidden />
        {pendente ? "A guardar..." : "Guardar foto"}
      </button>
      {estado.mensagem && (
        <Mensagem tipo={estado.sucesso ? "sucesso" : "erro"}>
          {estado.mensagem}
        </Mensagem>
      )}
    </form>
  );
}
