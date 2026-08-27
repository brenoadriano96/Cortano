"use server";

import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

const brandingSchema = z.object({
  corPrimaria: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use um código hexadecimal válido (ex: #171717)"),
  logoUrl: z.string().optional(), // pode ser URL http(s) ou data URL (upload base64)
});

export async function atualizarBranding(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  // Prioriza o upload (base64) sobre a URL de texto, se ambos preenchidos
  const logoUpload = formData.get("logoUrl") as string | null;
  const logoTexto = formData.get("logoUrlTexto") as string | null;
  const logoFinal = logoUpload && logoUpload.trim() !== "" ? logoUpload : logoTexto;

  const parsed = brandingSchema.safeParse({
    corPrimaria: formData.get("corPrimaria"),
    logoUrl: logoFinal || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      corPrimaria: parsed.data.corPrimaria,
      logoUrl: parsed.data.logoUrl || undefined,
    },
  });

  const session = await auth();
  if (session?.user) {
    await registrarAuditoria({
      actorId: session.user.id,
      tenantId,
      action: "barbearia.atualizar_branding",
      entityType: "Tenant",
      entityId: tenantId,
      metadata: parsed.data,
    });
  }

  revalidatePath(`/barbearia/${slug}`, "layout");
  return undefined;
}

const cupomSchema = z.object({
  codigo: z
    .string()
    .min(2, "Código muito curto")
    .transform((v) => v.toUpperCase().trim()),
  tipo: z.enum(["PERCENTUAL", "VALOR_FIXO"]),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
  validoAte: z.string().optional(),
  usoMaximo: z.coerce.number().int().positive().optional(),
});

export async function criarCupom(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = cupomSchema.safeParse({
    codigo: formData.get("codigo"),
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    validoAte: formData.get("validoAte") || undefined,
    usoMaximo: formData.get("usoMaximo") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  if (parsed.data.tipo === "PERCENTUAL" && parsed.data.valor > 100) {
    return { erro: "Percentual não pode ser maior que 100." };
  }

  const existente = await prisma.cupom.findFirst({
    where: { tenantId, codigo: parsed.data.codigo },
  });
  if (existente) {
    return { erro: "Já existe um cupom com este código." };
  }

  await prisma.cupom.create({
    data: {
      tenantId,
      codigo: parsed.data.codigo,
      tipo: parsed.data.tipo,
      valor: parsed.data.valor,
      validoAte: parsed.data.validoAte ? new Date(parsed.data.validoAte) : undefined,
      usoMaximo: parsed.data.usoMaximo,
    },
  });

  // Seção 21: alteração de dados financeiros (cupom afeta faturamento)
  const session = await auth();
  if (session?.user) {
    await registrarAuditoria({
      actorId: session.user.id,
      tenantId,
      action: "cupom.criar",
      entityType: "Cupom",
      entityId: parsed.data.codigo,
      metadata: { tipo: parsed.data.tipo, valor: parsed.data.valor },
    });
  }

  revalidatePath(`/barbearia/${slug}/configuracoes`);
  return undefined;
}

export async function inativarCupom(tenantId: string, slug: string, cupomId: string) {
  await prisma.cupom.updateMany({
    where: { id: cupomId, tenantId },
    data: { ativo: false },
  });
  revalidatePath(`/barbearia/${slug}/configuracoes`);
}

const RECOMPENSA_INDICACAO = 20; // R$ de cashback ao indicador quando a indicação vira cliente

export async function converterIndicacao(
  tenantId: string,
  slug: string,
  indicacaoId: string
) {
  const indicacao = await prisma.indicacao.findFirst({
    where: { id: indicacaoId, tenantId, status: "PENDENTE" },
  });
  if (!indicacao) return;

  await prisma.$transaction([
    prisma.indicacao.update({
      where: { id: indicacaoId },
      data: { status: "CONVERTIDO", recompensaValor: RECOMPENSA_INDICACAO },
    }),
    prisma.cliente.update({
      where: { id: indicacao.clienteIndicadorId },
      data: { saldoCashback: { increment: RECOMPENSA_INDICACAO } },
    }),
  ]);

  // Seção 21: alteração de dados financeiros (concede cashback)
  const session = await auth();
  if (session?.user) {
    await registrarAuditoria({
      actorId: session.user.id,
      tenantId,
      action: "indicacao.converter",
      entityType: "Indicacao",
      entityId: indicacaoId,
      metadata: { recompensaValor: RECOMPENSA_INDICACAO },
    });
  }

  revalidatePath(`/barbearia/${slug}/configuracoes`);
}
