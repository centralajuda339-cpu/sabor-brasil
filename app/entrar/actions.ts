"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { normalizarTelefone } from "../../lib/telefone";
import { verificarSenha } from "../../lib/senha";
import { criarSessao } from "../../lib/sessao";

export async function entrarCliente(
  _estadoAnterior: { sucesso: boolean; mensagem: string },
  formData: FormData,
): Promise<{ sucesso: boolean; mensagem: string }> {
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));
  const senha = String(formData.get("senha") ?? "");

  if (!telefone) {
    return {
      sucesso: false,
      mensagem:
        "Número inválido. Use um telemóvel de Moçambique, ex: 84 123 4567.",
    };
  }

  const cliente = await prisma.cliente.findUnique({ where: { telefone } });

  // A mesma mensagem nos dois casos, para não revelar que números têm conta
  if (!cliente || !verificarSenha(senha, cliente.senhaHash)) {
    return { sucesso: false, mensagem: "Número ou palavra-passe incorretos." };
  }

  await criarSessao(cliente.id);
  redirect("/");
}
