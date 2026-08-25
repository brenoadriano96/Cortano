import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";
import { avaliarAtendimento } from "./actions";
import { AvaliacaoForm } from "./avaliacao-form";
import { notFound } from "next/navigation";

export default async function AvaliarPage({
  params,
}: {
  params: Promise<{ tenant: string; agendamentoId: string }>;
}) {
  const { tenant: slug, agendamentoId } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const agendamento = await prisma.agendamento.findFirst({
    where: { id: agendamentoId, tenantId: tenant.id, clienteId: cliente.id },
    include: { barbeiro: true, servicos: { include: { servico: true } }, avaliacao: true },
  });

  if (!agendamento) {
    notFound();
  }

  if (agendamento.avaliacao) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Avaliação</h1>
        <p className="text-neutral-500">Você já avaliou este atendimento. Obrigado!</p>
      </div>
    );
  }

  const avaliarComContexto = avaliarAtendimento.bind(
    null,
    tenant.id,
    slug,
    cliente.id,
    agendamentoId
  );

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold mb-1">Como foi seu atendimento?</h1>
      <p className="text-neutral-500 mb-6">
        {agendamento.servicos.map((s) => s.servico.nome).join(", ")} com{" "}
        {agendamento.barbeiro.nome}
      </p>
      <AvaliacaoForm avaliarAction={avaliarComContexto} />
    </div>
  );
}
