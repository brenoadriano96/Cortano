import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [total, ativas, trial, suspensas] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "TRIAL" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
  ]);

  const cards = [
    { label: "Total de barbearias", valor: total },
    { label: "Ativas", valor: ativas },
    { label: "Em trial", valor: trial },
    { label: "Suspensas", valor: suspensas },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Visão geral</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
