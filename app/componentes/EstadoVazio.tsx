import type { Icon } from "react-bootstrap-icons";

// Estado vazio com ícone e mensagem — usa quando uma lista não tem itens.
export default function EstadoVazio({
  icone: Icone,
  titulo,
  mensagem,
}: {
  icone: Icon;
  titulo: string;
  mensagem?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        <Icone size={28} aria-hidden />
      </span>
      <div>
        <p className="font-semibold text-zinc-700">{titulo}</p>
        {mensagem && <p className="mt-1 text-sm text-zinc-500">{mensagem}</p>}
      </div>
    </div>
  );
}
