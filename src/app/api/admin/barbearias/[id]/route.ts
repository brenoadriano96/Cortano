import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const acaoSchema = z.object({
  acao: z.enum(["suspender", "reativar", "cancelar"]),
  motivo: z.string().optional(),
});

const STATUS_POR_ACAO = {
  suspender: "SUSPENDED",
  reativar: "ACTIVE",
  cancelar: "CANCELLED",
} as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const papel = req.headers.get("x-user-papel");
  const actorId = req.headers.get("x-user-id");
  if (papel !== "SUPER_ADMIN" || !actorId) {
    return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = acaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 });
  }

  const novoStatus = STATUS_POR_ACAO[parsed.data.acao];

  const atualizado = await prisma.tenant.update({
    where: { id },
    data: { status: novoStatus },
  });

  // Ação crítica -> auditoria obrigatória (seção 21)
  await registrarAuditoria({
    actorId,
    tenantId: id,
    action: `tenant.${parsed.data.acao}`,
    entityType: "Tenant",
    entityId: id,
    metadata: {
      statusAnterior: tenant.status,
      statusNovo: novoStatus,
      motivo: parsed.data.motivo,
    },
  });

  return NextResponse.json(atualizado);
}
