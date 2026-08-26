import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/auth";
import { getBarbeiroVinculado } from "@/lib/acesso-pagina";
import { temAcessoGestao } from "@/lib/rbac";
import { criarAgendamento, atualizarStatusAgendamento, criarBloqueio, removerBloqueio } from "./actions";
import { NovoAgendamentoForm } from "./novo-agendamento-form";
import { AcoesAgendamento } from "./acoes-agendamento";
import { BloqueioForm } from "./bloqueio-form";

const STATUS_LABEL: Record<string, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  CANCELADO: "Cancelado",
  FALTOU: "Faltou",
};

const STATUS_COR: Record<string, string> = {
  AGENDADO: "bg-blue-100 text-blue-700",
  CONFIRMADO: "bg-amber-100 text-amber-700",
  ATENDIDO: "bg-green-100 text-green-700",
  CANCELADO: "bg-neutral-200 text-neutral-500 line-through",
  FALTOU: "bg-red-100 text-red-700",
};

function formatarDataISO(d: Date) {
  return d.toISOString().split("T")[0];
}

export default async function AgendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ data?: string; unidade?: string }>;
}) {
  const { tenant: slug } = await params;
  const { data: dataParam, unidade: unidadeParam } = await searchParams;
  const tenant = await getTenantBySlug(slug);

  // Seção 4.4: Barbeiro só pode ver a própria agenda, nunca a dos colegas
  const session = await auth();
  const barbeiroLogado =
    session?.user.papel === "BARBEIRO"
      ? await getBarbeiroVinculado(tenant.id, session.user.id)
      : null;

  const dataSelecionada = dataParam ?? formatarDataISO(new Date());
  const inicioDia = new Date(`${dataSelecionada}T00:00:00`);
  const fimDia = new Date(`${dataSelecionada}T23:59:59`);

  const unidades = await prisma.unidade.findMany({
    where: { tenantId: tenant.id, ativo: true },
    select: { id: true, nome: true },
  });

  const [barbeiros, clientes, servicos, agendamentos, bloqueios] = await Promise.all([
    prisma.barbeiro.findMany({
      where: {
        tenantId: tenant.id,
        ativo: true,
        ...(barbeiroLogado ? { id: barbeiroLogado.id } : unidadeParam ? { unidadeId: unidadeParam } : {}),
      },
      orderBy: { nome: "asc" },
    }),
    prisma.cliente.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.servico.findMany({
      where: { tenantId: tenant.id, ativo: true },
      select: { id: true, nome: true, duracaoMin: true, preco: true },
    }),
    prisma.agendamento.findMany({
      where: { tenantId: tenant.id, dataHoraInicio: { gte: inicioDia, lte: fimDia } },
      include: { cliente: true, barbeiro: true, servicos: { include: { servico: true } } },
      orderBy: { dataHoraInicio: "asc" },
    }),
    prisma.bloqueioAgenda.findMany({
      where: { tenantId: tenant.id, inicio: { gte: inicioDia, lte: fimDia } },
      include: { barbeiro: true },
      orderBy: { inicio: "asc" },
    }),
  ]);

  const criarAgendamentoComTenant = criarAgendamento.bind(null, tenant.id, slug);
  const atualizarStatusComTenant = atualizarStatusAgendamento.bind(null, tenant.id, slug);
  const criarBloqueioComTenant = criarBloqueio.bind(null, tenant.id, slug);
  const removerBloqueioComTenant = removerBloqueio.bind(null, tenant.id, slug);
  const podeGerenciar = session ? temAcessoGestao(session.user.papel) : false;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <form method="get" className="flex items-center gap-2">
          {unidades.length > 0 && !barbeiroLogado && (
            <select
              name="unidade"
              defaultValue={unidadeParam ?? ""}
              className="rounded-md border px-3 py-1.5 text-sm"
            >
              <option value="">Todas as unidades</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            name="data"
            defaultValue={dataSelecionada}
            className="rounded-md border px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="text-sm bg-neutral-900 text-white px-3 py-1.5 rounded-md"
          >
            Ver dia
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {barbeiros.map((barbeiro) => {
            const agendamentosDoBarbeiro = agendamentos.filter(
              (a) => a.barbeiroId === barbeiro.id
            );
            return (
              <div key={barbeiro.id} className="bg-white rounded-lg border">
                <div className="border-b px-4 py-3 font-medium text-sm">
                  {barbeiro.nome}
                  <span className="text-neutral-400 font-normal ml-2">
                    {agendamentosDoBarbeiro.length} atendimento(s)
                  </span>
                </div>
                <div className="divide-y">
                  {bloqueios
                    .filter((b) => b.barbeiroId === barbeiro.id)
                    .map((b) => (
                      <div
                        key={b.id}
                        className="p-4 flex items-center justify-between gap-4 bg-neutral-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-500">
                            {b.inicio.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            —{" "}
                            {b.fim.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            · Bloqueado{b.motivo ? ` (${b.motivo})` : ""}
                          </p>
                        </div>
                        {podeGerenciar && (
                          <form
                            action={async () => {
                              "use server";
                              await removerBloqueioComTenant(b.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remover
                            </button>
                          </form>
                        )}
                      </div>
                    ))}
                  {agendamentosDoBarbeiro.map((a) => (
                    <div key={a.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          {a.dataHoraInicio.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          — {a.cliente.nome}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {a.servicos.map((s) => s.servico.nome).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${STATUS_COR[a.status]}`}
                        >
                          {STATUS_LABEL[a.status]}
                        </span>
                        <AcoesAgendamento
                          agendamentoId={a.id}
                          statusAtual={a.status}
                          atualizarStatusAction={atualizarStatusComTenant}
                        />
                      </div>
                    </div>
                  ))}
                  {agendamentosDoBarbeiro.length === 0 && (
                    <p className="p-4 text-sm text-neutral-400">Nenhum atendimento neste dia.</p>
                  )}
                </div>
              </div>
            );
          })}
          {barbeiros.length === 0 && (
            <div className="bg-white rounded-lg border p-6 text-center text-neutral-400">
              Cadastre barbeiros para começar a usar a agenda.
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!barbeiroLogado && (
            <NovoAgendamentoForm
              criarAgendamentoAction={criarAgendamentoComTenant}
              clientes={clientes}
              barbeiros={barbeiros}
              servicos={servicos.map((s) => ({ ...s, preco: Number(s.preco) }))}
              dataSelecionada={dataSelecionada}
            />
          )}
          {podeGerenciar && (
            <BloqueioForm
              criarBloqueioAction={criarBloqueioComTenant}
              barbeiros={barbeiros}
              dataSelecionada={dataSelecionada}
            />
          )}
        </div>
      </div>
    </div>
  );
}
