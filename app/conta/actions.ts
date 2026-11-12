"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { obterClienteId } from "../../lib/sessao";
import { verificarSenha, criarHash } from "../../lib/senha";
import { talvezGerarCupom } from "../../lib/cupons";

// Exige sessão de cliente. Se não houver, manda entrar.
async function exigirCliente() {
  const id = await obterClienteId();
  if (!id) redirect("/entrar");
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) redirect("/entrar");
  return cliente;
}

// Atualiza o avatarUrl. Como não há storage real, aceita URL/Emoji curto.
// Recusa strings demasiado longas para evitar abuso.
export async function atualizarAvatar(
  _estadoAnterior: { mensagem: string; sucesso: boolean },
  formData: FormData,
): Promise<{ mensagem: string; sucesso: boolean }> {
  const cliente = await exigirCliente();
  const url = String(formData.get("avatarUrl") ?? "").trim();

  if (url.length > 500) {
    return { mensagem: "O endereço é demasiado longo.", sucesso: false };
  }

  await prisma.cliente.update({
    where: { id: cliente.id },
    data: { avatarUrl: url || null },
  });

  revalidatePath("/conta");
  return { mensagem: "Foto de perfil atualizada.", sucesso: true };
}

// Muda a palavra-passe. Confirma a antiga antes de substituir.
// Nota: a confirmação por SMS mencionada no requisito fica pendente —
// não há API configurada. O gestor vê a mudança no log do painel.
export async function mudarSenha(
  _estadoAnterior: { mensagem: string; sucesso: boolean },
  formData: FormData,
): Promise<{ mensagem: string; sucesso: boolean }> {
  const cliente = await exigirCliente();
  const atual = String(formData.get("senhaAtual") ?? "");
  const nova = String(formData.get("novaSenha") ?? "");
  const confirmar = String(formData.get("confirmarSenha") ?? "");

  if (!verificarSenha(atual, cliente.senhaHash)) {
    return {
      mensagem: "A palavra-passe atual está incorreta.",
      sucesso: false,
    };
  }
  if (nova.length < 6) {
    return {
      mensagem: "A nova palavra-passe deve ter pelo menos 6 caracteres.",
      sucesso: false,
    };
  }
  if (nova !== confirmar) {
    return {
      mensagem: "As palavras-passe novas não coincidem.",
      sucesso: false,
    };
  }
  if (nova === atual) {
    return {
      mensagem: "A nova palavra-passe tem de ser diferente da atual.",
      sucesso: false,
    };
  }

  await prisma.cliente.update({
    where: { id: cliente.id },
    data: { senhaHash: criarHash(nova) },
  });

  revalidatePath("/conta");
  return {
    mensagem:
      "Palavra-passe atualizada. A confirmação por SMS será enviada em breve (integração pendente).",
    sucesso: true,
  };
}

// Gatilho manual para o cliente tentar gerar o cupão do mês.
export async function tentarGerarCupom() {
  const cliente = await exigirCliente();
  const resultado = await talvezGerarCupom(cliente.id);
  revalidatePath("/conta");
  return resultado;
}
