import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { exigirAcessoGestao } from "@/lib/acesso-pagina";
import { criarBarbeiro, inativarBarbeiro, atualizarComissaoServico } from "./actions";
import { NovoBarbeiroForm } from "./novo-barbeiro-form";
import { EditorComissao } from "./editor-comissao";

export default async function BarbeirosPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  await exigirAcessoGestao(slug);
  const tenant = await getTenantBySlug(slug);

  const [barbeiros, servicos, unidades] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { tenantId: tenant.id, ativo: true },
      include: { unidade: true, servicos: { include: { servico: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.servico.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true },
    }),
    prisma.unidade.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true },
    }),
  ]);

  const criarBarbeiroComTenant = criarBarbeiro.bind(null, tenant.id, slug);
  const inativarBarbeiroComTenant = inativarBarbeiro.bind(null, tenant.id, slug);
  const atualizarComissaoComTenant = atualizarComissaoServico.bind(null, tenant.id, slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Barbeiros</h1>
        <span className="text-sm text-neutral-500">{barbeiros.length} barbeiro(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {barbeiros.map((b) => (
            <div key={b.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {b.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.fotoUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full border bg-neutral-50" />
                  )}
                  <div>
                    <p className="font-medium">{b.nome}</p>
                    <p className="text-xs text-neutral-400">
                      {b.unidade?.nome ?? "Sem unidade específica"} · Comissão padrão:{" "}
                      {Number(b.comissaoPadrao).toFixed(0)}%
                    </p>
                  </div>
                </div>
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
              </div>

              {b.servicos.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-1.5">
                  <p className="text-xs text-neutral-500 mb-1">Comissão por serviço:</p>
                  {b.servicos.map((sb) => (
                    <EditorComissao
                      key={sb.id}
                      barbeiroId={b.id}
                      servicoId={sb.servicoId}
                      servicoNome={sb.servico.nome}
                      comissaoAtual={sb.comissao ? Number(sb.comissao) : null}
                      atualizarComissaoAction={atualizarComissaoComTenant}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {barbeiros.length === 0 && (
            <div className="bg-white rounded-lg border p-6 text-center text-neutral-400">
              Nenhum barbeiro cadastrado ainda.
            </div>
          )}
        </div>

        <div>
          <NovoBarbeiroForm
            criarBarbeiroAction={criarBarbeiroComTenant}
            servicosDisponiveis={servicos}
            unidadesDisponiveis={unidades}
          />
        </div>
      </div>
    </div>
  );
}
