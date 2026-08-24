"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string; sucesso?: boolean } | undefined;

const perfilSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
});

export async function atualizarPerfilCliente(
  tenantId: string,
  slug: string,
  clienteId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = perfilSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") || undefined,
    dataNascimento: formData.get("dataNascimento") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.cliente.updateMany({
    where: { id: clienteId, tenantId },
    data: {
      nome: parsed.data.nome,
      telefone: parsed.data.telefone,
      dataNascimento: parsed.data.dataNascimento
        ? new Date(parsed.data.dataNascimento)
        : undefined,
    },
  });

  revalidatePath(`/barbearia/${slug}/cliente/perfil`);
  return { sucesso: true };
}
