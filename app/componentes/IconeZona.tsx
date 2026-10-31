import { Building, Sun, Water } from "react-bootstrap-icons";

export default function IconeZona({
  nome,
  tamanho = 20,
}: {
  nome: string;
  tamanho?: number;
}) {
  if (nome === "Piscina") return <Water size={tamanho} aria-hidden />;
  if (nome === "Esplanada") return <Sun size={tamanho} aria-hidden />;
  return <Building size={tamanho} aria-hidden />;
}
