"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const PROXIMO_STATUS: Record<string, string | null> = {
  NOVO: "PAGO",
  PAGO: "PREPARANDO",
  PREPARANDO: "PRONTO_RETIRADA",
  PRONTO_RETIRADA: "ENTREGUE",
  ENTREGUE: null,
  CANCELADO: null,
};

export async function avancarStatusPedido(tenantId: string, slug: string, pedidoId: string) {
  const pedido = await prisma.pedido.findFirst({ where: { id: pedidoId, tenantId } });
  if (!pedido) return;

  const proximo = PROXIMO_STATUS[pedido.status];
  if (!proximo) return;

  await prisma.pedido.updateMany({
    where: { id: pedidoId, tenantId },
    data: { status: proximo as never },
  });
  revalidatePath(`/barbearia/${slug}/pedidos`);
}

export async function cancelarPedido(tenantId: string, slug: string, pedidoId: string) {
  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, tenantId },
    include: { itens: true },
  });
  if (!pedido || pedido.status === "ENTREGUE" || pedido.status === "CANCELADO") return;

  // Devolve o estoque reservado ao cancelar
  await prisma.$transaction([
    ...pedido.itens.map((item) =>
      prisma.produto.update({
        where: { id: item.produtoId },
        data: { estoque: { increment: item.quantidade } },
      })
    ),
    prisma.pedido.update({
      where: { id: pedidoId },
      data: { status: "CANCELADO" },
    }),
  ]);

  revalidatePath(`/barbearia/${slug}/pedidos`);
}
