import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";

export default async function ClientePagamentosPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const [assinatura, pedidos] = await Promise.all([
    prisma.assinaturaCliente.findFirst({
      where: { tenantId: tenant.id, clienteId: cliente.id },
      include: { plano: true, cobrancas: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.pedido.findMany({
      where: { tenantId: tenant.id, clienteId: cliente.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Pagamentos</h1>

      {assinatura && assinatura.cobrancas.length > 0 && (
        <div className="bg-white rounded-lg border mb-6">
          <div className="border-b px-4 py-3 font-medium text-sm">
            Assinatura — {assinatura.plano.nome}
          </div>
          <div className="divide-y">
            {assinatura.cobrancas.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {c.dataVencimento.toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {c.dataPagamento
                      ? `Pago em ${c.dataPagamento.toLocaleDateString("pt-BR")}`
                      : "Pendente"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">R$ {Number(c.valor).toFixed(2)}</p>
                  <p className="text-xs text-neutral-400">{c.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        <div className="border-b px-4 py-3 font-medium text-sm">Compras na loja</div>
        <div className="divide-y">
          {pedidos.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{p.createdAt.toLocaleDateString("pt-BR")}</p>
                <p className="text-xs text-neutral-400">{p.status}</p>
              </div>
              <p className="text-sm font-medium">R$ {Number(p.valorTotal).toFixed(2)}</p>
            </div>
          ))}
          {pedidos.length === 0 && (
            <p className="p-6 text-center text-neutral-400 text-sm">
              Nenhuma compra ainda.
            </p>
          )}
        </div>
      </div>

      {!assinatura && pedidos.length === 0 && (
        <p className="text-center text-neutral-400 text-sm mt-6">
          Nenhum pagamento registrado ainda.
        </p>
      )}
    </div>
  );
}
