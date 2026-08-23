"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

  // Checagem de conflito de horário para o barbeiro (mesma regra da API)
  const conflito = await prisma.agendamento.findFirst({
    where: {
      tenantId,
      barbeiroId,
      status: { in: ["AGENDADO", "CONFIRMADO"] },
      AND: [{ dataHoraInicio: { lt: fim } }, { dataHoraFim: { gt: inicio } }],
    },
  });
  if (conflito) {
    return { erro: "Este barbeiro já tem um agendamento nesse horário." };
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
