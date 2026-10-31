import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CalendarPlus } from "react-bootstrap-icons";
import { prisma } from "../../lib/prisma";
import { obterClienteId } from "../../lib/sessao";
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

        <Suspense fallback={<p className="text-zinc-500">A carregar...</p>}>
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

  const zonas = await prisma.zona.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return <FormularioReserva zonas={zonas} />;
}
