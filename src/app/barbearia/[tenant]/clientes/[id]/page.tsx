import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/auth";
import { getBarbeiroVinculado } from "@/lib/acesso-pagina";
import { notFound } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  CANCELADO: "Cancelado",
  FALTOU: "Faltou",
};

export default async function DetalheClientePage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: slug, id } = await params;
  const tenant = await getTenantBySlug(slug);

  // Seção 4.4: Barbeiro só pode ver detalhe de cliente que já atendeu
  const session = await auth();
  const barbeiroLogado =
    session?.user.papel === "BARBEIRO"
      ? await getBarbeiroVinculado(tenant.id, session.user.id)
      : null;

  const cliente = await prisma.cliente.findFirst({
    where: {
      id,
      tenantId: tenant.id,
      ...(barbeiroLogado
        ? { agendamentos: { some: { barbeiroId: barbeiroLogado.id } } }
        : {}),
    },
  });

  if (!cliente) {
    notFound();
  }

  const [agendamentos, pedidos, assinatura, avaliacoes] = await Promise.all([
    prisma.agendamento.findMany({
      where: {
        tenantId: tenant.id,
        clienteId: id,
        ...(barbeiroLogado ? { barbeiroId: barbeiroLogado.id } : {}),
      },
      include: { barbeiro: true, servicos: { include: { servico: true } } },
      orderBy: { dataHoraInicio: "desc" },
      take: 20,
    }),
    barbeiroLogado
      ? Promise.resolve([])
      : prisma.pedido.findMany({
          where: { tenantId: tenant.id, clienteId: id },
          include: { itens: { include: { produto: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
    barbeiroLogado
      ? Promise.resolve(null)
      : prisma.assinaturaCliente.findFirst({
          where: { tenantId: tenant.id, clienteId: id },
          include: { plano: true },
        }),
    prisma.avaliacao.findMany({
      where: { tenantId: tenant.id, clienteId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalGasto = agendamentos
    .filter((a) => a.status === "ATENDIDO")
    .reduce((acc, a) => acc + Number(a.valorTotal), 0);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <a
          href={`/barbearia/${slug}/clientes`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Voltar
        </a>
        <h1 className="text-2xl font-semibold mt-2">{cliente.nome}</h1>
        <p className="text-neutral-500 text-sm">
          {[cliente.telefone, cliente.email].filter(Boolean).join(" · ") || "Sem contato cadastrado"}
        </p>
      </div>

      {!barbeiroLogado && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-neutral-500">Total gasto</p>
            <p className="text-xl font-bold">R$ {totalGasto.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-neutral-500">Atendimentos</p>
            <p className="text-xl font-bold">
              {agendamentos.filter((a) => a.status === "ATENDIDO").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-neutral-500">Plano</p>
            <p className="text-xl font-bold">{assinatura?.plano.nome ?? "—"}</p>
          </div>
        </div>
      )}

      {cliente.observacoes && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-4 mb-6">
          <strong>Observações:</strong> {cliente.observacoes}
        </div>
      )}

      <div className="bg-white rounded-lg border mb-6">
        <div className="border-b px-4 py-3 font-medium text-sm">Histórico de agendamentos</div>
        <div className="divide-y">
          {agendamentos.map((a) => (
            <div key={a.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {a.dataHoraInicio.toLocaleDateString("pt-BR")} às{" "}
                  {a.dataHoraInicio.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-neutral-500">
                  {a.servicos.map((s) => s.servico.nome).join(", ")} com {a.barbeiro.nome}
                </p>
              </div>
              <span className="text-xs text-neutral-500">{STATUS_LABEL[a.status]}</span>
            </div>
          ))}
          {agendamentos.length === 0 && (
            <p className="p-6 text-center text-neutral-400 text-sm">
              Nenhum agendamento ainda.
            </p>
          )}
        </div>
      </div>

      {!barbeiroLogado && (
        <div className="bg-white rounded-lg border mb-6">
          <div className="border-b px-4 py-3 font-medium text-sm">Compras na loja</div>
          <div className="divide-y">
            {pedidos.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {p.createdAt.toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {p.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", ")}
                  </p>
                </div>
                <span className="text-sm">R$ {Number(p.valorTotal).toFixed(2)}</span>
              </div>
            ))}
            {pedidos.length === 0 && (
              <p className="p-6 text-center text-neutral-400 text-sm">
                Nenhuma compra ainda.
              </p>
            )}
          </div>
        </div>
      )}

      {avaliacoes.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="border-b px-4 py-3 font-medium text-sm">Avaliações dadas</div>
          <div className="divide-y">
            {avaliacoes.map((av) => (
              <div key={av.id} className="p-4">
                <p className="text-sm">
                  {"★".repeat(av.notaExperiencia)}
                  {"☆".repeat(5 - av.notaExperiencia)}
                </p>
                {av.comentario && (
                  <p className="text-xs text-neutral-500 mt-1">{av.comentario}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
