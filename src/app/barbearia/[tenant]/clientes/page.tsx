import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { criarCliente, inativarCliente } from "./actions";
import { NovoClienteForm } from "./novo-cliente-form";

export default async function ClientesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const clientes = await prisma.cliente.findMany({
    where: { tenantId: tenant.id, ativo: true },
    orderBy: { createdAt: "desc" },
  });

  const criarClienteComTenant = criarCliente.bind(null, tenant.id, slug);
  const inativarClienteComTenant = inativarCliente.bind(null, tenant.id, slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <span className="text-sm text-neutral-500">{clientes.length} cliente(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Telefone</th>
                <th className="p-3 font-medium">E-mail</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3 text-neutral-600">{c.telefone ?? "—"}</td>
                  <td className="p-3 text-neutral-600">{c.email ?? "—"}</td>
                  <td className="p-3 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await inativarClienteComTenant(c.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remover
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-neutral-400">
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <NovoClienteForm criarClienteAction={criarClienteComTenant} />
        </div>
      </div>
    </div>
  );
}
