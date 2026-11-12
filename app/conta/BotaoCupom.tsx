"use client";

import { useActionState } from "react";
import { GiftFill } from "react-bootstrap-icons";
import { tentarGerarCupom } from "./actions";
import { botaoContorno } from "../componentes/estilos";

export default function BotaoCupom() {
  const [estado, formAction, pendente] = useActionState(tentarGerarCupom, {
    gerado: false,
    motivo: "",
  });

  return (
    <form action={formAction}>
      <button type="submit" disabled={pendente} className={botaoContorno}>
        <GiftFill size={16} aria-hidden />
        {pendente ? "A verificar..." : "Verificar cupão do mês"}
      </button>
      {estado.motivo && (
        <p className="mt-2 text-sm text-zinc-600">{estado.motivo}</p>
      )}
    </form>
  );
}
