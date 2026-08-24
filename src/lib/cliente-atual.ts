import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Resolve o Cliente vinculado à sessão atual. Usar em toda página da área
 * Cortano Client — garante que o cliente só veja/edite os próprios dados
 * (nunca de outro cliente do mesmo tenant).
 */
export async function getClienteAtual(tenantId: string) {
  const session = await auth();
  if (!session?.user || session.user.papel !== "CLIENTE") {
    redirect("/login");
  }

  const cliente = await prisma.cliente.findFirst({
    where: { tenantId, usuarioId: session.user.id },
  });

  if (!cliente) {
    redirect("/login");
  }

  return cliente;
}
