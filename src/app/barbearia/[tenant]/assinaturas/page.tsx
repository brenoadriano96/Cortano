import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { exigirAcessoGestao } from "@/lib/acesso-pagina";
import { criarPlanoCliente, inativarPlanoCliente } from "./actions";
import { NovoPlanoClienteForm } from "./novo-plano-cliente-form";

const STATUS_LABEL: Record<string, string> = {
  ATIVA: "Ativa",
  PAUSADA: "Pausada",
  CANCELADA: "Cancelada",
  INADIMPLENTE: "Inadimplente",
};

const STATUS_COR: Record<string, string> = {
  ATIVA: "bg-green-100 text-green-700",
  PAUSADA: "bg-neutral-200 text-neutral-500",
  CANCELADA: "bg-neutral-200 text-neutral-400 line-through",
  INADIMPLENTE: "bg-red-100 text-red-700",
};

export default async function AssinaturasPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  await exigirAcessoGestao(slug);
  const tenant = await getTenantBySlug(slug);

  const [assinaturas, planos, servicos] = await Promise.all([
    prisma.assinaturaCliente.findMany({
      where: { tenantId: tenant.id },
      include: { cliente: true, plano: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.planoCliente.findMany({
      where: { tenantId: tenant.id, ativo: true },
    }),
    prisma.servico.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true },
    }),
  ]);

  const criarPlanoClienteComTenant = criarPlanoCliente.bind(null, tenant.id, slug);
  const inativarPlanoClienteComTenant = inativarPlanoCliente.bind(null, tenant.id, slug);

  const receitaRecorrente = assinaturas
    .filter((a) => a.status === "ATIVA")
    .reduce((acc, a) => acc + Number(a.plano.precoMensal), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Assinaturas</h1>
        <span className="text-sm text-neutral-500">
          Receita recorrente: R$ {receitaRecorrente.toFixed(2)}/mês
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {planos.map((p) => {
            const ativos = assinaturas.filter(
              (a) => a.planoId === p.id && a.status === "ATIVA"
            ).length;
            return (
              <div key={p.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{p.nome}</p>
                    <p className="text-sm text-neutral-500">
                      R$ {Number(p.precoMensal).toFixed(2)}/mês
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {ativos} assinante(s) ativo(s)
                    </p>
                  </div>
                  {ativos === 0 && (
                    <form
                      action={async () => {
                        "use server";
                        await inativarPlanoClienteComTenant(p.id);
                      }}
                    >
                      <button type="submit" className="text-xs text-red-500 hover:underline">
                        Remover
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
          {planos.length === 0 && (
            <div className="bg-white rounded-lg border p-6 text-center text-neutral-400 col-span-full">
              Nenhum plano de cliente cadastrado ainda.
            </div>
          )}
        </div>
        <div>
          <NovoPlanoClienteForm
            criarPlanoClienteAction={criarPlanoClienteComTenant}
            servicosDisponiveis={servicos}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">Plano</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Próxima cobrança</th>
            </tr>
          </thead>
          <tbody>
            {assinaturas.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{a.cliente.nome}</td>
                <td className="p-3 text-neutral-600">{a.plano.nome}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COR[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="p-3 text-neutral-600">
                  {a.proximaCobranca.toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {assinaturas.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-400">
                  Nenhuma assinatura de cliente ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
