"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string; sucesso?: boolean } | undefined;

const configSchema = z.object({
  trialDiasPadrao: z.coerce.number().int().positive("Deve ser maior que zero"),
  suporteEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

export async function atualizarConfiguracao(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const session = await auth();
  if (!session?.user || session.user.papel !== "SUPER_ADMIN") {
    return { erro: "Acesso restrito ao Super Admin" };
  }

  const parsed = configSchema.safeParse({
    trialDiasPadrao: formData.get("trialDiasPadrao"),
    suporteEmail: formData.get("suporteEmail") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.configuracaoPlataforma.upsert({
    where: { id: "singleton" },
    update: {
      trialDiasPadrao: parsed.data.trialDiasPadrao,
      suporteEmail: parsed.data.suporteEmail || null,
    },
    create: {
      id: "singleton",
      trialDiasPadrao: parsed.data.trialDiasPadrao,
      suporteEmail: parsed.data.suporteEmail || null,
    },
  });

  // Alteração de configuração administrativa (seção 21)
  await registrarAuditoria({
    actorId: session.user.id,
    action: "configuracao_plataforma.atualizar",
    entityType: "ConfiguracaoPlataforma",
    entityId: "singleton",
    metadata: parsed.data,
  });

  revalidatePath("/admin/configuracoes");
  return { sucesso: true };
}
