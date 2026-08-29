"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type EstadoTroca = { erro?: string } | undefined;

/**
 * Troca de plano (upgrade/downgrade) — vale imediatamente, sem cobrança
 * proporcional pelo tempo restante do plano anterior (decisão do produto:
 * sem cobrança recorrente automatizada por ora). A próxima cobrança segue
 * na mesma data já agendada, só que com o valor do novo plano dali pra frente.
 *
 * Limitação conhecida: se a assinatura tiver uma cobrança ativa via Stripe
 * (gatewaySubscriptionId preenchido), o valor cobrado *no Stripe* não muda
 * automaticamente aqui — isso exigiria integrar a API de atualização de
 * assinatura do Stripe. Por ora, a troca é só no registro interno do
 * Cortano; ajustar o valor no Stripe é um passo manual/futuro.
 */
export async function trocarPlanoCliente(
  tenantId: string,
  slug: string,
  clienteId: string,
  novoPlanoId: string
): Promise<EstadoTroca> {
  const assinatura = await prisma.assinaturaCliente.findFirst({
    where: { tenantId, clienteId, status: { in: ["ATIVA", "INADIMPLENTE"] } },
  });
  if (!assinatura) {
    return { erro: "Nenhuma assinatura ativa encontrada." };
  }

  const novoPlano = await prisma.planoCliente.findFirst({
    where: { id: novoPlanoId, tenantId, ativo: true },
  });
  if (!novoPlano) {
    return { erro: "Plano não encontrado." };
  }

  if (novoPlano.id === assinatura.planoId) {
    return { erro: "Você já está neste plano." };
  }

  await prisma.assinaturaCliente.update({
    where: { id: assinatura.id },
    data: { planoId: novoPlano.id },
  });

  revalidatePath(`/barbearia/${slug}/cliente/meu-plano`);
  return undefined;
}
