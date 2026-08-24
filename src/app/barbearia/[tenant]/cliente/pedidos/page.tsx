import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";

const STATUS_LABEL: Record<string, string> = {
  NOVO: "Novo",
  PAGO: "Pago",
  PREPARANDO: "Preparando",
  PRONTO_RETIRADA: "Pronto p/ retirada",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export default async function ClientePedidosPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const pedidos = await prisma.pedido.findMany({
    where: { tenantId: tenant.id, clienteId: cliente.id },
    include: { itens: { include: { produto: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Meus pedidos</h1>

      <div className="bg-white rounded-lg border divide-y max-w-2xl">
        {pedidos.map((p) => (
          <div key={p.id} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">
                {p.createdAt.toLocaleDateString("pt-BR")}
              </p>
              <span className="text-xs text-neutral-500">{STATUS_LABEL[p.status]}</span>
            </div>
            <p className="text-xs text-neutral-500">
              {p.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", ")}
            </p>
            <p className="text-sm font-medium mt-1">
              Total: R$ {Number(p.valorTotal).toFixed(2)}
            </p>
          </div>
        ))}
        {pedidos.length === 0 && (
          <p className="p-6 text-center text-neutral-400 text-sm">
            Você ainda não fez nenhum pedido.
          </p>
        )}
      </div>
    </div>
  );
}
