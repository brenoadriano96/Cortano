"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

async function exigirSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.papel !== "SUPER_ADMIN") {
    throw new Error("Acesso restrito ao Super Admin");
  }
  return session.user;
}

const editarAssinaturaSchema = z.object({
  status: z.enum(["TRIAL", "ACTIVE", "PAYMENT_PENDING", "SUSPENDED", "CANCELLED"]),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  proximaCobranca: z.string().optional(),
});

/**
 * Edição manual de assinatura SaaS — útil para casos de suporte (ex:
 * ajustar próxima cobrança após negociação, corrigir valor manualmente),
 * já que não há cobrança automática real da barbearia implementada ainda.
 */
export async function editarAssinaturaSaas(
  assinaturaId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const usuario = await exigirSuperAdmin();

  const parsed = editarAssinaturaSchema.safeParse({
    status: formData.get("status"),
    valor: formData.get("valor"),
    proximaCobranca: formData.get("proximaCobranca") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const assinatura = await prisma.assinaturaSaas.findUnique({ where: { id: assinaturaId } });
  if (!assinatura) {
    return { erro: "Assinatura não encontrada." };
  }

  await prisma.assinaturaSaas.update({
    where: { id: assinaturaId },
    data: {
      status: parsed.data.status,
      valor: parsed.data.valor,
      proximaCobranca: parsed.data.proximaCobranca
        ? new Date(parsed.data.proximaCobranca)
        : undefined,
    },
  });

  // Mantém o status do Tenant em sincronia com a assinatura SaaS
  await prisma.tenant.update({
    where: { id: assinatura.tenantId },
    data: { status: parsed.data.status },
  });

  // Seção 21: alteração de dados financeiros é ação crítica
  await registrarAuditoria({
    actorId: usuario.id,
    tenantId: assinatura.tenantId,
    action: "assinatura_saas.editar",
    entityType: "AssinaturaSaas",
    entityId: assinaturaId,
    metadata: {
      statusAnterior: assinatura.status,
      statusNovo: parsed.data.status,
      valorAnterior: Number(assinatura.valor),
      valorNovo: parsed.data.valor,
    },
  });

  revalidatePath("/admin/assinaturas-saas");
  revalidatePath("/admin/barbearias");
  return undefined;
}
