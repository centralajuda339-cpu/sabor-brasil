
"use client";

import { Printer } from "react-bootstrap-icons";
import { botaoPrimario } from "../componentes/estilos";

// Botão que abre o diálogo de impressão do navegador.
// Tem de ser um Client Component porque usa window.print() no onClick.
export default function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={botaoPrimario}
    >
      <Printer size={16} aria-hidden /> Imprimir / Guardar PDF
    </button>
  );
}
