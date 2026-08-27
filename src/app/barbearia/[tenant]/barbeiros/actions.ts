"use server";

import { prisma } from "@/lib/prisma";
import { verificarLimitePlano } from "@/lib/planos";
import { registrarAuditoria } from "@/lib/auditoria";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const barbeiroSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  comissaoPadrao: z.coerce.number().min(0).max(100).default(0),
  servicoIds: z.array(z.string()).optional().default([]),
  unidadeId: z.string().optional(),
  fotoUrl: z.string().optional(),
});

export type EstadoForm = { erro?: string } | undefined;

const SENHA_PADRAO_NOVO_BARBEIRO = "cortano123";

export async function criarBarbeiro(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const parsed = barbeiroSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    comissaoPadrao: formData.get("comissaoPadrao") || 0,
    servicoIds: formData.getAll("servicoIds"),
    unidadeId: formData.get("unidadeId") || undefined,
    fotoUrl: formData.get("fotoUrl") || undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  // Seção 9: checar limite do plano antes de criar
  const limite = await verificarLimitePlano(tenantId, "barbeiros");
  if (!limite.permitido) {
    return { erro: limite.mensagem };
  }

  const emailExistente = await prisma.usuario.findFirst({
    where: { tenantId, email: parsed.data.email },
  });
  if (emailExistente) {
    return { erro: "Já existe um usuário com este e-mail nesta barbearia." };
  }

  const senhaHash = await bcrypt.hash(SENHA_PADRAO_NOVO_BARBEIRO, 10);

  const usuario = await prisma.usuario.create({
    data: {
      tenantId,
      nome: parsed.data.nome,
      email: parsed.data.email,
      senhaHash,
      papel: PapelUsuario.BARBEIRO,
    },
  });

  await prisma.barbeiro.create({
    data: {
      tenantId,
      usuarioId: usuario.id,
      nome: parsed.data.nome,
      comissaoPadrao: parsed.data.comissaoPadrao,
      unidadeId: parsed.data.unidadeId,
      fotoUrl: parsed.data.fotoUrl || undefined,
      servicos: {
        create: parsed.data.servicoIds.map((servicoId) => ({ servicoId })),
      },
    },
  });

  // Seção 21: alteração administrativa (adicionar membro à equipe)
  const session = await auth();
  if (session?.user) {
    await registrarAuditoria({
      actorId: session.user.id,
      tenantId,
      action: "equipe.adicionar_barbeiro",
      entityType: "Usuario",
      entityId: usuario.id,
      metadata: { nome: parsed.data.nome, email: parsed.data.email },
    });
  }

  revalidatePath(`/barbearia/${slug}/barbeiros`);
  return undefined;
}

export async function inativarBarbeiro(tenantId: string, slug: string, barbeiroId: string) {
  await prisma.barbeiro.updateMany({
    where: { id: barbeiroId, tenantId },
    data: { ativo: false },
  });

  const session = await auth();
  if (session?.user) {
    await registrarAuditoria({
      actorId: session.user.id,
      tenantId,
      action: "equipe.remover_barbeiro",
      entityType: "Barbeiro",
      entityId: barbeiroId,
    });
  }

  revalidatePath(`/barbearia/${slug}/barbeiros`);
}

/**
 * Comissão por serviço (seção 15: "comissão"), sobrescrevendo a comissão
 * padrão do barbeiro para um serviço específico — ex: 40% padrão, mas 50%
 * para "Pigmentação" por ser um serviço mais especializado.
 */
export async function atualizarComissaoServico(
  tenantId: string,
  slug: string,
  barbeiroId: string,
  servicoId: string,
  comissao: number
) {
  if (comissao < 0 || comissao > 100) return;

  // Confirma que o barbeiro e o serviço pertencem a este tenant antes de tocar
  const vinculo = await prisma.servicoBarbeiro.findFirst({
    where: {
      barbeiroId,
      servicoId,
      barbeiro: { tenantId },
      servico: { tenantId },
    },
  });
  if (!vinculo) return;

  await prisma.servicoBarbeiro.update({
    where: { id: vinculo.id },
    data: { comissao },
  });

  revalidatePath(`/barbearia/${slug}/barbeiros`);
}
