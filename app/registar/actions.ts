"use server";

import { prisma } from "../../lib/prisma";
import { normalizarTelefone } from "../../lib/telefone";
import { criarHash } from "../../lib/senha";

export async function registarCliente(
  _estadoAnterior: { sucesso: boolean; mensagem: string },
  formData: FormData,
): Promise<{ sucesso: boolean; mensagem: string }> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (nome.length < 3) {
    return { sucesso: false, mensagem: "Escreva o seu nome completo." };
  }
  if (!telefone) {
    return {
      sucesso: false,
      mensagem:
        "Número inválido. Use um telemóvel de Moçambique, ex: 84 123 4567.",
    };
  }
  if (senha.length < 6) {
    return {
      sucesso: false,
      mensagem: "A palavra-passe deve ter pelo menos 6 caracteres.",
    };
  }
  if (senha !== confirmacao) {
    return { sucesso: false, mensagem: "As palavras-passe não coincidem." };
  }

  const existente = await prisma.cliente.findUnique({ where: { telefone } });
  if (existente) {
    return { sucesso: false, mensagem: "Este número já tem conta registada." };
  }

  await prisma.cliente.create({
    data: { nome, telefone, senhaHash: criarHash(senha) },
  });
  return { sucesso: true, mensagem: `Conta criada com sucesso, ${nome}!` };
}
