import Image from "next/image";
import Link from "next/link";
import AlternarTema from "./AlternarTema";

// O ícone ao lado do nome do restaurante, e o botão do tema claro/escuro
export default function Marca({
  tamanho = 40,
  href = "/",
}: {
  tamanho?: number;
  href?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <Link href={href} className="inline-flex items-center gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={tamanho}
          height={tamanho}
          className="rounded-xl"
        />
        <span className="text-xl font-bold tracking-tight text-marca-escura">
          Sabor Brasil
        </span>
      </Link>
      <AlternarTema />
    </span>
  );
}
