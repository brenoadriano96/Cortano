"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import { PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

/**
 * Só Proprietário (ou Super Admin) pode criar/editar perfis e permissões —
 * gestão de acesso é decisão do dono do negócio, não de um Gerente (que
 * poderia, senão, se auto-promover ou criar outros Gerentes sem controle).
 */
async function exigirProprietario(tenantId: string) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.papel !== "PROPRIETARIO" && session.user.papel !== "SUPER_ADMIN") ||
    (session.user.papel !== "SUPER_ADMIN" && session.user.tenantId !== tenantId)
  ) {
    throw new Error("Acesso restrito ao Proprietário");
  }
  return session.user;
}

const novoPerfilSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  papel: z.enum(["GERENTE", "ATENDENTE"]),
});

export async function criarPerfilEquipe(
  tenantId: string,
  slug: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const usuarioAtor = await exigirProprietario(tenantId);

  const parsed = novoPerfilSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    papel: formData.get("papel"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existente = await prisma.usuario.findFirst({
    where: { tenantId, email: parsed.data.email },
  });
  if (existente) {
    return { erro: "Já existe um usuário com este e-mail nesta barbearia." };
  }

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);

  const novoUsuario = await prisma.usuario.create({
    data: {
      tenantId,
      nome: parsed.data.nome,
      email: parsed.data.email,
      senhaHash,
      papel: parsed.data.papel as PapelUsuario,
    },
  });

  // Seção 21: alteração de permissões/administrativa
  await registrarAuditoria({
    actorId: usuarioAtor.id,
    tenantId,
    action: "equipe.adicionar_perfil",
    entityType: "Usuario",
    entityId: novoUsuario.id,
    metadata: { papel: parsed.data.papel, email: parsed.data.email },
  });

  revalidatePath(`/barbearia/${slug}/configuracoes`);
  return undefined;
}

const permissoesGerenteSchema = z.object({
  "agenda.gerenciar": z.boolean(),
  "clientes.gerenciar": z.boolean(),
  "equipe.visualizar": z.boolean(),
  "servicos.gerenciar": z.boolean(),
  "financeiro.visualizar": z.boolean(),
  "relatorios.visualizar": z.boolean(),
});

export async function atualizarPermissoesGerente(
  tenantId: string,
  slug: string,
  usuarioId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const usuarioAtor = await exigirProprietario(tenantId);

  const chaves = [
    "agenda.gerenciar",
    "clientes.gerenciar",
    "equipe.visualizar",
    "servicos.gerenciar",
    "financeiro.visualizar",
    "relatorios.visualizar",
  ] as const;

  const permissoes = Object.fromEntries(
    chaves.map((chave) => [chave, formData.get(chave) === "on"])
  );

  const parsed = permissoesGerenteSchema.safeParse(permissoes);
  if (!parsed.success) {
    return { erro: "Dados de permissão inválidos." };
  }

  const alvo = await prisma.usuario.findFirst({
    where: { id: usuarioId, tenantId, papel: "GERENTE" },
  });
  if (!alvo) {
    return { erro: "Gerente não encontrado." };
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { permissoes: parsed.data },
  });

  // Seção 21: "alteração de permissões" é ação crítica auditada
  await registrarAuditoria({
    actorId: usuarioAtor.id,
    tenantId,
    action: "equipe.alterar_permissoes",
    entityType: "Usuario",
    entityId: usuarioId,
    metadata: parsed.data,
  });

  revalidatePath(`/barbearia/${slug}/configuracoes`);
  return undefined;
}

export async function desativarPerfilEquipe(
  tenantId: string,
  slug: string,
  usuarioId: string
) {
  const usuarioAtor = await exigirProprietario(tenantId);

  if (usuarioId === usuarioAtor.id) return; // nunca desativar a si mesmo

  await prisma.usuario.updateMany({
    where: { id: usuarioId, tenantId, papel: { in: ["GERENTE", "ATENDENTE"] } },
    data: { ativo: false },
  });

  await registrarAuditoria({
    actorId: usuarioAtor.id,
    tenantId,
    action: "equipe.desativar_perfil",
    entityType: "Usuario",
    entityId: usuarioId,
  });

  revalidatePath(`/barbearia/${slug}/configuracoes`);
}
