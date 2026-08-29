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

/**
 * Editar um plano já existente (preço, limites). Mudar limites de um plano
 * ativo afeta imediatamente todas as barbearias já nele — o formulário
 * (na página) já mostra quantas barbearias usam o plano antes de salvar,
 * para o Super Admin decidir com essa informação em mãos.
 */
export async function editarPlano(
  planoId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
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

  await prisma.planoSaas.update({
    where: { id: planoId },
    data: {
      nome: parsed.data.nome,
      precoMensal: parsed.data.precoMensal,
      maxBarbeiros: parsed.data.maxBarbeiros ?? null,
      maxUsuarios: parsed.data.maxUsuarios ?? null,
      maxClientes: parsed.data.maxClientes ?? null,
      maxProdutos: parsed.data.maxProdutos ?? null,
    },
  });

  // Seção 21: alteração de plano é ação crítica
  await registrarAuditoria({
    actorId: usuario.id,
    action: "plano_saas.editar",
    entityType: "PlanoSaas",
    entityId: planoId,
    metadata: parsed.data,
  });

  revalidatePath("/admin/planos");
  return undefined;
}
