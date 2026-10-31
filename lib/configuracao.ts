import { prisma } from "./prisma";

// Lê a configuração do restaurante (cria-a com os valores por defeito, se ainda não existir)
export async function obterConfiguracao() {
  return prisma.configuracao.upsert({
    where: { id: "geral" },
    update: {},
    create: { id: "geral" },
  });
}
