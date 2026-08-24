"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

const planoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  precoMensal: z.coerce.number().positive("Preço deve ser maior que zero"),
  maxBarbeiros: z.coerce.number().int().positive().optional(),
  maxUsuarios: z.coerce.number().int().positive().optional(),
  maxClientes: z.coerce.number().int().positive().optional(),
  maxProdutos: z.coerce.number().int().positive().optional(),
});

async function exigirSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.papel !== "SUPER_ADMIN") {
    throw new Error("Acesso restrito ao Super Admin");
  }
  return session.user;
}

export async function criarPlano(_estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await exigirSuperAdmin();

  const parseOpcional = (v: FormDataEntryValue | null) =>
    v && v.toString().trim() !== "" ? v : undefined;

  const parsed = planoSchema.safeParse({
    nome: formData.get("nome"),
    precoMensal: formData.get("precoMensal"),
    maxBarbeiros: parseOpcional(formData.get("maxBarbeiros")),
    maxUsuarios: parseOpcional(formData.get("maxUsuarios")),
    maxClientes: parseOpcional(formData.get("maxClientes")),
    maxProdutos: parseOpcional(formData.get("maxProdutos")),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const plano = await prisma.planoSaas.create({ data: parsed.data });

  // Alteração de plano é ação crítica (seção 21)
  await registrarAuditoria({
    actorId: usuario.id,
    action: "plano_saas.criar",
    entityType: "PlanoSaas",
    entityId: plano.id,
    metadata: { nome: plano.nome, precoMensal: parsed.data.precoMensal },
  });

  revalidatePath("/admin/planos");
  return undefined;
}

export async function inativarPlano(planoId: string) {
  const usuario = await exigirSuperAdmin();

  await prisma.planoSaas.update({ where: { id: planoId }, data: { ativo: false } });

  await registrarAuditoria({
    actorId: usuario.id,
    action: "plano_saas.inativar",
    entityType: "PlanoSaas",
    entityId: planoId,
  });

  revalidatePath("/admin/planos");
}
