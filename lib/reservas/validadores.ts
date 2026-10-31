import { prisma } from "../prisma";

export type DadosReserva = {
  zonaId: string;
  nPessoas: number;
  inicio: Date;
  duracao: number; // em minutos
};

export type ResultadoValidacao =
  | { valida: true }
  | { valida: false; motivo: string };

const OK: ResultadoValidacao = { valida: true };
function recusar(motivo: string): ResultadoValidacao {
  return { valida: false, motivo };
}

// Regras do restaurante (fáceis de alterar aqui)
const DURACAO_FIXA = 120; // minutos
const ABERTURA = 11 * 60; // 11:00
const FECHO = 22 * 60; // 22:00
const ESTADOS_ATIVOS = ["PENDENTE", "AGUARDA_PAGAMENTO", "CONFIRMADA"];

// Minutos desde a meia-noite, na hora de Moçambique
function minutosDoDiaEmMocambique(data: Date): number {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Maputo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const hora = Number(partes.find((p) => p.type === "hour")?.value);
  const minuto = Number(partes.find((p) => p.type === "minute")?.value);
  return hora * 60 + minuto;
}

// ---------- O elo base da cadeia ----------
export abstract class ValidadorReserva {
  private proximo?: ValidadorReserva;

  // Liga este validador ao seguinte e devolve o seguinte (para encadear em fila)
  encadear(proximo: ValidadorReserva): ValidadorReserva {
    this.proximo = proximo;
    return proximo;
  }

  // Se este elo recusa, a cadeia pára. Se aprova, passa ao seguinte.
  async validar(dados: DadosReserva): Promise<ResultadoValidacao> {
    const resultado = await this.verificar(dados);
    if (!resultado.valida) return resultado;
    return this.proximo ? this.proximo.validar(dados) : resultado;
  }

  protected abstract verificar(
    dados: DadosReserva,
  ): Promise<ResultadoValidacao>;
}

// ---------- Elo 1: horário ----------
class ValidadorHorario extends ValidadorReserva {
  protected async verificar(d: DadosReserva): Promise<ResultadoValidacao> {
    if (d.duracao !== DURACAO_FIXA) {
      return recusar("Cada reserva dura 2 horas.");
    }
    if (d.inicio.getTime() <= Date.now()) {
      return recusar("A data e hora escolhidas já passaram.");
    }
    const inicioMin = minutosDoDiaEmMocambique(d.inicio);
    if (inicioMin < ABERTURA || inicioMin + d.duracao > FECHO) {
      return recusar(
        "Fora do horário. O restaurante funciona das 11:00 às 22:00, por isso as reservas (de 2 horas) começam entre as 11:00 e as 20:00.",
      );
    }
    return OK;
  }
}

// ---------- Elo 2: capacidade da área ----------
class ValidadorCapacidade extends ValidadorReserva {
  protected async verificar(d: DadosReserva): Promise<ResultadoValidacao> {
    if (!Number.isInteger(d.nPessoas) || d.nPessoas < 1) {
      return recusar("Indique pelo menos 1 pessoa.");
    }
    const mesas = await prisma.mesa.findMany({
      where: { zonaId: d.zonaId },
      select: { capacidade: true },
    });
    if (mesas.length === 0) {
      return recusar("Esta área não existe ou não tem mesas.");
    }
    const lugares = mesas.reduce((total, m) => total + m.capacidade, 0);
    if (d.nPessoas > lugares) {
      return recusar(`Esta área só tem ${lugares} lugares no total.`);
    }
    return OK;
  }
}

// ---------- Elo 3: lugares livres nesse horário ----------
class ValidadorDisponibilidade extends ValidadorReserva {
  protected async verificar(d: DadosReserva): Promise<ResultadoValidacao> {
    const fim = new Date(d.inicio.getTime() + d.duracao * 60000);
    const limiteInferior = new Date(d.inicio.getTime() - DURACAO_FIXA * 60000);

    const [mesas, reservas] = await Promise.all([
      prisma.mesa.findMany({
        where: { zonaId: d.zonaId },
        select: { capacidade: true },
      }),
      prisma.reserva.findMany({
        where: {
          zonaId: d.zonaId,
          estado: { in: ESTADOS_ATIVOS },
          dataHora: { gt: limiteInferior, lt: fim },
        },
        select: { dataHora: true, duracao: true, nPessoas: true },
      }),
    ]);

    const lugares = mesas.reduce((total, m) => total + m.capacidade, 0);

    // Só contam as reservas que se sobrepõem ao horário pedido
    const ocupados = reservas
      .filter(
        (r) => r.dataHora.getTime() + r.duracao * 60000 > d.inicio.getTime(),
      )
      .reduce((total, r) => total + r.nPessoas, 0);

    const livres = lugares - ocupados;
    if (d.nPessoas > livres) {
      return recusar(
        livres > 0
          ? `Só restam ${livres} lugares nesta área nesse horário.`
          : "Esta área está cheia nesse horário.",
      );
    }
    return OK;
  }
}

// ---------- Montar a cadeia: Horário -> Capacidade -> Disponibilidade ----------
export function criarCadeiaDeValidacao(): ValidadorReserva {
  const horario = new ValidadorHorario();
  horario
    .encadear(new ValidadorCapacidade())
    .encadear(new ValidadorDisponibilidade());
  return horario;
}
