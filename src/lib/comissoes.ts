import { prisma } from "@/lib/prisma";

/**
 * Calcula, para um período, quanto cada barbeiro tem a receber de comissão
 * com base nos atendimentos concluídos (status ATENDIDO). A comissão usada
 * é a específica do serviço (ServicoBarbeiro.comissao) quando cadastrada,
 * caindo para a comissão padrão do barbeiro (Barbeiro.comissaoPadrao) caso
 * contrário — seção 15: "comissão".
 */
export async function calcularComissoesPorBarbeiro(
  tenantId: string,
  inicio: Date,
  fim: Date,
  barbeiroIdFiltro?: string
) {
  const agendamentos = await prisma.agendamento.findMany({
    where: {
      tenantId,
      status: "ATENDIDO",
      dataHoraInicio: { gte: inicio, lt: fim },
      ...(barbeiroIdFiltro ? { barbeiroId: barbeiroIdFiltro } : {}),
    },
    include: {
      barbeiro: { include: { servicos: true } },
      servicos: true,
    },
  });

  const porBarbeiro = new Map<
    string,
    { barbeiroId: string; nome: string; faturamento: number; comissao: number; atendimentos: number }
  >();

  for (const a of agendamentos) {
    const atual = porBarbeiro.get(a.barbeiroId) ?? {
      barbeiroId: a.barbeiroId,
      nome: a.barbeiro.nome,
      faturamento: 0,
      comissao: 0,
      atendimentos: 0,
    };

    atual.faturamento += Number(a.valorTotal);
    atual.atendimentos += 1;

    for (const item of a.servicos) {
      const vinculo = a.barbeiro.servicos.find((sb) => sb.servicoId === item.servicoId);
      const percentual = vinculo?.comissao
        ? Number(vinculo.comissao)
        : Number(a.barbeiro.comissaoPadrao);
      atual.comissao += Number(item.precoCobrado) * (percentual / 100);
    }

    porBarbeiro.set(a.barbeiroId, atual);
  }

  return Array.from(porBarbeiro.values());
}
