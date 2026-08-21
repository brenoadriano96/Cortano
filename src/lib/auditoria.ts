import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Registra uma ação crítica no audit_logs (seção 21).
 * Chamar sempre após: criação/suspensão/reativação/cancelamento de barbearia,
 * alteração de plano, alteração de permissões, alteração de dados financeiros.
 */
export async function registrarAuditoria(params: {
  actorId: string;
  tenantId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      tenantId: params.tenantId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
