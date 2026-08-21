import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";

function inicioDoDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inicioDoMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const [
    agendamentosHoje,
    faturamentoMes,
    clientesNovosMes,
    cancelamentosHoje,
    assinaturasAtivas,
  ] = await Promise.all([
    prisma.agendamento.count({
      where: { tenantId: tenant.id, dataHoraInicio: { gte: inicioDoDia() } },
    }),
    prisma.agendamento.aggregate({
      where: {
        tenantId: tenant.id,
        status: "ATENDIDO",
        dataHoraInicio: { gte: inicioDoMes() },
      },
      _sum: { valorTotal: true },
    }),
    prisma.cliente.count({
      where: { tenantId: tenant.id, createdAt: { gte: inicioDoMes() } },
    }),
    prisma.agendamento.count({
      where: {
        tenantId: tenant.id,
        status: "CANCELADO",
        dataHoraInicio: { gte: inicioDoDia() },
      },
    }),
    prisma.assinaturaCliente.count({
      where: { tenantId: tenant.id, status: "ATIVA" },
    }),
  ]);

  const cards = [
    { label: "Agendamentos hoje", valor: agendamentosHoje },
    {
      label: "Faturamento do mês",
      valor: `R$ ${(faturamentoMes._sum.valorTotal ?? 0).toString()}`,
    },
    { label: "Clientes novos (mês)", valor: clientesNovosMes },
    { label: "Cancelamentos hoje", valor: cancelamentosHoje },
    { label: "Assinaturas ativas", valor: assinaturasAtivas },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg border p-4">
            <p className="text-sm text-neutral-500">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
