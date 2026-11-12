import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CalendarPlus } from "react-bootstrap-icons";
import { prisma } from "../../lib/prisma";
import { obterClienteId } from "../../lib/sessao";
import Carregando from "../componentes/Carregando";
import FormularioReserva from "./FormularioReserva";
import Topo from "../componentes/Topo";
import { painelFormulario } from "../componentes/estilos";

export default function PaginaReservar() {
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Topo />

      <div className={painelFormulario}>
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <CalendarPlus size={24} className="text-marca" aria-hidden /> Reservar
          mesa
        </h1>
        <p className="mb-5 text-sm text-zinc-500">
          Escolha a área, o número de pessoas e o horário.
        </p>

        <Suspense fallback={<Carregando />}>
          <ConteudoReservar />
        </Suspense>
      </div>
    </main>
  );
}

// Só quem tem sessão iniciada pode reservar
async function ConteudoReservar() {
  const clienteId = await obterClienteId();
  if (!clienteId) redirect("/entrar");

  // Carrega as zonas com as respetivas mesas, para desenhar o mapa visual.
  // O índice (1, 2, 3...) é calculado aqui para servir de rótulo amigável.
  const zonasComMesas = await prisma.zona.findMany({
    include: {
      mesas: {
        orderBy: [{ capacidade: "asc" }, { id: "asc" }],
        select: { id: true, capacidade: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  const zonas = zonasComMesas.map((z) => ({
    id: z.id,
    nome: z.nome,
    mesas: z.mesas.map((m, indice) => ({
      id: m.id,
      capacidade: m.capacidade,
      indice: indice + 1,
    })),
  }));

  return <FormularioReserva zonas={zonas} />;
}
