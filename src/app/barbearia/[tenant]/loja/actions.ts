"use server";

import { prisma } from "@/lib/prisma";
import { verificarLimitePlano } from "@/lib/planos";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

const produtoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  categoria: z.string().min(1, "Informe a categoria"),
  sku: z.string().min(1, "Informe o SKU"),
  preco: z.coerce.number().positive("Preço deve ser maior que zero"),
  estoque: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  descricao: z.string().optional(),
});

export async function criarProduto(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = produtoSchema.safeParse({
    nome: formData.get("nome"),
    categoria: formData.get("categoria"),
    sku: formData.get("sku"),
    preco: formData.get("preco"),
    estoque: formData.get("estoque"),
    descricao: formData.get("descricao") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  // Seção 9: checar limite do plano antes de criar
  const limite = await verificarLimitePlano(tenantId, "produtos");
  if (!limite.permitido) {
    return { erro: limite.mensagem };
  }

  const skuExistente = await prisma.produto.findFirst({
    where: { tenantId, sku: parsed.data.sku },
  });
  if (skuExistente) {
    return { erro: "Já existe um produto com este SKU." };
  }

  await prisma.produto.create({
    data: { tenantId, ...parsed.data },
  });

  revalidatePath(`/barbearia/${slug}/loja`);
  return undefined;
}

export async function atualizarEstoque(
  tenantId: string,
  slug: string,
  produtoId: string,
  novoEstoque: number
) {
  if (novoEstoque < 0) return;
  await prisma.produto.updateMany({
    where: { id: produtoId, tenantId },
    data: { estoque: novoEstoque },
  });
  revalidatePath(`/barbearia/${slug}/loja`);
}

export async function inativarProduto(tenantId: string, slug: string, produtoId: string) {
  await prisma.produto.updateMany({
    where: { id: produtoId, tenantId },
    data: { ativo: false },
  });
  revalidatePath(`/barbearia/${slug}/loja`);
}
