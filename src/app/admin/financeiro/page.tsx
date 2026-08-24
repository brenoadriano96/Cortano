import { prisma } from "@/lib/prisma";

export default async function AdminFinanceiroPage() {
  const [assinaturasAtivas, pagamentosPagos, tenantsPorStatus] = await Promise.all([
    prisma.assinaturaSaas.findMany({
      where: { status: "ACTIVE" },
      select: { valor: true },
    }),
    prisma.pagamentoSaas.findMany({
      where: { status: "PAGA" },
      select: { valor: true, dataPagamento: true },
      orderBy: { dataPagamento: "desc" },
      take: 10,
    }),
    prisma.tenant.groupBy({ by: ["status"], _count: true }),
  ]);

  const mrr = assinaturasAtivas.reduce((acc, a) => acc + Number(a.valor), 0);
  const totalRecebidoHistorico = await prisma.pagamentoSaas.aggregate({
    where: { status: "PAGA" },
    _sum: { valor: true },
  });
  const arr = mrr * 12;

  const cards = [
    { label: "MRR (receita recorrente mensal)", valor: `R$ ${mrr.toFixed(2)}` },
    { label: "ARR (projeção anual)", valor: `R$ ${arr.toFixed(2)}` },
    {
      label: "Total já recebido (histórico)",
      valor: `R$ ${Number(totalRecebidoHistorico._sum.valor ?? 0).toFixed(2)}`,
    },
    { label: "Barbearias com assinatura ativa", valor: assinaturasAtivas.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Financeiro</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg border p-4">
            <p className="text-sm text-neutral-500">{c.label}</p>
            <p className="text-xl font-bold mt-1">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-medium mb-3">Barbearias por status</p>
          <div className="space-y-2">
            {tenantsPorStatus.map((g) => (
              <div key={g.status} className="flex justify-between text-sm">
                <span className="text-neutral-500">{g.status}</span>
                <span className="font-medium">{g._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-medium mb-3">Últimos pagamentos recebidos</p>
          <div className="space-y-2">
            {pagamentosPagos.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-neutral-500">
                  {p.dataPagamento?.toLocaleDateString("pt-BR") ?? "—"}
                </span>
                <span>R$ {Number(p.valor).toFixed(2)}</span>
              </div>
            ))}
            {pagamentosPagos.length === 0 && (
              <p className="text-sm text-neutral-400">Nenhum pagamento registrado ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
