import {
  EnvelopeFill,
  GeoAltFill,
  TelephoneFill,
  Whatsapp,
} from "react-bootstrap-icons";
import {
  SUPORTE,
  linkWhatsApp,
  linkTelefone,
  linkEmail,
} from "../../lib/suporte";
import { cartao } from "./estilos";

// Cartão de apoio: o cliente usa estes canais para reclamar ou pedir ajuda.
// Recorre a wa.me, tel: e mailto: — funciona em qualquer telemóvel, sem API.
export default function Suporte({ compacto = false }: { compacto?: boolean }) {
  const mensagemWhats = `Olá, sou cliente do Sabor Brasil e preciso de ajuda com uma reserva.`;

  return (
    <section className={cartao}>
      <h2 className="mb-1 text-lg font-bold text-marca-escura">
        Apoio ao cliente
      </h2>
      {!compacto && (
        <p className="mb-3 text-sm text-zinc-500">
          Algum problema com uma reserva? Fale connosco pelo canal que for mais
          fácil.
        </p>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        <li>
          <a
            href={linkWhatsApp(mensagemWhats)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition hover:bg-marca-clara"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Whatsapp size={18} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">WhatsApp</span>
              <span className="block text-xs text-zinc-500">
                Resposta rápida
              </span>
            </span>
          </a>
        </li>
        <li>
          <a
            href={linkTelefone()}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition hover:bg-marca-clara"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <TelephoneFill size={18} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">Chamada</span>
              <span className="block text-xs text-zinc-500">
                {SUPORTE.telefone}
              </span>
            </span>
          </a>
        </li>
        <li>
          <a
            href={linkEmail("Reclamação / pedido de apoio")}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition hover:bg-marca-clara"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <EnvelopeFill size={18} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">Email</span>
              <span className="block text-xs text-zinc-500">
                {SUPORTE.email}
              </span>
            </span>
          </a>
        </li>
        {!compacto && (
          <li className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-200 p-3 text-xs text-zinc-500">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
              <GeoAltFill size={18} aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-zinc-700">
                Restaurante
              </span>
              <span className="block">{SUPORTE.endereco}</span>
              <span className="block">{SUPORTE.horario}</span>
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}
