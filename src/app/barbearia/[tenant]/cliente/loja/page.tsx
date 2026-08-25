import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";
import { finalizarPedido } from "./actions";
import { CatalogoComCarrinho } from "./catalogo-com-carrinho";

export default async function ClienteLojaPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const produtos = await prisma.produto.findMany({
    where: { tenantId: tenant.id, ativo: true },
    orderBy: { categoria: "asc" },
  });

  const finalizarPedidoComContexto = finalizarPedido.bind(null, tenant.id, slug, cliente.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Loja</h1>
      <CatalogoComCarrinho
        produtos={produtos.map((p) => ({
          id: p.id,
          nome: p.nome,
          categoria: p.categoria,
          preco: Number(p.preco),
          estoque: p.estoque,
        }))}
        finalizarPedidoAction={finalizarPedidoComContexto}
        saldoCashback={Number(cliente.saldoCashback)}
      />
    </div>
  );
}
