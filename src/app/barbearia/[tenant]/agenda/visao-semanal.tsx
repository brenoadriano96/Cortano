import { prisma } from "@/lib/prisma";

function inicioDaSemana(dataISO: string) {
  const d = new Date(`${dataISO}T00:00:00`);
  const diaSemana = d.getDay();
  d.setDate(d.getDate() - diaSemana);
  return d;
}

export async function VisaoSemanal({
  tenantId,
  slug,
  dataSelecionada,
  barbeiroLogadoId,
  unidadeParam,
}: {
  tenantId: string;
  slug: string;
  dataSelecionada: string;
  barbeiroLogadoId?: string;
  unidadeParam?: string;
}) {
  const inicioSemana = inicioDaSemana(dataSelecionada);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 7);

  const [barbeiros, agendamentos] = await Promise.all([
    prisma.barbeiro.findMany({
      where: {
        tenantId,
        ativo: true,
        ...(barbeiroLogadoId ? { id: barbeiroLogadoId } : unidadeParam ? { unidadeId: unidadeParam } : {}),
      },
      orderBy: { nome: "asc" },
    }),
    prisma.agendamento.findMany({
      where: {
        tenantId,
        dataHoraInicio: { gte: inicioSemana, lt: fimSemana },
        status: { in: ["AGENDADO", "CONFIRMADO", "ATENDIDO"] },
      },
      select: { barbeiroId: true, dataHoraInicio: true },
    }),
  ]);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    return d;
  });

  const dataSelecionadaAnterior = new Date(inicioSemana);
  dataSelecionadaAnterior.setDate(dataSelecionadaAnterior.getDate() - 7);
  const dataSelecionadaProxima = new Date(inicioSemana);
  dataSelecionadaProxima.setDate(dataSelecionadaProxima.getDate() + 7);

  function formatarISO(d: Date) {
    return d.toISOString().split("T")[0];
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Agenda — Semana</h1>
        <div className="flex items-center gap-2">
          <a
            href={`?data=${formatarISO(dataSelecionadaAnterior)}&modo=semana`}
            className="text-sm px-3 py-1.5 rounded-md border"
          >
            ← Semana anterior
          </a>
          <a
            href={`?data=${dataSelecionada}`}
            className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          >
            Ver dia
          </a>
          <a
            href={`?data=${formatarISO(dataSelecionadaProxima)}&modo=semana`}
            className="text-sm px-3 py-1.5 rounded-md border"
          >
            Próxima semana →
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="p-3 font-medium">Barbeiro</th>
              {dias.map((d) => (
                <th key={d.toISOString()} className="p-3 font-medium text-center">
                  {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                  <br />
                  <span className="font-normal text-xs">
                    {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {barbeiros.map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{b.nome}</td>
                {dias.map((d) => {
                  const inicioDia = new Date(d);
                  const fimDia = new Date(d);
                  fimDia.setDate(fimDia.getDate() + 1);
                  const qtd = agendamentos.filter(
                    (a) =>
                      a.barbeiroId === b.id &&
                      a.dataHoraInicio >= inicioDia &&
                      a.dataHoraInicio < fimDia
                  ).length;
                  return (
                    <td key={d.toISOString()} className="p-3 text-center">
                      {qtd > 0 ? (
                        <a
                          href={`?data=${formatarISO(d)}`}
                          className="inline-block bg-neutral-900 text-white rounded-full w-7 h-7 leading-7 text-xs hover:bg-neutral-700"
                        >
                          {qtd}
                        </a>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {barbeiros.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-neutral-400">
                  Cadastre barbeiros para começar a usar a agenda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400 mt-3">
        Clique no número para ver os detalhes daquele dia.
      </p>
    </div>
  );
}
