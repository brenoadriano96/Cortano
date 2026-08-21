import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

/**
 * Resolve o tenant (barbearia) atual a partir do slug.
 * O slug pode vir de:
 *  - subdomínio: barbearia1.plataforma.com -> slug = "barbearia1"
 *  - path: app.plataforma.com/barbearia/barbearia1 -> slug = "barbearia1"
 *
 * A extração do slug (subdomínio vs path) acontece no middleware.ts,
 * que injeta o header "x-tenant-slug" usado aqui.
 */
export async function getTenantBySlug(slug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  return tenant;
}

/**
 * Aplica a regra da seção 11: acesso administrativo (Cortano Business) deve
 * ser bloqueado quando o tenant está SUSPENDED ou CANCELLED. Chamar isto no
 * layout do painel da barbearia, redirecionando para /regularizacao se falhar.
 * PAYMENT_PENDING continua liberado durante o período de tolerância.
 */
export function acessoBusinessLiberado(status: string) {
  return status !== "SUSPENDED" && status !== "CANCELLED";
}

/**
 * Regra de negócio central de multi-tenancy:
 * TODA query em models com tenantId deve filtrar por este id.
 * Nunca confiar em tenantId vindo do client sem validar contra a sessão/slug atual.
 */
export function withTenant<T extends Record<string, unknown>>(
  tenantId: string,
  where: T = {} as T
) {
  return { ...where, tenantId };
}
