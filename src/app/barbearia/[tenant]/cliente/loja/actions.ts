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
  cupomCodigo: z.string().optional(),
  usarCashback: z.boolean().optional(),
});

const PERCENTUAL_CASHBACK_GERADO = 0.05; // 5% do valor pago em produtos vira cashback

/**
 * Finaliza o pedido do carrinho do cliente em uma transação: valida estoque
 * disponível, aplica cupom/cashback se informado, cria Pedido + ItemPedido,
 * e decrementa o estoque atomicamente — evita duas pessoas comprarem o
 * último item ao mesmo tempo (race condition).
 */
export async function finalizarPedido(
  tenantId: string,
  slug: string,
  clienteId: string,
  itensRaw: { produtoId: string; quantidade: number }[],
  cupomCodigo?: string,
  usarCashback?: boolean
): Promise<EstadoCarrinho> {
  const parsed = carrinhoSchema.safeParse({ itens: itensRaw, cupomCodigo, usarCashback });
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

  const subtotal = parsed.data.itens.reduce((acc, item) => {
    const produto = produtos.find((p) => p.id === item.produtoId)!;
    return acc + Number(produto.preco) * item.quantidade;
  }, 0);

  // Cupom de desconto
  let descontoCupom = 0;
  let cupom = null;
  if (parsed.data.cupomCodigo) {
    cupom = await prisma.cupom.findFirst({
      where: { tenantId, codigo: parsed.data.cupomCodigo.toUpperCase().trim(), ativo: true },
    });
    if (!cupom) {
      return { erro: "Cupom inválido ou expirado." };
    }
    if (cupom.validoAte && cupom.validoAte < new Date()) {
      return { erro: "Este cupom expirou." };
    }
    if (cupom.usoMaximo && cupom.usosRealizados >= cupom.usoMaximo) {
      return { erro: "Este cupom já atingiu o limite de usos." };
    }
    descontoCupom =
      cupom.tipo === "PERCENTUAL" ? subtotal * (Number(cupom.valor) / 100) : Number(cupom.valor);
    descontoCupom = Math.min(descontoCupom, subtotal);
  }

  // Cashback do cliente
  let cashbackUsado = 0;
  if (parsed.data.usarCashback) {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    const saldoDisponivel = Number(cliente?.saldoCashback ?? 0);
    const restanteAposCupom = subtotal - descontoCupom;
    cashbackUsado = Math.min(saldoDisponivel, restanteAposCupom);
  }

  const valorTotal = Math.max(subtotal - descontoCupom - cashbackUsado, 0);
  const cashbackGerado = valorTotal * PERCENTUAL_CASHBACK_GERADO;

  try {
    await prisma.$transaction([
      prisma.pedido.create({
        data: {
          tenantId,
          clienteId,
          valorTotal,
          status: "NOVO",
          descontoCupom: descontoCupom > 0 ? descontoCupom : undefined,
          cupomCodigo: cupom?.codigo,
          cashbackUsado: cashbackUsado > 0 ? cashbackUsado : undefined,
          cashbackGerado,
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
      ...(cupom ? [prisma.cupom.update({
        where: { id: cupom.id },
        data: { usosRealizados: { increment: 1 } },
      })] : []),
      ...(cashbackUsado > 0
        ? [
            prisma.cliente.update({
              where: { id: clienteId },
              data: { saldoCashback: { decrement: cashbackUsado } },
            }),
          ]
        : []),
    ]);
  } catch {
    return { erro: "Não foi possível concluir o pedido. Tente novamente." };
  }

  revalidatePath(`/barbearia/${slug}/cliente/pedidos`);
  revalidatePath(`/barbearia/${slug}/cliente/inicio`);
  revalidatePath(`/barbearia/${slug}/loja`);
  return { sucesso: true };
}
