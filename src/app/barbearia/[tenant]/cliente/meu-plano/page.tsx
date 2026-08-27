import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";
import { BotaoAssinar } from "./botao-assinar";

function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function ClienteMeuPlanoPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const assinatura = await prisma.assinaturaCliente.findFirst({
    where: { tenantId: tenant.id, clienteId: cliente.id, status: { in: ["ATIVA", "INADIMPLENTE"] } },
    include: {
      plano: { include: { servicosInclusos: { include: { servico: true } } } },
      cobrancas: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!assinatura) {
    const planosDisponiveis = await prisma.planoCliente.findMany({
      where: { tenantId: tenant.id, ativo: true },
    });

    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold mb-2">Meu plano</h1>
        <p className="text-neutral-500 mb-6">
          Você ainda não tem um plano ativo. Assine um plano recorrente e economize
          nos seus cortes.
        </p>
        <div className="space-y-3">
          {planosDisponiveis.map((p) => (
            <BotaoAssinar
              key={p.id}
              planoClienteId={p.id}
              tenantSlug={slug}
              nomePlano={p.nome}
              precoMensal={Number(p.precoMensal)}
            />
          ))}
          {planosDisponiveis.length === 0 && (
            <div className="bg-white rounded-lg border p-6 text-center text-neutral-400">
              Esta barbearia ainda não configurou planos de assinatura.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Uso do mês: quantos atendimentos concluídos de cada serviço incluso
  const usoPorServico = await Promise.all(
    assinatura.plano.servicosInclusos.map(async (item) => {
      const usados = await prisma.agendamentoServico.count({
        where: {
          servicoId: item.servicoId,
          agendamento: {
            tenantId: tenant.id,
            clienteId: cliente.id,
            status: "ATENDIDO",
            dataHoraInicio: { gte: inicioDoMes() },
          },
        },
      });
      return { nome: item.servico.nome, usados, total: item.quantidadeMes };
    })
  );

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Meu plano</h1>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <p className="font-medium text-lg">{assinatura.plano.nome}</p>
        <p className="text-sm text-neutral-500">
          R$ {Number(assinatura.plano.precoMensal).toFixed(2)}/mês · Próxima cobrança:{" "}
          {assinatura.proximaCobranca.toLocaleDateString("pt-BR")}
        </p>
        <span
          className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
            assinatura.status === "ATIVA"
              ? "bg-green-100 text-green-700"
              : "bg-neutral-200 text-neutral-600"
          }`}
        >
          {assinatura.status === "ATIVA" ? "Ativa" : assinatura.status}
        </span>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <p className="text-sm font-medium mb-3">Uso este mês</p>
        <div className="space-y-2">
          {usoPorServico.map((s) => (
            <div key={s.nome} className="flex items-center justify-between text-sm">
              <span>{s.nome}</span>
              <span className="text-neutral-500">
                {s.usados} / {s.total} usados
              </span>
            </div>
          ))}
        </div>
      </div>

      <a
        href={`/barbearia/${slug}/cliente/pagamentos`}
        className="text-sm text-neutral-900 hover:underline"
      >
        Ver histórico de pagamentos →
      </a>
    </div>
  );
}
