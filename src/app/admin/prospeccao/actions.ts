"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

const prospectoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  contatoNome: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  origem: z.string().optional(),
  valorEstimado: z.coerce.number().positive().optional(),
  observacoes: z.string().optional(),
});

async function exigirSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.papel !== "SUPER_ADMIN") {
    throw new Error("Acesso restrito ao Super Admin");
  }
  return session.user;
}

export async function criarProspecto(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  await exigirSuperAdmin();

  const parsed = prospectoSchema.safeParse({
    nome: formData.get("nome"),
    contatoNome: formData.get("contatoNome") || undefined,
    telefone: formData.get("telefone") || undefined,
    email: formData.get("email") || undefined,
    endereco: formData.get("endereco") || undefined,
    origem: formData.get("origem") || undefined,
    valorEstimado: formData.get("valorEstimado") || undefined,
    observacoes: formData.get("observacoes") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await prisma.prospectoBarbearia.create({ data: parsed.data });

  revalidatePath("/admin/prospeccao");
  return undefined;
}

const STATUS_VALIDOS = [
  "NOVO",
  "CONTATADO",
  "VISITA_AGENDADA",
  "EM_NEGOCIACAO",
  "GANHO",
  "PERDIDO",
] as const;

export async function atualizarStatusProspecto(
  prospectoId: string,
  novoStatus: (typeof STATUS_VALIDOS)[number]
) {
  await exigirSuperAdmin();
  if (!STATUS_VALIDOS.includes(novoStatus)) return;

  await prisma.prospectoBarbearia.update({
    where: { id: prospectoId },
    data: { status: novoStatus },
  });

  revalidatePath("/admin/prospeccao");
}
