import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/auth";
import { temAcessoGestao } from "@/lib/rbac";
import { criarServico, inativarServico } from "./actions";
import { NovoServicoForm } from "./novo-servico-form";

export default async function ServicosPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const session = await auth();
  const podeGerenciar = session ? temAcessoGestao(session.user.papel) : false;

  const servicos = await prisma.servico.findMany({
    where: { tenantId: tenant.id, ativo: true },
    orderBy: { createdAt: "desc" },
  });

  const criarServicoComTenant = criarServico.bind(null, tenant.id, slug);
  const inativarServicoComTenant = inativarServico.bind(null, tenant.id, slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Serviços</h1>
        <span className="text-sm text-neutral-500">{servicos.length} serviço(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={podeGerenciar ? "lg:col-span-2 bg-white rounded-lg border" : "lg:col-span-3 bg-white rounded-lg border"}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Preço</th>
                <th className="p-3 font-medium">Duração</th>
                {podeGerenciar && <th className="p-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {servicos.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-2">
                      {s.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.fotoUrl}
                          alt=""
                          className="h-8 w-8 rounded object-cover border"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded border bg-neutral-50" />
                      )}
                      {s.nome}
                    </div>
                  </td>
                  <td className="p-3 text-neutral-600">
                    R$ {Number(s.preco).toFixed(2)}
                  </td>
                  <td className="p-3 text-neutral-600">{s.duracaoMin} min</td>
                  {podeGerenciar && (
                    <td className="p-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await inativarServicoComTenant(s.id);
                        }}
                      >
                        <button type="submit" className="text-xs text-red-500 hover:underline">
                          Remover
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
              {servicos.length === 0 && (
                <tr>
                  <td colSpan={podeGerenciar ? 4 : 3} className="p-6 text-center text-neutral-400">
                    Nenhum serviço cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {podeGerenciar && (
          <div>
            <NovoServicoForm criarServicoAction={criarServicoComTenant} />
          </div>
        )}
      </div>
    </div>
  );
}
