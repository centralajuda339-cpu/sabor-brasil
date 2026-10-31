import Link from "next/link";

export default function Separadores({
  caminho,
  ativo,
  itens,
}: {
  caminho: string;
  ativo: string;
  itens: { chave: string; rotulo: string; contagem?: number }[];
}) {
  return (
    <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filtros">
      {itens.map((item) => {
        const selecionado = item.chave === ativo;
        return (
          <Link
            key={item.chave}
            href={`${caminho}?vista=${item.chave}`}
            aria-current={selecionado ? "page" : undefined}
            className={
              selecionado
                ? "inline-flex items-center gap-2 rounded-full bg-marca px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
                : "inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-700 transition hover:bg-marca-clara"
            }
          >
            {item.rotulo}
            {item.contagem !== undefined && (
              <span
                className={
                  selecionado
                    ? "rounded-full bg-white/20 px-1.5 text-xs"
                    : "rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-600"
                }
              >
                {item.contagem}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
