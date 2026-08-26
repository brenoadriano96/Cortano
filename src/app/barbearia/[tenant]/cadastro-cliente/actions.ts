"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PapelUsuario } from "@prisma/client";

export type EstadoCadastro = { erro?: string } | undefined;

const cadastroSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(8, "Telefone inválido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

/**
 * Auto-cadastro do cliente (seção 4.6: "criar conta"). Cria Usuario(papel
 * CLIENTE) + Cliente vinculados, e autentica automaticamente em seguida.
 * Rota pública dentro do tenant — não passa pela guarda de autenticação
 * do layout (ver exceção em src/app/barbearia/[tenant]/layout.tsx).
 */
export async function cadastrarCliente(
  tenantId: string,
  slug: string,
  _estado: EstadoCadastro,
  formData: FormData
): Promise<EstadoCadastro> {
  const parsed = cadastroSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    telefone: formData.get("telefone"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existente = await prisma.usuario.findFirst({
    where: { tenantId, email: parsed.data.email },
  });
  if (existente) {
    return { erro: "Já existe uma conta com este e-mail nesta barbearia." };
  }

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      tenantId,
      nome: parsed.data.nome,
      email: parsed.data.email,
      senhaHash,
      papel: PapelUsuario.CLIENTE,
    },
  });

  await prisma.cliente.create({
    data: {
      tenantId,
      usuarioId: usuario.id,
      nome: parsed.data.nome,
      email: parsed.data.email,
      telefone: parsed.data.telefone,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      senha: parsed.data.senha,
      redirectTo: `/barbearia/${slug}/cliente/inicio`,
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      const digest = (error as { digest?: string }).digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
    }
    if (error instanceof AuthError) {
      return { erro: "Conta criada, mas não foi possível entrar automaticamente. Faça login." };
    }
    throw error;
  }

  return undefined;
}
