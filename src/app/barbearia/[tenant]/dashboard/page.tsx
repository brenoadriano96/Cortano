import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/auth";
import { temAcessoGestao } from "@/lib/rbac";
import { getBarbeiroVinculado } from "@/lib/acesso-pagina";
import { BarbeiroDashboard } from "./barbeiro-dashboard";

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
  const session = await auth();

  // Seção 4.4: o Barbeiro tem um dashboard totalmente dedicado — valor a
  // receber (comissão) em vez de faturamento bruto, e a própria agenda do
  // dia/semana já na tela inicial.
  if (session?.user.papel === "BARBEIRO") {
    const barbeiro = await getBarbeiroVinculado(tenant.id, session.user.id);
    if (barbeiro) {
      return (
        <BarbeiroDashboard
          tenantId={tenant.id}
          slug={slug}
          barbeiroId={barbeiro.id}
          barbeiroNome={barbeiro.nome}
        />
      );
    }
  }

  // Seção 4.5: Atendente não deve ver dados financeiros (faturamento,
  // assinaturas) — só o operacional (agenda, clientes, cancelamentos)
  const podeVerFinanceiro = session ? temAcessoGestao(session.user.papel) : false;

  const [agendamentosHoje, faturamentoMes, clientesNovosMes, cancelamentosHoje, assinaturasAtivas] =
    await Promise.all([
      prisma.agendamento.count({
        where: { tenantId: tenant.id, dataHoraInicio: { gte: inicioDoDia() } },
      }),
      podeVerFinanceiro
        ? prisma.agendamento.aggregate({
            where: {
              tenantId: tenant.id,
              status: "ATENDIDO",
              dataHoraInicio: { gte: inicioDoMes() },
            },
            _sum: { valorTotal: true },
          })
        : Promise.resolve(null),
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
      podeVerFinanceiro
        ? prisma.assinaturaCliente.count({
            where: { tenantId: tenant.id, status: "ATIVA" },
          })
        : Promise.resolve(null),
    ]);

  const cards = [
    { label: "Agendamentos hoje", valor: agendamentosHoje },
    ...(podeVerFinanceiro
      ? [
          {
            label: "Faturamento do mês",
            valor: `R$ ${Number(faturamentoMes?._sum.valorTotal ?? 0).toFixed(2)}`,
          },
        ]
      : []),
    { label: "Clientes novos (mês)", valor: clientesNovosMes },
    { label: "Cancelamentos hoje", valor: cancelamentosHoje },
    ...(podeVerFinanceiro
      ? [{ label: "Assinaturas ativas", valor: assinaturasAtivas ?? 0 }]
      : []),
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
