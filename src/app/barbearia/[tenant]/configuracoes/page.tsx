import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { criarCupom, inativarCupom, converterIndicacao, atualizarBranding } from "./actions";
import { NovoCupomForm } from "./novo-cupom-form";
import { BotaoConverterIndicacao } from "./botao-converter-indicacao";
import { BrandingForm } from "./branding-form";

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const [cupons, indicacoes] = await Promise.all([
    prisma.cupom.findMany({
      where: { tenantId: tenant.id, ativo: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.indicacao.findMany({
      where: { tenantId: tenant.id },
      include: { clienteIndicador: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const criarCupomComTenant = criarCupom.bind(null, tenant.id, slug);
  const inativarCupomComTenant = inativarCupom.bind(null, tenant.id, slug);
  const converterIndicacaoComTenant = converterIndicacao.bind(null, tenant.id, slug);
  const atualizarBrandingComTenant = atualizarBranding.bind(null, tenant.id, slug);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Configurações</h1>
        <p className="text-neutral-500">{tenant.nome}</p>
      </div>

      <div>
        <h2 className="font-medium mb-3">Personalização (white-label)</h2>
        <BrandingForm
          atualizarBrandingAction={atualizarBrandingComTenant}
          corAtual={tenant.corPrimaria ?? "#171717"}
          logoAtual={tenant.logoUrl}
        />
      </div>

      <div>
        <h2 className="font-medium mb-3">Cupons de desconto</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="p-3 font-medium">Código</th>
                  <th className="p-3 font-medium">Desconto</th>
                  <th className="p-3 font-medium">Usos</th>
                  <th className="p-3 font-medium">Validade</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cupons.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3 font-mono font-medium">{c.codigo}</td>
                    <td className="p-3 text-neutral-600">
                      {c.tipo === "PERCENTUAL"
                        ? `${Number(c.valor)}%`
                        : `R$ ${Number(c.valor).toFixed(2)}`}
                    </td>
                    <td className="p-3 text-neutral-600">
                      {c.usosRealizados}
                      {c.usoMaximo ? ` / ${c.usoMaximo}` : ""}
                    </td>
                    <td className="p-3 text-neutral-600">
                      {c.validoAte ? c.validoAte.toLocaleDateString("pt-BR") : "Sem validade"}
                    </td>
                    <td className="p-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await inativarCupomComTenant(c.id);
                        }}
                      >
                        <button type="submit" className="text-xs text-red-500 hover:underline">
                          Remover
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {cupons.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-neutral-400">
                      Nenhum cupom criado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <NovoCupomForm criarCupomAction={criarCupomComTenant} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-medium mb-3">Indicações de clientes</h2>
        <div className="bg-white rounded-lg border divide-y">
          {indicacoes.map((i) => (
            <div key={i.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {i.nomeIndicado} · {i.telefoneIndicado}
                </p>
                <p className="text-xs text-neutral-500">
                  Indicado por {i.clienteIndicador.nome}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {i.status === "PENDENTE" ? (
                  <BotaoConverterIndicacao
                    indicacaoId={i.id}
                    converterAction={converterIndicacaoComTenant}
                  />
                ) : (
                  <span className="text-xs text-green-600">
                    Convertido · R$ {Number(i.recompensaValor).toFixed(2)} de cashback
                  </span>
                )}
              </div>
            </div>
          ))}
          {indicacoes.length === 0 && (
            <p className="p-6 text-center text-neutral-400 text-sm">
              Nenhuma indicação registrada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
