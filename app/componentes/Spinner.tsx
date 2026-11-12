import { ArrowClockwise } from "react-bootstrap-icons";

// Ícone giratório para mostrar carregamento.
export default function Spinner({ size = 16 }: { size?: number }) {
  return <ArrowClockwise size={size} className="animate-spin" aria-hidden />;
}
