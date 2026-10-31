import { obterConfiguracao } from "../configuracao";

// Calcula o valor total e o sinal mínimo, com as regras definidas pelo gestor
export async function calcularValores(nPessoas: number) {
  const { taxaPorPessoa, percentagemMinima } = await obterConfiguracao();
  const total = Math.round(nPessoas * taxaPorPessoa);
  const minimo = Math.ceil((total * percentagemMinima) / 100);
  return { total, minimo };
}
