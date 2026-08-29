import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/auth";
import { getBarbeiroVinculado } from "@/lib/acesso-pagina";
import { criarCliente, inativarCliente, atualizarCliente } from "./actions";
import { NovoClienteForm } from "./novo-cliente-form";
import { EditarClienteForm } from "./editar-cliente-form";

export default async function ClientesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  // Seção 4.4: Barbeiro só vê clientes relacionados aos seus próprios
  // atendimentos, e não cadastra novos clientes (isso é do Atendente/Proprietário)
  const session = await auth();
  const barbeiroLogado =
    session?.user.papel === "BARBEIRO"
      ? await getBarbeiroVinculado(tenant.id, session.user.id)
      : null;

  const clientes = await prisma.cliente.findMany({
    where: {
      tenantId: tenant.id,
      ativo: true,
      ...(barbeiroLogado
        ? { agendamentos: { some: { barbeiroId: barbeiroLogado.id } } }
        : {}),
    },
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
        <div className={barbeiroLogado ? "lg:col-span-3 bg-white rounded-lg border" : "lg:col-span-2 bg-white rounded-lg border"}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Telefone</th>
                <th className="p-3 font-medium">E-mail</th>
                {!barbeiroLogado && <th className="p-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">
                    <a
                      href={`/barbearia/${slug}/clientes/${c.id}`}
                      className="hover:underline"
                    >
                      {c.nome}
                    </a>
                  </td>
                  <td className="p-3 text-neutral-600">{c.telefone ?? "—"}</td>
                  <td className="p-3 text-neutral-600">{c.email ?? "—"}</td>
                  {!barbeiroLogado && (
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <EditarClienteForm
                          cliente={c}
                          atualizarClienteAction={atualizarCliente.bind(null, tenant.id, slug, c.id)}
                        />
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
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={barbeiroLogado ? 3 : 4} className="p-6 text-center text-neutral-400">
                    {barbeiroLogado
                      ? "Você ainda não atendeu nenhum cliente."
                      : "Nenhum cliente cadastrado ainda."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!barbeiroLogado && (
          <div>
            <NovoClienteForm criarClienteAction={criarClienteComTenant} />
          </div>
        )}
      </div>
    </div>
  );
}
