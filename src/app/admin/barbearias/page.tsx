import { prisma } from "@/lib/prisma";
import { criarBarbearia, alterarStatusBarbearia, alterarPlanoBarbearia } from "./actions";
import { NovaBarbeariaForm } from "./nova-barbearia-form";
import { AcoesStatusBarbearia } from "./acoes-status";
import { SeletorPlano } from "./seletor-plano";

const STATUS_LABEL: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Ativa",
  PAYMENT_PENDING: "Pagamento pendente",
  SUSPENDED: "Suspensa",
  CANCELLED: "Cancelada",
};

const STATUS_COR: Record<string, string> = {
  TRIAL: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  PAYMENT_PENDING: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-700",
  CANCELLED: "bg-neutral-200 text-neutral-500",
};

export default async function AdminBarbeariasPage() {
  const [tenants, planos] = await Promise.all([
    prisma.tenant.findMany({
      include: { plano: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.planoSaas.findMany({ where: { ativo: true } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Barbearias</h1>
        <span className="text-sm text-neutral-500">{tenants.length} barbearia(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Barbearia</th>
                <th className="p-3 font-medium">Plano</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{t.nome}</p>
                    <p className="text-xs text-neutral-400">/{t.slug}</p>
                  </td>
                  <td className="p-3 text-neutral-600">
                    <SeletorPlano
                      tenantId={t.id}
                      planoAtualId={t.planoId}
                      planos={planos.map((p) => ({ id: p.id, nome: p.nome }))}
                      alterarPlanoAction={alterarPlanoBarbearia}
                    />
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_COR[t.status]}`}
                    >
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <AcoesStatusBarbearia
                      tenantId={t.id}
                      status={t.status}
                      alterarStatusAction={alterarStatusBarbearia}
                    />
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-neutral-400">
                    Nenhuma barbearia cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <NovaBarbeariaForm
            criarBarbeariaAction={criarBarbearia}
            planos={planos.map((p) => ({
              id: p.id,
              nome: p.nome,
              precoMensal: Number(p.precoMensal),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
