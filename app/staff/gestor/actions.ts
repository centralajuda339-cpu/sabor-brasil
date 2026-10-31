"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { obterStaffId } from "../../../lib/sessao";
import { normalizarTelefone } from "../../../lib/telefone";
import { criarHash } from "../../../lib/senha";

// Só o gestor pode usar estas ações. O staff é mandado de volta para o painel.
async function exigirGestor() {
  const id = await obterStaffId();
  if (!id) redirect("/staff/entrar");
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff || !staff.ativo) redirect("/staff/entrar");
  if (staff.perfil !== "GESTOR") redirect("/staff");
  return staff;
}

export async function guardarConfiguracao(
  _estadoAnterior: { mensagem: string; sucesso: boolean },
  formData: FormData,
): Promise<{ mensagem: string; sucesso: boolean }> {
  await exigirGestor();

  const taxa = Number(formData.get("taxaPorPessoa"));
  const percentagem = Number(formData.get("percentagemMinima"));

  if (!Number.isFinite(taxa) || taxa <= 0) {
    return { mensagem: "Indique uma taxa maior que zero.", sucesso: false };
  }
  if (!Number.isFinite(percentagem) || percentagem < 1 || percentagem > 100) {
    return {
      mensagem: "A percentagem deve estar entre 1 e 100.",
      sucesso: false,
    };
  }

  await prisma.configuracao.upsert({
    where: { id: "geral" },
    update: { taxaPorPessoa: taxa, percentagemMinima: percentagem },
    create: {
      id: "geral",
      taxaPorPessoa: taxa,
      percentagemMinima: percentagem,
    },
  });

  revalidatePath("/staff/gestor");
  return { mensagem: "Valores guardados.", sucesso: true };
}

export async function criarStaff(
  _estadoAnterior: { mensagem: string; sucesso: boolean },
  formData: FormData,
): Promise<{ mensagem: string; sucesso: boolean }> {
  await exigirGestor();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));
  const senha = String(formData.get("senha") ?? "");
  const perfil = String(formData.get("perfil") ?? "");

  if (nome.length < 3) {
    return { mensagem: "Escreva o nome completo.", sucesso: false };
  }
  if (!telefone) {
    return {
      mensagem: "Número inválido. Use um telemóvel de Moçambique.",
      sucesso: false,
    };
  }
  if (senha.length < 6) {
    return {
      mensagem: "A palavra-passe deve ter pelo menos 6 caracteres.",
      sucesso: false,
    };
  }
  if (perfil !== "STAFF" && perfil !== "GESTOR") {
    return { mensagem: "Perfil inválido.", sucesso: false };
  }

  const existente = await prisma.staff.findUnique({ where: { telefone } });
  if (existente) {
    return {
      mensagem: "Este número já tem uma conta do restaurante.",
      sucesso: false,
    };
  }

  await prisma.staff.create({
    data: { nome, telefone, senhaHash: criarHash(senha), perfil },
  });

  revalidatePath("/staff/gestor");
  return { mensagem: `Conta criada para ${nome}.`, sucesso: true };
}

// Ativa ou desativa uma conta. O gestor não pode desativar a sua própria conta.
export async function alternarAtivoStaff(formData: FormData) {
  const gestor = await exigirGestor();
  const staffId = String(formData.get("staffId") ?? "");
  if (staffId === gestor.id) return;

  const alvo = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!alvo) return;

  await prisma.staff.update({
    where: { id: staffId },
    data: { ativo: !alvo.ativo },
  });

  revalidatePath("/staff/gestor");
}

export async function adicionarMesa(
  _estadoAnterior: { mensagem: string; sucesso: boolean },
  formData: FormData,
): Promise<{ mensagem: string; sucesso: boolean }> {
  await exigirGestor();

  const zonaId = String(formData.get("zonaId") ?? "");
  const capacidade = Number(formData.get("capacidade"));

  if (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > 20) {
    return {
      mensagem: "A capacidade deve ser um número entre 1 e 20.",
      sucesso: false,
    };
  }

  const zona = await prisma.zona.findUnique({ where: { id: zonaId } });
  if (!zona) {
    return { mensagem: "Área não encontrada.", sucesso: false };
  }

  await prisma.mesa.create({
    data: { zonaId, capacidade, tipo: zona.nome },
  });

  revalidatePath("/staff/gestor");
  return {
    mensagem: `Mesa de ${capacidade} lugares adicionada a ${zona.nome}.`,
    sucesso: true,
  };
}

// Não se remove uma mesa que está atribuída a uma reserva confirmada
export async function removerMesa(formData: FormData) {
  await exigirGestor();
  const mesaId = String(formData.get("mesaId") ?? "");

  const emUso = await prisma.reserva.count({
    where: { mesaId, estado: "CONFIRMADA" },
  });
  if (emUso > 0) return;

  await prisma.mesa.delete({ where: { id: mesaId } });
  revalidatePath("/staff/gestor");
}
