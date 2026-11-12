import Spinner from "./Spinner";

// Estado de carregamento centrado, com spinner e texto.
export default function Carregando({
  texto = "A carregar...",
}: {
  texto?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
      <Spinner size={20} />
      <span className="text-sm">{texto}</span>
    </div>
  );
}
