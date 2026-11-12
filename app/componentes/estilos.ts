// Estilos reutilizados em todas as páginas.
// Para mudar o aspeto de todos os botões, é só mexer aqui.
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:cursor-not-allowed disabled:opacity-50";

export const botaoPrimario = `${base} bg-marca text-white shadow-sm hover:bg-marca-escura`;

export const botaoContorno = `${base} border border-marca/40 bg-white text-marca-escura hover:bg-marca-clara`;

export const botaoPerigo = `${base} border border-red-200 bg-white text-red-700 hover:bg-red-50`;

export const campo =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:border-marca focus:outline-none focus:ring-2 focus:ring-marca/30";

export const rotulo = "mb-1 block text-sm font-medium text-zinc-700";

export const cartao =
  "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-150 hover:shadow-md hover:-translate-y-0.5";

export const painelFormulario =
  "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm";

// Cartão de escolha (usado com um botão de rádio escondido antes dele)
export const opcaoSelecionavel =
  "flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-300 bg-white p-3 transition hover:bg-zinc-50 peer-checked:border-marca peer-checked:bg-marca-clara peer-checked:ring-2 peer-checked:ring-marca/30 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-marca";

// Classe de borda esquerda colorida conforme o estado da reserva
export function bordaEstado(estado: string): string {
  switch (estado) {
    case "CONFIRMADA":
      return "border-l-4 border-l-green-500";
    case "AGUARDA_PAGAMENTO":
      return "border-l-4 border-l-amber-500";
    case "CONCLUIDA":
      return "border-l-4 border-l-blue-500";
    case "CANCELADA":
      return "border-l-4 border-l-red-500";
    default:
      return "border-l-4 border-l-zinc-300";
  }
}
