import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { exigirAcessoGestao } from "@/lib/acesso-pagina";
import { calcularComissoesPorBarbeiro } from "@/lib/comissoes";

function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inicioProximoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

export default async function FinanceiroPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  await exigirAcessoGestao(slug);
  const tenant = await getTenantBySlug(slug);

  const inicio = inicioDoMes();
  const fim = inicioProximoMes();

  const [servicosAtendidos, pedidosPagos, comissoes] = await Promise.all([
    prisma.agendamento.aggregate({
      where: { tenantId: tenant.id, status: "ATENDIDO", dataHoraInicio: { gte: inicio, lt: fim } },
      _sum: { valorTotal: true },
    }),
    prisma.pedido.aggregate({
      where: {
        tenantId: tenant.id,
        status: { in: ["PAGO", "PREPARANDO", "PRONTO_RETIRADA", "ENTREGUE"] },
        createdAt: { gte: inicio, lt: fim },
      },
      _sum: { valorTotal: true },
    }),
    calcularComissoesPorBarbeiro(tenant.id, inicio, fim),
  ]);

  const receitaServicos = Number(servicosAtendidos._sum.valorTotal ?? 0);
  const receitaProdutos = Number(pedidosPagos._sum.valorTotal ?? 0);
  const receitaTotal = receitaServicos + receitaProdutos;
  const totalComissoes = comissoes.reduce((acc, c) => acc + c.comissao, 0);
  const lucroLiquido = receitaTotal - totalComissoes;

  const cards = [
    { label: "Receita de serviços", valor: receitaServicos },
    { label: "Receita de produtos", valor: receitaProdutos },
    { label: "Receita total", valor: receitaTotal, destaque: true },
    { label: "Comissões a pagar", valor: totalComissoes },
    { label: "Lucro líquido (após comissões)", valor: lucroLiquido },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Financeiro</h1>
      <p className="text-neutral-500 mb-6">Mês atual</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-white rounded-lg border p-4 ${c.destaque ? "border-neutral-900" : ""}`}
          >
            <p className="text-sm text-neutral-500">{c.label}</p>
            <p className="text-xl font-bold mt-1">R$ {c.valor.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border">
        <div className="border-b px-4 py-3 font-medium text-sm">Comissões por barbeiro</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="p-3 font-medium">Barbeiro</th>
              <th className="p-3 font-medium">Atendimentos</th>
              <th className="p-3 font-medium">Faturado</th>
              <th className="p-3 font-medium">Comissão a pagar</th>
            </tr>
          </thead>
          <tbody>
            {comissoes.map((c) => (
              <tr key={c.barbeiroId} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.nome}</td>
                <td className="p-3 text-neutral-600">{c.atendimentos}</td>
                <td className="p-3 text-neutral-600">R$ {c.faturamento.toFixed(2)}</td>
                <td className="p-3 font-medium">R$ {c.comissao.toFixed(2)}</td>
              </tr>
            ))}
            {comissoes.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-400">
                  Sem atendimentos concluídos neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
