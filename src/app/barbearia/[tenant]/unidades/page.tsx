import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { criarUnidade, inativarUnidade } from "./actions";
import { NovaUnidadeForm } from "./nova-unidade-form";

export default async function UnidadesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const unidades = await prisma.unidade.findMany({
    where: { tenantId: tenant.id, ativo: true },
    include: { _count: { select: { barbeiros: true } } },
    orderBy: { createdAt: "asc" },
  });

  const criarUnidadeComTenant = criarUnidade.bind(null, tenant.id, slug);
  const inativarUnidadeComTenant = inativarUnidade.bind(null, tenant.id, slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Unidades</h1>
        <span className="text-sm text-neutral-500">{unidades.length} unidade(s)</span>
      </div>

      {unidades.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-4 mb-6">
          Se sua barbearia tem apenas uma localização, você não precisa cadastrar
          unidades — tudo continua funcionando normalmente. Use isto apenas se
          você tiver mais de um endereço.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Unidade</th>
                <th className="p-3 font-medium">Endereço</th>
                <th className="p-3 font-medium">Barbeiros</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{u.nome}</p>
                    <p className="text-xs text-neutral-400">{u.telefone}</p>
                  </td>
                  <td className="p-3 text-neutral-600">{u.endereco ?? "—"}</td>
                  <td className="p-3 text-neutral-600">{u._count.barbeiros}</td>
                  <td className="p-3 text-right">
                    {u._count.barbeiros === 0 && (
                      <form
                        action={async () => {
                          "use server";
                          await inativarUnidadeComTenant(u.id);
                        }}
                      >
                        <button type="submit" className="text-xs text-red-500 hover:underline">
                          Remover
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {unidades.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-neutral-400">
                    Nenhuma unidade cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <NovaUnidadeForm criarUnidadeAction={criarUnidadeComTenant} />
        </div>
      </div>
    </div>
  );
}
