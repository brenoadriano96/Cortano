"use server";

import { prisma } from "@/lib/prisma";
import { verificarLimitePlano } from "@/lib/planos";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enviarWhatsApp, mensagemEstoqueBaixo } from "@/lib/whatsapp";

const LIMITE_ESTOQUE_BAIXO = 5;

export type EstadoForm = { erro?: string } | undefined;

const produtoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  categoriaId: z.string().min(1, "Selecione uma categoria"),
  sku: z.string().min(1, "Informe o SKU"),
  preco: z.coerce.number().positive("Preço deve ser maior que zero"),
  estoque: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  descricao: z.string().optional(),
  fotoUrl: z.string().optional(),
});

export async function criarCategoriaProduto(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const nome = (formData.get("nomeCategoria") as string)?.trim();
  if (!nome || nome.length < 2) {
    return { erro: "Nome da categoria muito curto" };
  }

  const existente = await prisma.categoriaProduto.findFirst({ where: { tenantId, nome } });
  if (existente) {
    return { erro: "Já existe uma categoria com este nome." };
  }

  await prisma.categoriaProduto.create({ data: { tenantId, nome } });
  revalidatePath(`/barbearia/${slug}/loja`);
  return undefined;
}

export async function criarProduto(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = produtoSchema.safeParse({
    nome: formData.get("nome"),
    categoriaId: formData.get("categoriaId"),
    sku: formData.get("sku"),
    preco: formData.get("preco"),
    estoque: formData.get("estoque"),
    descricao: formData.get("descricao") || undefined,
    fotoUrl: formData.get("fotoUrl") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const categoria = await prisma.categoriaProduto.findFirst({
    where: { id: parsed.data.categoriaId, tenantId },
  });
  if (!categoria) {
    return { erro: "Categoria inválida." };
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
    data: {
      tenantId,
      nome: parsed.data.nome,
      categoria: categoria.nome,
      categoriaId: categoria.id,
      sku: parsed.data.sku,
      preco: parsed.data.preco,
      estoque: parsed.data.estoque,
      descricao: parsed.data.descricao,
      fotoUrl: parsed.data.fotoUrl || undefined,
    },
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

  const produtoExistente = await prisma.produto.findFirst({
    where: { id: produtoId, tenantId },
  });
  if (!produtoExistente) return;

  await prisma.produto.update({
    where: { id: produtoId },
    data: { estoque: novoEstoque },
  });

  if (novoEstoque <= LIMITE_ESTOQUE_BAIXO) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant?.telefone) {
      await enviarWhatsApp(
        tenant.telefone,
        mensagemEstoqueBaixo({ produtoNome: produtoExistente.nome, estoqueAtual: novoEstoque })
      );
    }
  }

  revalidatePath(`/barbearia/${slug}/loja`);
}

export async function inativarProduto(tenantId: string, slug: string, produtoId: string) {
  await prisma.produto.updateMany({
    where: { id: produtoId, tenantId },
    data: { ativo: false },
  });
  revalidatePath(`/barbearia/${slug}/loja`);
}
