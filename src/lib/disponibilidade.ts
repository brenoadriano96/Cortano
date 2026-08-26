import { prisma } from "@/lib/prisma";

/**
 * Valida se um barbeiro pode atender no intervalo entre `inicio` e `fim`:
 * 1. Está dentro do expediente cadastrado (HorarioTrabalho) para aquele
 *    dia da semana — seção 14: "horários disponíveis"
 * 2. Não colide com um bloqueio de agenda (folga, almoço, feriado — seção 14)
 * 3. Não colide com outro agendamento já confirmado/agendado
 *
 * Retorna null se está tudo certo, ou uma mensagem de erro amigável.
 */
export async function validarDisponibilidade(
  tenantId: string,
  barbeiroId: string,
  inicio: Date,
  fim: Date
): Promise<string | null> {
  const diaSemana = inicio.getDay();
  const horaInicioStr = inicio.toTimeString().slice(0, 5); // "HH:MM"
  const horaFimStr = fim.toTimeString().slice(0, 5);

  const expediente = await prisma.horarioTrabalho.findFirst({
    where: { barbeiroId, diaSemana },
  });

  if (!expediente) {
    return "Este barbeiro não atende neste dia da semana.";
  }
  if (horaInicioStr < expediente.horaInicio || horaFimStr > expediente.horaFim) {
    return `Fora do horário de expediente deste barbeiro (${expediente.horaInicio} às ${expediente.horaFim}).`;
  }

  const bloqueio = await prisma.bloqueioAgenda.findFirst({
    where: {
      tenantId,
      barbeiroId,
      AND: [{ inicio: { lt: fim } }, { fim: { gt: inicio } }],
    },
  });
  if (bloqueio) {
    return `Barbeiro indisponível neste horário${bloqueio.motivo ? ` (${bloqueio.motivo})` : ""}.`;
  }

  const conflito = await prisma.agendamento.findFirst({
    where: {
      tenantId,
      barbeiroId,
      status: { in: ["AGENDADO", "CONFIRMADO"] },
      AND: [{ dataHoraInicio: { lt: fim } }, { dataHoraFim: { gt: inicio } }],
    },
  });
  if (conflito) {
    return "Este barbeiro já tem um agendamento nesse horário.";
  }

  return null;
}
