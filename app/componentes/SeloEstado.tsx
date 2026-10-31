import {
  CheckAll,
  CheckCircleFill,
  Clock,
  HourglassSplit,
  XCircleFill,
} from "react-bootstrap-icons";
import type { Icon } from "react-bootstrap-icons";

const ESTADOS: Record<string, { texto: string; classes: string; Icone: Icon }> =
  {
    PENDENTE: {
      texto: "Pendente",
      classes: "bg-zinc-100 text-zinc-700",
      Icone: Clock,
    },
    AGUARDA_PAGAMENTO: {
      texto: "Aguarda pagamento",
      classes: "bg-amber-100 text-amber-800",
      Icone: HourglassSplit,
    },
    CONFIRMADA: {
      texto: "Confirmada",
      classes: "bg-green-100 text-green-800",
      Icone: CheckCircleFill,
    },
    CONCLUIDA: {
      texto: "Concluída",
      classes: "bg-blue-100 text-blue-800",
      Icone: CheckAll,
    },
    CANCELADA: {
      texto: "Cancelada",
      classes: "bg-red-100 text-red-800",
      Icone: XCircleFill,
    },
  };

// A etiqueta colorida com o estado da reserva
export default function SeloEstado({ estado }: { estado: string }) {
  const info = ESTADOS[estado] ?? {
    texto: estado,
    classes: "bg-zinc-100 text-zinc-700",
    Icone: Clock,
  };
  const { Icone } = info;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${info.classes}`}
    >
      <Icone size={13} aria-hidden /> {info.texto}
    </span>
  );
}
