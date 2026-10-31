import Link from "next/link";
import { ArrowLeft } from "react-bootstrap-icons";
import Marca from "./Marca";

// O topo das páginas: a marca e um link para voltar.
// Em ecrãs estreitos, o link passa para a linha de baixo.
export default function Topo({
  voltarPara = "/",
  voltarTexto = "Início",
  marcaHref = "/",
}: {
  voltarPara?: string;
  voltarTexto?: string;
  marcaHref?: string;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <Marca tamanho={36} href={marcaHref} />
      <Link
        href={voltarPara}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-marca-escura hover:underline"
      >
        <ArrowLeft size={14} aria-hidden /> {voltarTexto}
      </Link>
    </header>
  );
}
