import Image from "next/image";

// Calcula uma cor de fundo estável a partir do nome, para as iniciais terem sempre contraste.
function corDasIniciais(nome: string): string {
  const cores = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-lime-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-fuchsia-600",
  ];
  let soma = 0;
  for (let i = 0; i < nome.length; i++) soma += nome.charCodeAt(i);
  return cores[soma % cores.length];
}

function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// Avatar do cliente: se houver avatarUrl, mostra a imagem; caso contrário, iniciais coloridas.
export default function Avatar({
  nome,
  avatarUrl,
  tamanho = 48,
}: {
  nome: string;
  avatarUrl?: string | null;
  tamanho?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`Foto de ${nome}`}
        width={tamanho}
        height={tamanho}
        className="rounded-full border border-zinc-200 object-cover"
        unoptimized
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${corDasIniciais(nome)}`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.4 }}
      aria-hidden
    >
      {iniciaisDe(nome)}
    </span>
  );
}
