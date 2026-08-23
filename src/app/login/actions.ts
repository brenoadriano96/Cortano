"use server";

import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type EstadoLogin = { erro?: string } | undefined;

/**
 * Autentica o usuário e redireciona conforme o papel (seção 23):
 * - SUPER_ADMIN -> /admin
 * - PROPRIETARIO/GERENTE/BARBEIRO/ATENDENTE -> /barbearia/[slug]/dashboard
 * - CLIENTE -> /barbearia/[slug]/cliente/inicio
 */
export async function autenticar(
  _estadoAnterior: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      senha: formData.get("senha"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { erro: "E-mail ou senha inválidos." };
    }
    throw error;
  }

  const session = await auth();
  if (!session?.user) {
    return { erro: "Não foi possível autenticar. Tente novamente." };
  }

  if (session.user.papel === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (!session.user.tenantId) {
    return { erro: "Usuário sem barbearia associada." };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (!tenant) {
    return { erro: "Barbearia não encontrada." };
  }

  const destino =
    session.user.papel === "CLIENTE"
      ? `/barbearia/${tenant.slug}/cliente/inicio`
      : `/barbearia/${tenant.slug}/dashboard`;

  redirect(destino);
}

