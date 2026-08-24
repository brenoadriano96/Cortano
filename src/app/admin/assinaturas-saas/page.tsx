import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Ativa",
  PAYMENT_PENDING: "Pagamento pendente",
  SUSPENDED: "Suspensa",
  CANCELLED: "Cancelada",
};

export default async function AdminAssinaturasSaasPage() {
  const assinaturas = await prisma.assinaturaSaas.findMany({
    include: { tenant: true, plano: true },
    orderBy: { createdAt: "desc" },
  });

  const mrr = assinaturas
    .filter((a) => a.status === "ACTIVE")
    .reduce((acc, a) => acc + Number(a.valor), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Assinaturas SaaS</h1>
        <span className="text-sm text-neutral-500">
          MRR: R$ {mrr.toFixed(2)}
        </span>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="p-3 font-medium">Barbearia</th>
              <th className="p-3 font-medium">Plano</th>
              <th className="p-3 font-medium">Valor</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Próxima cobrança</th>
            </tr>
          </thead>
          <tbody>
            {assinaturas.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{a.tenant.nome}</td>
                <td className="p-3 text-neutral-600">{a.plano.nome}</td>
                <td className="p-3 text-neutral-600">R$ {Number(a.valor).toFixed(2)}</td>
                <td className="p-3 text-neutral-600">{STATUS_LABEL[a.status]}</td>
                <td className="p-3 text-neutral-600">
                  {a.proximaCobranca?.toLocaleDateString("pt-BR") ?? "—"}
                </td>
              </tr>
            ))}
            {assinaturas.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-400">
                  Nenhuma assinatura ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
