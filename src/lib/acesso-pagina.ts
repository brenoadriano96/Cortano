import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { temAcessoGestao } from "@/lib/rbac";
import { redirect } from "next/navigation";

/**
 * Usar no topo de páginas restritas a Proprietário/Gerente (financeiro,
 * configurações, relatórios, unidades, gestão de equipe, assinaturas) —
 * seções 4.2 e 4.3. Barbeiro e Atendente são redirecionados para o
 * dashboard em vez de ver conteúdo que não deveriam.
 */
export async function exigirAcessoGestao(slug: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/barbearia/${slug}/dashboard`);
  }
  if (!temAcessoGestao(session.user.papel)) {
    redirect(`/barbearia/${slug}/dashboard`);
  }
  return session.user;
}

/**
 * Resolve o registro de Barbeiro vinculado ao usuário logado, quando
 * aplicável (papel BARBEIRO). Usado para restringir a Agenda e a lista de
 * Clientes ao que é relevante para aquele profissional (seção 4.4:
 * "visualizar própria agenda", "clientes relacionados aos seus atendimentos").
 */
export async function getBarbeiroVinculado(tenantId: string, usuarioId: string) {
  return prisma.barbeiro.findFirst({ where: { tenantId, usuarioId } });
}
