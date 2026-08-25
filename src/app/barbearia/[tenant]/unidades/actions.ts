"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

const unidadeSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
});

export async function criarUnidade(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = unidadeSchema.safeParse({
    nome: formData.get("nome"),
    endereco: formData.get("endereco") || undefined,
    telefone: formData.get("telefone") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.unidade.create({ data: { tenantId, ...parsed.data } });

  revalidatePath(`/barbearia/${slug}/unidades`);
  return undefined;
}

export async function inativarUnidade(tenantId: string, slug: string, unidadeId: string) {
  // Não permite inativar unidade que ainda tem barbeiros vinculados —
  // evita agendamentos órfãos sem localização válida
  const barbeirosVinculados = await prisma.barbeiro.count({
    where: { unidadeId, tenantId, ativo: true },
  });
  if (barbeirosVinculados > 0) return;

  await prisma.unidade.updateMany({
    where: { id: unidadeId, tenantId },
    data: { ativo: false },
  });
  revalidatePath(`/barbearia/${slug}/unidades`);
}
