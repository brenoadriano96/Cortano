import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { avancarStatusPedido, cancelarPedido } from "./actions";
import { AcoesPedido } from "./acoes-pedido";

const STATUS_LABEL: Record<string, string> = {
  NOVO: "Novo",
  PAGO: "Pago",
  PREPARANDO: "Preparando",
  PRONTO_RETIRADA: "Pronto p/ retirada",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

const STATUS_COR: Record<string, string> = {
  NOVO: "bg-blue-100 text-blue-700",
  PAGO: "bg-amber-100 text-amber-700",
  PREPARANDO: "bg-amber-100 text-amber-700",
  PRONTO_RETIRADA: "bg-purple-100 text-purple-700",
  ENTREGUE: "bg-green-100 text-green-700",
  CANCELADO: "bg-neutral-200 text-neutral-500 line-through",
};

export default async function PedidosPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);

  const pedidos = await prisma.pedido.findMany({
    where: { tenantId: tenant.id },
    include: { cliente: true, itens: { include: { produto: true } } },
    orderBy: { createdAt: "desc" },
  });

  const avancarComTenant = avancarStatusPedido.bind(null, tenant.id, slug);
  const cancelarComTenant = cancelarPedido.bind(null, tenant.id, slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <span className="text-sm text-neutral-500">{pedidos.length} pedido(s)</span>
      </div>

      <div className="bg-white rounded-lg border divide-y">
        {pedidos.map((p) => (
          <div key={p.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {p.cliente.nome} · R$ {Number(p.valorTotal).toFixed(2)}
              </p>
              <p className="text-xs text-neutral-500">
                {p.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", ")}
              </p>
              <p className="text-xs text-neutral-400">
                {p.createdAt.toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COR[p.status]}`}>
                {STATUS_LABEL[p.status]}
              </span>
              <AcoesPedido
                pedidoId={p.id}
                podeAvancar={p.status !== "ENTREGUE" && p.status !== "CANCELADO"}
                podeCancelar={p.status !== "ENTREGUE" && p.status !== "CANCELADO"}
                avancarAction={avancarComTenant}
                cancelarAction={cancelarComTenant}
              />
            </div>
          </div>
        ))}
        {pedidos.length === 0 && (
          <p className="p-6 text-center text-neutral-400 text-sm">Nenhum pedido ainda.</p>
        )}
      </div>
    </div>
  );
}
