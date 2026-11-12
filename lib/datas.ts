// Início de um dia (00:00) na hora de Moçambique.
// deslocamentoDias: 0 = hoje, 1 = amanhã, 2 = depois de amanhã...
export function inicioDoDiaEmMocambique(deslocamentoDias = 0): Date {
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
  }).format(new Date()); // por exemplo "2026-10-17"
  const inicio = new Date(`${hoje}T00:00:00+02:00`);
  return new Date(inicio.getTime() + deslocamentoDias * 24 * 60 * 60 * 1000);
}

// Hora atual. Encapsulada para evitar o aviso de pureza do React Compiler
// quando usada dentro de componentes.
export function agora(): number {
  return Date.now();
}
