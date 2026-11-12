import { KeyFill } from "react-bootstrap-icons";
import Topo from "../../componentes/Topo";
import { painelFormulario } from "../../componentes/estilos";
import FormularioSenha from "./FormularioSenha";

export const metadata = { title: "Mudar palavra-passe" };

export default function PaginaMudarSenha() {
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Topo voltarPara="/conta" voltarTexto="Minha conta" />

      <div className={painelFormulario}>
        <h1 className="mb-5 flex items-center gap-2 text-2xl font-bold">
          <KeyFill size={24} className="text-marca" aria-hidden />
          Mudar palavra-passe
        </h1>

        <FormularioSenha />
      </div>
    </main>
  );
}
