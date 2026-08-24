import { prisma } from "@/lib/prisma";

function daquiA7Dias() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

export default async function AdminHomePage() {
  const [
    total,
    ativas,
    trial,
    suspensas,
    canceladas,
    assinaturasAtivas,
    trialsExpirandoLogo,
    prospectosAbertos,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "TRIAL" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
    prisma.tenant.count({ where: { status: "CANCELLED" } }),
    prisma.assinaturaSaas.findMany({ where: { status: "ACTIVE" }, select: { valor: true } }),
    prisma.tenant.count({
      where: { status: "TRIAL", dataVencimento: { lte: daquiA7Dias() } },
    }),
    prisma.prospectoBarbearia.count({
      where: { status: { notIn: ["GANHO", "PERDIDO"] } },
    }),
  ]);

  const mrr = assinaturasAtivas.reduce((acc, a) => acc + Number(a.valor), 0);

  const cards = [
    { label: "Total de barbearias", valor: total },
    { label: "Ativas", valor: ativas },
    { label: "Em trial", valor: trial },
    { label: "Suspensas", valor: suspensas },
    { label: "Canceladas", valor: canceladas },
    { label: "MRR", valor: `R$ ${mrr.toFixed(2)}`, destaque: true },
    { label: "Trials vencendo em 7 dias", valor: trialsExpirandoLogo, alerta: trialsExpirandoLogo > 0 },
    { label: "Prospectos em aberto", valor: prospectosAbertos },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Visão geral</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-white rounded-lg border p-4 ${
              c.destaque ? "border-neutral-900" : ""
            }`}
          >
            <p className="text-sm text-neutral-500">{c.label}</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                c.alerta ? "text-amber-600" : ""
              }`}
            >
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-500">
        <a href="/admin/barbearias" className="bg-white rounded-lg border p-4 hover:border-neutral-400">
          Gerenciar barbearias →
        </a>
        <a href="/admin/prospeccao" className="bg-white rounded-lg border p-4 hover:border-neutral-400">
          Ver prospecção de clientes →
        </a>
      </div>
    </div>
  );
}
