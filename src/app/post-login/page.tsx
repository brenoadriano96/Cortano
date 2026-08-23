import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Redireciona o usuário recém-autenticado conforme o papel (seção 23):
 * - SUPER_ADMIN -> /admin
 * - CLIENTE -> /barbearia/[slug]/cliente/inicio
 * - demais papéis (proprietário, gerente, barbeiro, atendente) -> dashboard
 *
 * Rodar em uma página separada (em vez de dentro da mesma server action do
 * login) garante que a sessão já esteja disponível — ela só fica pronta na
 * requisição seguinte ao signIn.
 */
export default async function PostLoginPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.papel === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (!session.user.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });

  if (!tenant) {
    redirect("/login");
  }

  const destino =
    session.user.papel === "CLIENTE"
      ? `/barbearia/${tenant.slug}/cliente/inicio`
      : `/barbearia/${tenant.slug}/dashboard`;

  redirect(destino);
}
