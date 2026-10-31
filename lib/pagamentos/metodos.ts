export type TipoPagamento = "MPESA" | "EMOLA" | "BANCO";
export type ResultadoPagamento = { sucesso: boolean; referencia: string };

function digitos(quantidade: number): string {
  let texto = "";
  for (let i = 0; i < quantidade; i++) texto += Math.floor(Math.random() * 10);
  return texto;
}

// Contrato comum (LSP): qualquer subtipo pode ser usado onde se espera um Pagamento
export abstract class Pagamento {
  abstract readonly tipo: TipoPagamento;
  abstract readonly nome: string;
  abstract gerarReferencia(): string;

  // Simulação: aprova qualquer valor positivo e devolve a referência
  async processar(valor: number): Promise<ResultadoPagamento> {
    if (valor <= 0) return { sucesso: false, referencia: "" };
    return { sucesso: true, referencia: this.gerarReferencia() };
  }
}

export class PagamentoMPesa extends Pagamento {
  readonly tipo = "MPESA" as const;
  readonly nome = "M-Pesa";
  gerarReferencia(): string {
    return `MP${digitos(8)}`;
  }
}

export class PagamentoEmola extends Pagamento {
  readonly tipo = "EMOLA" as const;
  readonly nome = "e-Mola";
  gerarReferencia(): string {
    return `EM${digitos(8)}`;
  }
}

export class PagamentoBanco extends Pagamento {
  readonly tipo = "BANCO" as const;
  readonly nome = "Conta bancária";
  gerarReferencia(): string {
    return `BK${digitos(10)}`;
  }
}

export const METODOS_DE_PAGAMENTO: Pagamento[] = [
  new PagamentoMPesa(),
  new PagamentoEmola(),
  new PagamentoBanco(),
];

export function obterPagamento(tipo: string): Pagamento | null {
  return METODOS_DE_PAGAMENTO.find((m) => m.tipo === tipo) ?? null;
}
