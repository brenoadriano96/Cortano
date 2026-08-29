import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { exigirAcessoGestao } from "@/lib/acesso-pagina";
import { criarProduto, atualizarEstoque, inativarProduto, criarCategoriaProduto, atualizarProduto } from "./actions";
import { NovoProdutoForm } from "./novo-produto-form";
import { NovaCategoriaForm } from "./nova-categoria-form";
import { EditorEstoque } from "./editor-estoque";
import { EditarProdutoForm } from "./editar-produto-form";

export default async function LojaPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  await exigirAcessoGestao(slug);
  const tenant = await getTenantBySlug(slug);

  const [produtos, categorias] = await Promise.all([
    prisma.produto.findMany({
      where: { tenantId: tenant.id, ativo: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.categoriaProduto.findMany({
      where: { tenantId: tenant.id, ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const criarProdutoComTenant = criarProduto.bind(null, tenant.id, slug);
  const atualizarEstoqueComTenant = atualizarEstoque.bind(null, tenant.id, slug);
  const inativarProdutoComTenant = inativarProduto.bind(null, tenant.id, slug);
  const criarCategoriaComTenant = criarCategoriaProduto.bind(null, tenant.id, slug);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Loja</h1>
        <span className="text-sm text-neutral-500">{produtos.length} produto(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Produto</th>
                <th className="p-3 font-medium">Categoria</th>
                <th className="p-3 font-medium">Preço</th>
                <th className="p-3 font-medium">Estoque</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.fotoUrl}
                          alt=""
                          className="h-8 w-8 rounded object-cover border"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded border bg-neutral-50" />
                      )}
                      <div>
                        <p className="font-medium">{p.nome}</p>
                        <p className="text-xs text-neutral-400">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-neutral-600">{p.categoria}</td>
                  <td className="p-3 text-neutral-600">
                    R$ {Number(p.preco).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      {p.estoque === 0 && (
                        <span className="text-xs text-red-500">Sem estoque</span>
                      )}
                      <EditorEstoque
                        produtoId={p.id}
                        estoqueAtual={p.estoque}
                        atualizarEstoqueAction={atualizarEstoqueComTenant}
                      />
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <EditarProdutoForm
                        produto={p}
                        categorias={categorias}
                        atualizarProdutoAction={atualizarProduto.bind(null, tenant.id, slug, p.id)}
                      />
                      <form
                        action={async () => {
                          "use server";
                          await inativarProdutoComTenant(p.id);
                        }}
                      >
                        <button type="submit" className="text-xs text-red-500 hover:underline">
                          Remover
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-400">
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <NovoProdutoForm criarProdutoAction={criarProdutoComTenant} categorias={categorias} />
          <NovaCategoriaForm criarCategoriaAction={criarCategoriaComTenant} />
        </div>
      </div>
    </div>
  );
}
