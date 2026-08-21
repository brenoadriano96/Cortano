import { prisma } from "@/lib/prisma";

/**
 * Verifica se o tenant pode criar mais um recurso do tipo informado,
 * de acordo com os limites do seu PlanoSaas (seção 8 e 9).
 *
 * Retorna { permitido: true } ou { permitido: false, mensagem } pronta
 * para exibir ao usuário, seguindo o exemplo da seção 9:
 * "Limite do plano atingido. Seu plano atual permite até N barbeiros.
 *  Faça upgrade para adicionar mais profissionais."
 */
export async function verificarLimitePlano(
  tenantId: string,
  recurso: "barbeiros" | "usuarios" | "clientes" | "produtos"
): Promise<{ permitido: boolean; mensagem?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plano: true },
  });

  if (!tenant) {
    return { permitido: false, mensagem: "Barbearia não encontrada." };
  }

  // Bloqueio por status da conta (seção 11 — inadimplência/suspensão)
  if (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
    return {
      permitido: false,
      mensagem: "Esta conta está suspensa. Regularize o pagamento para continuar.",
    };
  }

  const plano = tenant.plano;
  if (!plano) {
    // Sem plano definido = sem limite configurado ainda; deixa passar mas loga.
    return { permitido: true };
  }

  const limites: Record<string, number | null> = {
    barbeiros: plano.maxBarbeiros,
    usuarios: plano.maxUsuarios,
    clientes: plano.maxClientes,
    produtos: plano.maxProdutos,
  };

  const limite = limites[recurso];
  if (limite === null || limite === undefined) {
    return { permitido: true }; // ilimitado
  }

  const contagemAtual = await contarRecurso(tenantId, recurso);

  if (contagemAtual >= limite) {
    const nomeRecurso = {
      barbeiros: "profissionais",
      usuarios: "usuários",
      clientes: "clientes",
      produtos: "produtos",
    }[recurso];

    return {
      permitido: false,
      mensagem: `Limite do plano atingido. Seu plano atual (${plano.nome}) permite até ${limite} ${nomeRecurso}. Faça upgrade para adicionar mais.`,
    };
  }

  return { permitido: true };
}

async function contarRecurso(
  tenantId: string,
  recurso: "barbeiros" | "usuarios" | "clientes" | "produtos"
) {
  switch (recurso) {
    case "barbeiros":
      return prisma.barbeiro.count({ where: { tenantId, ativo: true } });
    case "usuarios":
      return prisma.usuario.count({ where: { tenantId, ativo: true } });
    case "clientes":
      return prisma.cliente.count({ where: { tenantId, ativo: true } });
    case "produtos":
      return prisma.produto.count({ where: { tenantId, ativo: true } });
  }
}
