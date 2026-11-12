import { Suspense } from "react";
import Link from "next/link";
import { Building, CalendarPlus, Sun, Water } from "react-bootstrap-icons";
import { prisma } from "../lib/prisma";
import CabecalhoUtilizador from "./CabecalhoUtilizador";
import Carregando from "./componentes/Carregando";
import Marca from "./componentes/Marca";
import Suporte from "./componentes/Suporte";
import { cartao } from "./componentes/estilos";

function IconeZona({ nome }: { nome: string }) {
  if (nome === "Piscina") return <Water size={22} aria-hidden />;
  if (nome === "Esplanada") return <Sun size={22} aria-hidden />;
  return <Building size={22} aria-hidden />;
}

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-6 sm:px-6">
      <header className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/60 bg-fundo/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <Marca />
        <Suspense fallback={null}>
          <CabecalhoUtilizador />
        </Suspense>
      </header>

      <section className="rounded-3xl bg-gradient-to-br from-marca via-marca to-marca-escura p-6 text-white shadow-lg sm:p-10">
        <p className="text-sm font-medium text-ouro">
          Restaurante · Piscina · Esplanada
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
          Reserve a sua mesa no Sabor Brasil
        </h1>
        <p className="mt-3 max-w-xl text-green-50">
          Escolha a área, o número de pessoas e o horário. Pague uma parte do
          valor e a sua reserva fica garantida.
        </p>
        <Link
          href="/reservar"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ouro px-5 py-2.5 font-semibold text-stone-900 shadow-sm transition hover:brightness-95"
        >
          <CalendarPlus size={18} aria-hidden /> Reservar mesa
        </Link>
      </section>

      <Suspense fallback={<Carregando texto="A carregar dados..." />}>
        <DadosDoRestaurante />
      </Suspense>

      <Suporte />
    </main>
  );
}

// Esta parte lê a base de dados (Supabase) sempre que a página é aberta
async function DadosDoRestaurante() {
  const zonas = await prisma.zona.findMany({
    include: { mesas: true },
    orderBy: { nome: "asc" },
  });

  // Só as categorias de topo; cada uma traz as suas subcategorias e itens
  const categorias = await prisma.categoriaCardapio.findMany({
    where: { categoriaPaiId: null },
    include: { subcategorias: { include: { itens: true } } },
  });

  return (
    <>
      <section>
        <h2 className="mb-4 text-2xl font-bold">Áreas do restaurante</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {zonas.map((zona) => (
            <li key={zona.id} className={cartao}>
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-marca-clara text-marca">
                <IconeZona nome={zona.nome} />
              </span>
              <p className="font-semibold">{zona.nome}</p>
              <p className="text-sm text-zinc-500">
                {zona.mesas.length} mesas ·{" "}
                {zona.mesas.reduce((total, mesa) => total + mesa.capacidade, 0)}{" "}
                lugares
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Cardápio</h2>
        <div className="space-y-6">
          {categorias.map((categoria) => (
            <div key={categoria.id} className={cartao}>
              <h3 className="text-xl font-bold text-marca-escura">
                {categoria.nome}
              </h3>
              {categoria.subcategorias.map((sub) => (
                <div key={sub.id} className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {sub.nome}
                  </h4>
                  <ul className="mt-1 divide-y divide-zinc-100">
                    {sub.itens.map((item) => (
                      <li key={item.id} className="py-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{item.nome}</span>
                          <span className="whitespace-nowrap rounded-full bg-marca-clara px-2 py-0.5 text-sm font-semibold text-marca-escura">
                            {item.preco} MT
                          </span>
                        </div>
                        {item.descricao && (
                          <p className="text-sm text-zinc-500">
                            {item.descricao}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
