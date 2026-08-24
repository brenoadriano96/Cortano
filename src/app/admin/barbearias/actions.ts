"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

const criarBarbeariaSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  slug: z
    .string()
    .min(2, "Slug muito curto")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  responsavelNome: z.string().optional(),
  planoId: z.string().min(1, "Selecione um plano"),
});

async function exigirSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.papel !== "SUPER_ADMIN") {
    throw new Error("Acesso restrito ao Super Admin");
  }
  return session.user;
}

export async function criarBarbearia(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const usuario = await exigirSuperAdmin();

  const parsed = criarBarbeariaSchema.safeParse({
    nome: formData.get("nome"),
    slug: formData.get("slug"),
    email: formData.get("email") || undefined,
    telefone: formData.get("telefone") || undefined,
    responsavelNome: formData.get("responsavelNome") || undefined,
    planoId: formData.get("planoId"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existente = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug } });
  if (existente) {
    return { erro: "Já existe uma barbearia com este slug." };
  }

  const plano = await prisma.planoSaas.findUnique({ where: { id: parsed.data.planoId } });
  if (!plano) {
    return { erro: "Plano não encontrado." };
  }

  const config = await prisma.configuracaoPlataforma.findUnique({
    where: { id: "singleton" },
  });
  const trialDias = config?.trialDiasPadrao ?? 14;

  const trialFim = new Date();
  trialFim.setDate(trialFim.getDate() + trialDias);

  const tenant = await prisma.tenant.create({
    data: {
      nome: parsed.data.nome,
      slug: parsed.data.slug,
      email: parsed.data.email || undefined,
      telefone: parsed.data.telefone,
      responsavelNome: parsed.data.responsavelNome,
      planoId: plano.id,
      status: "TRIAL",
      dataVencimento: trialFim,
      assinaturaSaas: {
        create: {
          planoId: plano.id,
          status: "TRIAL",
          valor: plano.precoMensal,
          ciclo: plano.cicloCobranca,
          trialFim,
        },
      },
    },
  });

  await registrarAuditoria({
    actorId: usuario.id,
    tenantId: tenant.id,
    action: "tenant.criar",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { nome: tenant.nome, planoId: plano.id },
  });

  revalidatePath("/admin/barbearias");
  return undefined;
}

export async function alterarStatusBarbearia(
  tenantId: string,
  acao: "suspender" | "reativar" | "cancelar"
) {
  const usuario = await exigirSuperAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return;

  const novoStatus = { suspender: "SUSPENDED", reativar: "ACTIVE", cancelar: "CANCELLED" }[
    acao
  ] as "SUSPENDED" | "ACTIVE" | "CANCELLED";

  await prisma.tenant.update({ where: { id: tenantId }, data: { status: novoStatus } });

  // Seção 21: ação crítica -> auditoria obrigatória
  await registrarAuditoria({
    actorId: usuario.id,
    tenantId,
    action: `tenant.${acao}`,
    entityType: "Tenant",
    entityId: tenantId,
    metadata: { statusAnterior: tenant.status, statusNovo: novoStatus },
  });

  revalidatePath("/admin/barbearias");
}

export async function alterarPlanoBarbearia(tenantId: string, novoPlanoId: string) {
  const usuario = await exigirSuperAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const novoPlano = await prisma.planoSaas.findUnique({ where: { id: novoPlanoId } });
  if (!tenant || !novoPlano) return;

  await prisma.tenant.update({ where: { id: tenantId }, data: { planoId: novoPlanoId } });

  // Mantém a assinatura SaaS em sincronia com o novo plano/valor (upgrade/downgrade)
  await prisma.assinaturaSaas.updateMany({
    where: { tenantId },
    data: { planoId: novoPlanoId, valor: novoPlano.precoMensal },
  });

  // Alteração de plano é ação crítica (seção 21)
  await registrarAuditoria({
    actorId: usuario.id,
    tenantId,
    action: "tenant.alterar_plano",
    entityType: "Tenant",
    entityId: tenantId,
    metadata: { planoAnteriorId: tenant.planoId, planoNovoId: novoPlanoId },
  });

  revalidatePath("/admin/barbearias");
}
