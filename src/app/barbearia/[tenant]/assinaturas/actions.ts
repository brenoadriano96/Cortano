"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

const itemServicoSchema = z.object({
  servicoId: z.string(),
  quantidadeMes: z.coerce.number().int().positive(),
});

const planoClienteSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  precoMensal: z.coerce.number().positive("Preço deve ser maior que zero"),
  descricao: z.string().optional(),
});

/**
 * Cria um plano de assinatura para os clientes da barbearia (seção 16:
 * "A barbearia poderá criar planos para seus clientes"). Sem isso, a área
 * do cliente nunca tem mais de um plano para oferecer upgrade/downgrade.
 */
export async function criarPlanoCliente(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = planoClienteSchema.safeParse({
    nome: formData.get("nome"),
    precoMensal: formData.get("precoMensal"),
    descricao: formData.get("descricao") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const servicoIds = formData.getAll("servicoId") as string[];
  const quantidades = formData.getAll("quantidadeMes") as string[];

  const itens = servicoIds
    .map((servicoId, i) => ({ servicoId, quantidadeMes: Number(quantidades[i]) }))
    .filter((item) => item.servicoId && item.quantidadeMes > 0);

  const parsedItens = z.array(itemServicoSchema).safeParse(itens);
  if (!parsedItens.success || parsedItens.data.length === 0) {
    return { erro: "Inclua ao menos um serviço com quantidade mensal." };
  }

  await prisma.planoCliente.create({
    data: {
      tenantId,
      nome: parsed.data.nome,
      precoMensal: parsed.data.precoMensal,
      descricao: parsed.data.descricao,
      servicosInclusos: {
        create: parsedItens.data,
      },
    },
  });

  revalidatePath(`/barbearia/${slug}/assinaturas`);
  return undefined;
}

export async function inativarPlanoCliente(tenantId: string, slug: string, planoId: string) {
  await prisma.planoCliente.updateMany({
    where: { id: planoId, tenantId },
    data: { ativo: false },
  });
  revalidatePath(`/barbearia/${slug}/assinaturas`);
}
