"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const servicoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  preco: z.coerce.number().positive("Preço deve ser maior que zero"),
  duracaoMin: z.coerce.number().int().positive("Duração deve ser maior que zero"),
  descricao: z.string().optional(),
  fotoUrl: z.string().optional(),
});

export type EstadoForm = { erro?: string } | undefined;

export async function criarServico(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = servicoSchema.safeParse({
    nome: formData.get("nome"),
    preco: formData.get("preco"),
    duracaoMin: formData.get("duracaoMin"),
    descricao: formData.get("descricao") || undefined,
    fotoUrl: formData.get("fotoUrl") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.servico.create({
    data: {
      tenantId,
      nome: parsed.data.nome,
      preco: parsed.data.preco,
      duracaoMin: parsed.data.duracaoMin,
      descricao: parsed.data.descricao,
      fotoUrl: parsed.data.fotoUrl || undefined,
    },
  });

  revalidatePath(`/barbearia/${slug}/servicos`);
  return undefined;
}

export async function inativarServico(tenantId: string, slug: string, servicoId: string) {
  await prisma.servico.updateMany({
    where: { id: servicoId, tenantId },
    data: { ativo: false },
  });
  revalidatePath(`/barbearia/${slug}/servicos`);
}

export async function atualizarServico(
  tenantId: string,
  slug: string,
  servicoId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = servicoSchema.safeParse({
    nome: formData.get("nome"),
    preco: formData.get("preco"),
    duracaoMin: formData.get("duracaoMin"),
    descricao: formData.get("descricao") || undefined,
    fotoUrl: formData.get("fotoUrl") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.servico.updateMany({
    where: { id: servicoId, tenantId },
    data: {
      nome: parsed.data.nome,
      preco: parsed.data.preco,
      duracaoMin: parsed.data.duracaoMin,
      descricao: parsed.data.descricao,
      fotoUrl: parsed.data.fotoUrl || undefined,
    },
  });

  revalidatePath(`/barbearia/${slug}/servicos`);
  return undefined;
}
