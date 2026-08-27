"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validarDisponibilidade } from "@/lib/disponibilidade";

export type EstadoForm = { erro?: string } | undefined;

const novoAgendamentoSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente"),
  barbeiroId: z.string().min(1, "Selecione um barbeiro"),
  servicoIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  data: z.string().min(1, "Informe a data"),
  hora: z.string().min(1, "Informe o horário"),
});

export async function criarAgendamento(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = novoAgendamentoSchema.safeParse({
    clienteId: formData.get("clienteId"),
    barbeiroId: formData.get("barbeiroId"),
    servicoIds: formData.getAll("servicoIds"),
    data: formData.get("data"),
    hora: formData.get("hora"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { clienteId, barbeiroId, servicoIds, data, hora } = parsed.data;

  const servicos = await prisma.servico.findMany({
    where: { id: { in: servicoIds }, tenantId },
  });
  if (servicos.length !== servicoIds.length) {
    return { erro: "Um ou mais serviços inválidos." };
  }

  const duracaoTotalMin = servicos.reduce((acc, s) => acc + s.duracaoMin, 0);
  const valorTotal = servicos.reduce((acc, s) => acc + Number(s.preco), 0);
  const inicio = new Date(`${data}T${hora}:00`);
  const fim = new Date(inicio.getTime() + duracaoTotalMin * 60_000);

  // Seção 14: valida expediente, bloqueios de agenda e conflitos
  const erroDisponibilidade = await validarDisponibilidade(tenantId, barbeiroId, inicio, fim);
  if (erroDisponibilidade) {
    return { erro: erroDisponibilidade };
  }

  await prisma.agendamento.create({
    data: {
      tenantId,
      clienteId,
      barbeiroId,
      dataHoraInicio: inicio,
      dataHoraFim: fim,
      valorTotal,
      servicos: {
        create: servicos.map((s) => ({ servicoId: s.id, precoCobrado: s.preco })),
      },
    },
  });

  revalidatePath(`/barbearia/${slug}/agenda`);
  return undefined;
}

export async function atualizarStatusAgendamento(
  tenantId: string,
  slug: string,
  agendamentoId: string,
  novoStatus: "CONFIRMADO" | "ATENDIDO" | "CANCELADO" | "FALTOU"
) {
  await prisma.agendamento.updateMany({
    where: { id: agendamentoId, tenantId },
    data: { status: novoStatus },
  });
  revalidatePath(`/barbearia/${slug}/agenda`);
}

const reagendarSchema = z.object({
  data: z.string().min(1, "Informe a data"),
  hora: z.string().min(1, "Informe o horário"),
});

export type EstadoReagendamento = { erro?: string } | undefined;

/**
 * Reagendamento (seção 14): mantém cliente/barbeiro/serviços, só muda o
 * horário — revalidando expediente, bloqueios e conflitos (excluindo o
 * próprio agendamento da checagem de conflito).
 */
export async function reagendarAgendamento(
  tenantId: string,
  slug: string,
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
    where: { id: agendamentoId, tenantId },
  });
  if (!agendamento) {
    return { erro: "Agendamento não encontrado." };
  }

  const duracaoMs = agendamento.dataHoraFim.getTime() - agendamento.dataHoraInicio.getTime();
  const novoInicio = new Date(`${parsed.data.data}T${parsed.data.hora}:00`);
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

  revalidatePath(`/barbearia/${slug}/agenda`);
  return undefined;
}

const bloqueioSchema = z.object({
  barbeiroId: z.string().min(1, "Selecione um barbeiro"),
  data: z.string().min(1, "Informe a data"),
  horaInicio: z.string().min(1, "Informe o início"),
  horaFim: z.string().min(1, "Informe o fim"),
  motivo: z.string().optional(),
});

export type EstadoBloqueio = { erro?: string } | undefined;

export async function criarBloqueio(
  tenantId: string,
  slug: string,
  _estado: EstadoBloqueio,
  formData: FormData
): Promise<EstadoBloqueio> {
  const parsed = bloqueioSchema.safeParse({
    barbeiroId: formData.get("barbeiroId"),
    data: formData.get("data"),
    horaInicio: formData.get("horaInicio"),
    horaFim: formData.get("horaFim"),
    motivo: formData.get("motivo") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const inicio = new Date(`${parsed.data.data}T${parsed.data.horaInicio}:00`);
  const fim = new Date(`${parsed.data.data}T${parsed.data.horaFim}:00`);
  if (fim <= inicio) {
    return { erro: "O horário de fim deve ser depois do início." };
  }

  await prisma.bloqueioAgenda.create({
    data: {
      tenantId,
      barbeiroId: parsed.data.barbeiroId,
      inicio,
      fim,
      motivo: parsed.data.motivo,
    },
  });

  revalidatePath(`/barbearia/${slug}/agenda`);
  return undefined;
}

export async function removerBloqueio(tenantId: string, slug: string, bloqueioId: string) {
  await prisma.bloqueioAgenda.deleteMany({ where: { id: bloqueioId, tenantId } });
  revalidatePath(`/barbearia/${slug}/agenda`);
}
