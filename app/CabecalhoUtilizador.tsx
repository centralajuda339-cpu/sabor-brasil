import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BoxArrowInRight,
  BoxArrowRight,
  CalendarCheck,
  CalendarPlus,
  PersonCircle,
  PersonPlus,
} from "react-bootstrap-icons";
import { prisma } from "../lib/prisma";
import { obterClienteId, terminarSessao } from "../lib/sessao";
import { botaoContorno, botaoPrimario } from "./componentes/estilos";

export default async function CabecalhoUtilizador() {
  const clienteId = await obterClienteId();
  const cliente = clienteId
    ? await prisma.cliente.findUnique({ where: { id: clienteId } })
    : null;

  async function sair() {
    "use server";
    await terminarSessao();
    redirect("/");
  }

  if (!cliente) {
    return (
      <nav className="flex flex-wrap items-center gap-2">
        <Link href="/entrar" className={botaoContorno}>
          <BoxArrowInRight size={16} aria-hidden /> Entrar
        </Link>
        <Link href="/registar" className={botaoPrimario}>
          <PersonPlus size={16} aria-hidden /> Criar conta
        </Link>
      </nav>
    );
  }

  const primeiroNome = cliente.nome.split(" ")[0];

  return (
    <nav className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 pr-1 text-sm text-zinc-600">
        <PersonCircle size={18} aria-hidden /> Olá, {primeiroNome}
      </span>
      <Link href="/reservar" className={botaoPrimario}>
        <CalendarPlus size={16} aria-hidden /> Reservar mesa
      </Link>
      <Link href="/reservas" className={botaoContorno}>
        <CalendarCheck size={16} aria-hidden /> As minhas reservas
      </Link>
      <form action={sair}>
        <button type="submit" className={botaoContorno}>
          <BoxArrowRight size={16} aria-hidden /> Sair
        </button>
      </form>
    </nav>
  );
}
