"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validarDisponibilidade } from "@/lib/disponibilidade";

/**
 * Cancelamento restrito ao próprio cliente e ao próprio agendamento —
 * o filtro por clienteId garante que ninguém cancele agendamento de outro.
 */
export async function cancelarAgendamentoCliente(
  tenantId: string,
  slug: string,
  clienteId: string,
  agendamentoId: string
) {
  await prisma.agendamento.updateMany({
    where: {
      id: agendamentoId,
      tenantId,
      clienteId,
      status: { in: ["AGENDADO", "CONFIRMADO"] },
    },
    data: { status: "CANCELADO" },
  });
  revalidatePath(`/barbearia/${slug}/cliente/agendamentos`);
}

const reagendarSchema = z.object({
  data: z.string().min(1, "Informe a data"),
  hora: z.string().min(1, "Informe o horário"),
});

export type EstadoReagendamento = { erro?: string } | undefined;

/**
 * O cliente pode reagendar (seção 4.6) só o próprio agendamento, mantendo
 * o mesmo barbeiro e serviços — só muda o horário, revalidando
 * disponibilidade (expediente, bloqueios, conflitos).
 */
export async function reagendarPeloCliente(
  tenantId: string,
  slug: string,
  clienteId: string,
  agendamentoId: string,
  _estado: EstadoReagendamento,
  formData: FormData
): Promise<EstadoReagendamento> {
  const parsed = reagendarSchema.safeParse({
    data: formData.get("data"),
    hora: formData.get("hora"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const agendamento = await prisma.agendamento.findFirst({
    where: {
      id: agendamentoId,
      tenantId,
      clienteId,
      status: { in: ["AGENDADO", "CONFIRMADO"] },
    },
  });
  if (!agendamento) {
    return { erro: "Agendamento não encontrado." };
  }

  const duracaoMs = agendamento.dataHoraFim.getTime() - agendamento.dataHoraInicio.getTime();
  const novoInicio = new Date(`${parsed.data.data}T${parsed.data.hora}:00`);
  if (novoInicio.getTime() < Date.now()) {
    return { erro: "Não é possível reagendar para um horário passado." };
  }
  const novoFim = new Date(novoInicio.getTime() + duracaoMs);

  const erroDisponibilidade = await validarDisponibilidade(
    tenantId,
    agendamento.barbeiroId,
    novoInicio,
    novoFim,
    agendamentoId
  );
  if (erroDisponibilidade) {
    return { erro: erroDisponibilidade };
  }

  await prisma.agendamento.update({
    where: { id: agendamentoId },
    data: { dataHoraInicio: novoInicio, dataHoraFim: novoFim, status: "AGENDADO" },
  });

  revalidatePath(`/barbearia/${slug}/cliente/agendamentos`);
  return undefined;
}
