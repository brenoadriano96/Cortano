"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { revalidatePath } from "next/cache";
import { PapelUsuario } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

export type EstadoForm = { erro?: string } | undefined;

const novoAdminSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

async function exigirSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.papel !== "SUPER_ADMIN") {
    throw new Error("Acesso restrito ao Super Admin");
  }
  return session.user;
}

export async function criarUsuarioAdmin(
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const usuario = await exigirSuperAdmin();

  const parsed = novoAdminSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existente = await prisma.usuario.findFirst({
    where: { email: parsed.data.email, tenantId: null },
  });
  if (existente) {
    return { erro: "Já existe um administrador com este e-mail." };
  }

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);

  const novoAdmin = await prisma.usuario.create({
    data: {
      tenantId: null,
      nome: parsed.data.nome,
      email: parsed.data.email,
      senhaHash,
      papel: PapelUsuario.SUPER_ADMIN,
    },
  });

  // Alteração de permissões/administrador é ação crítica (seção 21)
  await registrarAuditoria({
    actorId: usuario.id,
    action: "usuario_admin.criar",
    entityType: "Usuario",
    entityId: novoAdmin.id,
    metadata: { email: novoAdmin.email },
  });

  revalidatePath("/admin/usuarios");
  return undefined;
}

export async function desativarUsuarioAdmin(usuarioAlvoId: string) {
  const usuario = await exigirSuperAdmin();

  if (usuarioAlvoId === usuario.id) {
    // Nunca permitir que o Super Admin desative a própria conta por engano
    return;
  }

  await prisma.usuario.update({
    where: { id: usuarioAlvoId },
    data: { ativo: false },
  });

  await registrarAuditoria({
    actorId: usuario.id,
    action: "usuario_admin.desativar",
    entityType: "Usuario",
    entityId: usuarioAlvoId,
  });

  revalidatePath("/admin/usuarios");
}

/**
 * Só o nome é editável aqui — trocar o e-mail de login merece um fluxo
 * próprio de confirmação (fora de escopo agora, decisão registrada desde
 * a Fase 2 de edição de barbeiros).
 */
export async function editarNomeUsuarioAdmin(
  usuarioAlvoId: string,
  _estado: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const usuario = await exigirSuperAdmin();

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome || nome.length < 2) {
    return { erro: "Nome muito curto." };
  }

  await prisma.usuario.update({
    where: { id: usuarioAlvoId },
    data: { nome },
  });

  await registrarAuditoria({
    actorId: usuario.id,
    action: "usuario_admin.editar_nome",
    entityType: "Usuario",
    entityId: usuarioAlvoId,
    metadata: { nome },
  });

  revalidatePath("/admin/usuarios");
  return undefined;
}
