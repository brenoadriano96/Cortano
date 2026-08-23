import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { criarBarbeiro, inativarBarbeiro } from "./actions";
import { NovoBarbeiroForm } from "./novo-barbeiro-form";

export default async function BarbeirosPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const [barbeiros, servicos] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { tenantId: tenant.id, ativo: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.servico.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true },
    }),
  ]);

  const criarBarbeiroComTenant = criarBarbeiro.bind(null, tenant.id, slug);
  const inativarBarbeiroComTenant = inativarBarbeiro.bind(null, tenant.id, slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Barbeiros</h1>
        <span className="text-sm text-neutral-500">{barbeiros.length} barbeiro(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Especialidades</th>
                <th className="p-3 font-medium">Comissão</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {barbeiros.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{b.nome}</td>
                  <td className="p-3 text-neutral-600">
                    {b.especialidades.length > 0 ? b.especialidades.join(", ") : "—"}
                  </td>
                  <td className="p-3 text-neutral-600">
                    {Number(b.comissaoPadrao).toFixed(0)}%
                  </td>
                  <td className="p-3 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await inativarBarbeiroComTenant(b.id);
                      }}
                    >
                      <button type="submit" className="text-xs text-red-500 hover:underline">
                        Remover
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {barbeiros.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-neutral-400">
                    Nenhum barbeiro cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <NovoBarbeiroForm
            criarBarbeiroAction={criarBarbeiroComTenant}
            servicosDisponiveis={servicos}
          />
        </div>
      </div>
    </div>
  );
}
