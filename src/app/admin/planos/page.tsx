import { prisma } from "@/lib/prisma";
import { criarPlano, inativarPlano, editarPlano } from "./actions";
import { NovoPlanoForm } from "./novo-plano-form";
import { EditarPlanoForm } from "./editar-plano-form";

export default async function AdminPlanosPage() {
  const planos = await prisma.planoSaas.findMany({
    where: { ativo: true },
    include: { _count: { select: { tenants: true } } },
    orderBy: { precoMensal: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Planos SaaS</h1>
        <span className="text-sm text-neutral-500">{planos.length} plano(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {planos.map((p) => (
            <div key={p.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{p.nome}</p>
                  <p className="text-sm text-neutral-500">
                    R$ {Number(p.precoMensal).toFixed(2)}/mês
                  </p>
                </div>
                <span className="text-xs text-neutral-400">
                  {p._count.tenants} barbearia(s)
                </span>
              </div>
              <div className="mt-3 text-xs text-neutral-500 space-y-0.5">
                <p>Barbeiros: {p.maxBarbeiros ?? "ilimitado"}</p>
                <p>Usuários: {p.maxUsuarios ?? "ilimitado"}</p>
                <p>Clientes: {p.maxClientes ?? "ilimitado"}</p>
                <p>Produtos: {p.maxProdutos ?? "ilimitado"}</p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <EditarPlanoForm
                  plano={p}
                  qtdBarbeariasUsando={p._count.tenants}
                  editarPlanoAction={editarPlano.bind(null, p.id)}
                />
                {p._count.tenants === 0 && (
                  <form
                    action={async () => {
                      "use server";
                      await inativarPlano(p.id);
                    }}
                  >
                    <button type="submit" className="text-xs text-red-500 hover:underline">
                      Remover plano
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {planos.length === 0 && (
            <div className="bg-white rounded-lg border p-6 text-center text-neutral-400 col-span-full">
              Nenhum plano cadastrado ainda.
            </div>
          )}
        </div>

        <div>
          <NovoPlanoForm criarPlanoAction={criarPlano} />
        </div>
      </div>
    </div>
  );
}
