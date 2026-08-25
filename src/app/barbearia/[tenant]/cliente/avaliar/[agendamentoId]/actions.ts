"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string; sucesso?: boolean } | undefined;

const avaliacaoSchema = z.object({
  notaBarbeiro: z.coerce.number().int().min(1).max(5),
  notaServico: z.coerce.number().int().min(1).max(5),
  notaExperiencia: z.coerce.number().int().min(1).max(5),
  comentario: z.string().optional(),
});

/**
 * O cliente só pode avaliar o próprio atendimento (clienteId nunca vem do
 * form) e apenas uma vez (agendamentoId é @unique em Avaliacao), e apenas
 * se o status for ATENDIDO — não faz sentido avaliar algo que não aconteceu.
 */
export async function avaliarAtendimento(
  tenantId: string,
  slug: string,
  clienteId: string,
  agendamentoId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = avaliacaoSchema.safeParse({
    notaBarbeiro: formData.get("notaBarbeiro"),
    notaServico: formData.get("notaServico"),
    notaExperiencia: formData.get("notaExperiencia"),
    comentario: formData.get("comentario") || undefined,
  });
  if (!parsed.success) {
    return { erro: "Selecione uma nota de 1 a 5 em cada campo." };
  }

  const agendamento = await prisma.agendamento.findFirst({
    where: { id: agendamentoId, tenantId, clienteId, status: "ATENDIDO" },
  });
  if (!agendamento) {
    return { erro: "Agendamento não encontrado ou ainda não concluído." };
  }

  const jaAvaliado = await prisma.avaliacao.findUnique({ where: { agendamentoId } });
  if (jaAvaliado) {
    return { erro: "Este atendimento já foi avaliado." };
  }

  await prisma.avaliacao.create({
    data: {
      tenantId,
      agendamentoId,
      clienteId,
      barbeiroId: agendamento.barbeiroId,
      ...parsed.data,
    },
  });

  revalidatePath(`/barbearia/${slug}/cliente/agendamentos`);
  return { sucesso: true };
}
