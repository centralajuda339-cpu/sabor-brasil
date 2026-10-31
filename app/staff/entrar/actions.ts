"use server";

import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { normalizarTelefone } from "../../../lib/telefone";
import { verificarSenha } from "../../../lib/senha";
import { criarSessaoStaff } from "../../../lib/sessao";

export async function entrarStaff(
  _estadoAnterior: { mensagem: string },
  formData: FormData,
): Promise<{ mensagem: string }> {
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));
  const senha = String(formData.get("senha") ?? "");

  if (!telefone) {
    return { mensagem: "Número inválido. Use um telemóvel de Moçambique." };
  }

  const staff = await prisma.staff.findUnique({ where: { telefone } });
  if (!staff || !staff.ativo || !verificarSenha(senha, staff.senhaHash)) {
    return { mensagem: "Número ou palavra-passe incorretos." };
  }

  await criarSessaoStaff(staff.id);
  redirect("/staff");
}
