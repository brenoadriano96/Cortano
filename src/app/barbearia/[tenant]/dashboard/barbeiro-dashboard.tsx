import { prisma } from "@/lib/prisma";
import { calcularComissoesPorBarbeiro } from "@/lib/comissoes";

function inicioDoDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fimDoDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inicioProximoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function inicioDaSemana() {
  const d = inicioDoDia();
  d.setDate(d.getDate() - d.getDay());
  return d;
}

const STATUS_LABEL: Record<string, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  CANCELADO: "Cancelado",
  FALTOU: "Faltou",
};

/**
 * Dashboard do Barbeiro (seção 4.4): em vez de faturamento bruto do
 * negócio, mostra o que ele efetivamente tem a receber de comissão — e já
 * traz a própria agenda do dia/semana na tela inicial, sem precisar clicar
 * em "Agenda" primeiro.
 */
export async function BarbeiroDashboard({
  tenantId,
  slug,
  barbeiroId,
  barbeiroNome,
}: {
  tenantId: string;
  slug: string;
  barbeiroId: string;
  barbeiroNome: string;
}) {
  const hoje = inicioDoDia();
  const fimHoje = fimDoDia();
  const inicioSemana = inicioDaSemana();
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 7);

  const [comissoesMes, agendamentosHoje, agendamentosSemana] = await Promise.all([
    calcularComissoesPorBarbeiro(tenantId, inicioDoMes(), inicioProximoMes(), barbeiroId),
    prisma.agendamento.findMany({
      where: {
        tenantId,
        barbeiroId,
        dataHoraInicio: { gte: hoje, lte: fimHoje },
      },
      include: { cliente: true, servicos: { include: { servico: true } } },
      orderBy: { dataHoraInicio: "asc" },
    }),
    prisma.agendamento.findMany({
      where: {
        tenantId,
        barbeiroId,
        dataHoraInicio: { gte: inicioSemana, lt: fimSemana },
        status: { in: ["AGENDADO", "CONFIRMADO", "ATENDIDO"] },
      },
      include: { cliente: true, servicos: { include: { servico: true } } },
      orderBy: { dataHoraInicio: "asc" },
    }),
  ]);

  const resumoMes = comissoesMes[0] ?? {
    faturamento: 0,
    comissao: 0,
    atendimentos: 0,
  };

  // Agrupa a semana por dia para exibição compacta
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Olá, {barbeiroNome.split(" ")[0]}!</h1>
      <p className="text-neutral-500 mb-6">Seu resumo do mês</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4 border-neutral-900">
          <p className="text-sm text-neutral-500">Você tem a receber</p>
          <p className="text-2xl font-bold">R$ {resumoMes.comissao.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-neutral-500">Total faturado por você</p>
          <p className="text-2xl font-bold">R$ {resumoMes.faturamento.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-neutral-500">Atendimentos no mês</p>
          <p className="text-2xl font-bold">{resumoMes.atendimentos}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border">
          <div className="border-b px-4 py-3 font-medium text-sm flex items-center justify-between">
            Agenda de hoje
            <a href={`/barbearia/${slug}/agenda`} className="text-xs text-neutral-500 hover:underline">
              Ver completa →
            </a>
          </div>
          <div className="divide-y">
            {agendamentosHoje.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-3">
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
                <span className="text-xs text-neutral-500">{STATUS_LABEL[a.status]}</span>
              </div>
            ))}
            {agendamentosHoje.length === 0 && (
              <p className="p-6 text-center text-neutral-400 text-sm">
                Nenhum atendimento hoje.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="border-b px-4 py-3 font-medium text-sm">Semana</div>
          <div className="divide-y">
            {dias.map((d) => {
              const doDia = agendamentosSemana.filter(
                (a) =>
                  a.dataHoraInicio.toDateString() === d.toDateString()
              );
              return (
                <div key={d.toISOString()} className="p-3">
                  <p className="text-xs font-medium text-neutral-500 mb-1">
                    {d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
                  </p>
                  {doDia.length === 0 ? (
                    <p className="text-xs text-neutral-300">Sem atendimentos</p>
                  ) : (
                    <div className="space-y-1">
                      {doDia.map((a) => (
                        <p key={a.id} className="text-xs text-neutral-600">
                          {a.dataHoraInicio.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          — {a.cliente.nome}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
