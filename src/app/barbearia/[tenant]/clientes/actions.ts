"use server";

import { prisma } from "@/lib/prisma";
import { verificarLimitePlano } from "@/lib/planos";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const clienteSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  observacoes: z.string().optional(),
});

export type EstadoForm = { erro?: string } | undefined;

export async function criarCliente(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = clienteSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") || undefined,
    email: formData.get("email") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  // Seção 9: nunca criar recurso sem checar limite do plano no backend
  const limite = await verificarLimitePlano(tenantId, "clientes");
  if (!limite.permitido) {
    return { erro: limite.mensagem };
  }

  await prisma.cliente.create({
    data: { tenantId, ...parsed.data },
  });

  revalidatePath(`/barbearia/${slug}/clientes`);
  return undefined;
}

export async function atualizarCliente(
  tenantId: string,
  slug: string,
  clienteId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = clienteSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") || undefined,
    email: formData.get("email") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  // Isolamento de tenant: o update só afeta registro que pertence a este tenant
  await prisma.cliente.updateMany({
    where: { id: clienteId, tenantId },
    data: parsed.data,
  });

  revalidatePath(`/barbearia/${slug}/clientes`);
  return undefined;
}

export async function inativarCliente(tenantId: string, slug: string, clienteId: string) {
  await prisma.cliente.updateMany({
    where: { id: clienteId, tenantId },
    data: { ativo: false },
  });
  revalidatePath(`/barbearia/${slug}/clientes`);
}
