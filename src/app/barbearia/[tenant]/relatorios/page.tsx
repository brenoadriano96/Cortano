import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { exigirAcessoGestao } from "@/lib/acesso-pagina";
import { calcularComissoesPorBarbeiro } from "@/lib/comissoes";

function primeiroDiaDoMes(ano: number, mes: number) {
  return new Date(ano, mes, 1);
}

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function RelatoriosPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { tenant: slug } = await params;
  await exigirAcessoGestao(slug);
  const tenant = await getTenantBySlug(slug);
  const { mes: mesParam } = await searchParams;

  // mesParam no formato "AAAA-MM" (input type=month); padrão: mês atual
  const agora = new Date();
  const [anoSelecionado, mesSelecionado] = mesParam
    ? mesParam.split("-").map(Number)
    : [agora.getFullYear(), agora.getMonth() + 1];

  const inicio = primeiroDiaDoMes(anoSelecionado, mesSelecionado - 1);
  const fim = primeiroDiaDoMes(anoSelecionado, mesSelecionado);
  const valorInputMes = `${anoSelecionado}-${String(mesSelecionado).padStart(2, "0")}`;

  const [barbeiros, servicos, agendamentosAtendidos, comissoes] = await Promise.all([
    prisma.barbeiro.findMany({ where: { tenantId: tenant.id, ativo: true } }),
    prisma.servico.findMany({ where: { tenantId: tenant.id, ativo: true } }),
    prisma.agendamento.findMany({
      where: {
        tenantId: tenant.id,
        status: "ATENDIDO",
        dataHoraInicio: { gte: inicio, lt: fim },
      },
      include: { servicos: { include: { servico: true } }, avaliacao: true },
    }),
    calcularComissoesPorBarbeiro(tenant.id, inicio, fim),
  ]);

  // Desempenho por barbeiro (seção 7 do documento de arquitetura)
  const desempenhoBarbeiros = barbeiros.map((b) => {
    const atendimentos = agendamentosAtendidos.filter((a) => a.barbeiroId === b.id);
    const faturamento = atendimentos.reduce((acc, a) => acc + Number(a.valorTotal), 0);
    const ticketMedio = atendimentos.length > 0 ? faturamento / atendimentos.length : 0;
    const avaliacoes = atendimentos
      .map((a) => a.avaliacao)
      .filter((av): av is NonNullable<typeof av> => av !== null);
    const notaMedia =
      avaliacoes.length > 0
        ? avaliacoes.reduce((acc, av) => acc + av.notaExperiencia, 0) / avaliacoes.length
        : null;
    const comissaoAPagar = comissoes.find((c) => c.barbeiroId === b.id)?.comissao ?? 0;

    return {
      nome: b.nome,
      atendimentos: atendimentos.length,
      faturamento,
      ticketMedio,
      notaMedia,
      comissaoAPagar,
    };
  });

  // Faturamento por serviço
  const faturamentoPorServico = servicos.map((s) => {
    const itens = agendamentosAtendidos.flatMap((a) =>
      a.servicos.filter((item) => item.servicoId === s.id)
    );
    const faturamento = itens.reduce((acc, item) => acc + Number(item.precoCobrado), 0);
    return { nome: s.nome, quantidade: itens.length, faturamento };
  });

  const faturamentoTotalMes = agendamentosAtendidos.reduce(
    (acc, a) => acc + Number(a.valorTotal),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <form method="get" className="flex items-center gap-2">
          <input
            type="month"
            name="mes"
            defaultValue={valorInputMes}
            className="rounded-md border px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="text-sm bg-neutral-900 text-white px-3 py-1.5 rounded-md"
          >
            Ver mês
          </button>
        </form>
      </div>
      <p className="text-neutral-500 mb-6">
        {NOMES_MES[mesSelecionado - 1]} de {anoSelecionado}
      </p>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <p className="text-sm text-neutral-500">Faturamento total do mês</p>
        <p className="text-2xl font-bold">R$ {faturamentoTotalMes.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border">
          <div className="border-b px-4 py-3 font-medium text-sm">
            Desempenho por barbeiro
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="p-3 font-medium">Barbeiro</th>
                <th className="p-3 font-medium">Atend.</th>
                <th className="p-3 font-medium">Faturado</th>
                <th className="p-3 font-medium">Ticket médio</th>
                <th className="p-3 font-medium">A pagar (comissão)</th>
                <th className="p-3 font-medium">Avaliação</th>
              </tr>
            </thead>
            <tbody>
              {desempenhoBarbeiros.map((b) => (
                <tr key={b.nome} className="border-b last:border-0">
                  <td className="p-3 font-medium">{b.nome}</td>
                  <td className="p-3 text-neutral-600">{b.atendimentos}</td>
                  <td className="p-3 text-neutral-600">R$ {b.faturamento.toFixed(2)}</td>
                  <td className="p-3 text-neutral-600">R$ {b.ticketMedio.toFixed(2)}</td>
                  <td className="p-3 font-medium">R$ {b.comissaoAPagar.toFixed(2)}</td>
                  <td className="p-3 text-neutral-600">
                    {b.notaMedia !== null ? `${b.notaMedia.toFixed(1)} ★` : "—"}
                  </td>
                </tr>
              ))}
              {desempenhoBarbeiros.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-400">
                    Sem dados neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="border-b px-4 py-3 font-medium text-sm">
            Faturamento por serviço
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="p-3 font-medium">Serviço</th>
                <th className="p-3 font-medium">Qtd.</th>
                <th className="p-3 font-medium">Faturado</th>
              </tr>
            </thead>
            <tbody>
              {faturamentoPorServico
                .sort((a, b) => b.faturamento - a.faturamento)
                .map((s) => (
                  <tr key={s.nome} className="border-b last:border-0">
                    <td className="p-3 font-medium">{s.nome}</td>
                    <td className="p-3 text-neutral-600">{s.quantidade}</td>
                    <td className="p-3 text-neutral-600">R$ {s.faturamento.toFixed(2)}</td>
                  </tr>
                ))}
              {faturamentoPorServico.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-neutral-400">
                    Sem dados neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
