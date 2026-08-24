"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoCarrinho = { erro?: string; sucesso?: boolean } | undefined;

const itemSchema = z.object({
  produtoId: z.string(),
  quantidade: z.coerce.number().int().positive(),
});

const carrinhoSchema = z.object({
  itens: z.array(itemSchema).min(1, "Adicione ao menos um item ao carrinho"),
});

/**
 * Finaliza o pedido do carrinho do cliente em uma transação: valida estoque
 * disponível, cria Pedido + ItemPedido, e decrementa o estoque atomicamente
 * — evita duas pessoas comprarem o último item ao mesmo tempo (race condition).
 */
export async function finalizarPedido(
  tenantId: string,
  slug: string,
  clienteId: string,
  itensRaw: { produtoId: string; quantidade: number }[]
): Promise<EstadoCarrinho> {
  const parsed = carrinhoSchema.safeParse({ itens: itensRaw });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Carrinho inválido" };
  }

  const produtoIds = parsed.data.itens.map((i) => i.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, tenantId, ativo: true },
  });

  if (produtos.length !== produtoIds.length) {
    return { erro: "Um ou mais produtos não estão mais disponíveis." };
  }

  for (const item of parsed.data.itens) {
    const produto = produtos.find((p) => p.id === item.produtoId)!;
    if (produto.estoque < item.quantidade) {
      return { erro: `Estoque insuficiente para "${produto.nome}".` };
    }
  }

  const valorTotal = parsed.data.itens.reduce((acc, item) => {
    const produto = produtos.find((p) => p.id === item.produtoId)!;
    return acc + Number(produto.preco) * item.quantidade;
  }, 0);

  try {
    await prisma.$transaction([
      prisma.pedido.create({
        data: {
          tenantId,
          clienteId,
          valorTotal,
          status: "NOVO",
          itens: {
            create: parsed.data.itens.map((item) => {
              const produto = produtos.find((p) => p.id === item.produtoId)!;
              return {
                produtoId: item.produtoId,
                quantidade: item.quantidade,
                precoUnitario: produto.preco,
              };
            }),
          },
        },
      }),
      ...parsed.data.itens.map((item) =>
        prisma.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { decrement: item.quantidade } },
        })
      ),
    ]);
  } catch {
    return { erro: "Não foi possível concluir o pedido. Tente novamente." };
  }

  revalidatePath(`/barbearia/${slug}/cliente/pedidos`);
  revalidatePath(`/barbearia/${slug}/loja`);
  return { sucesso: true };
}
