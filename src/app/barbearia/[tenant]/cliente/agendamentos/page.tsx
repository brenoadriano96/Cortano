import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";
import { cancelarAgendamentoCliente } from "./actions";
import { BotaoCancelar } from "./botao-cancelar";

const STATUS_LABEL: Record<string, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  CANCELADO: "Cancelado",
  FALTOU: "Faltou",
};

export default async function ClienteAgendamentosPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const agendamentos = await prisma.agendamento.findMany({
    where: { tenantId: tenant.id, clienteId: cliente.id },
    include: { barbeiro: true, servicos: { include: { servico: true } } },
    orderBy: { dataHoraInicio: "desc" },
  });

  const cancelarComContexto = cancelarAgendamentoCliente.bind(
    null,
    tenant.id,
    slug,
    cliente.id
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Meus agendamentos</h1>

      <div className="bg-white rounded-lg border divide-y max-w-2xl">
        {agendamentos.map((a) => {
          const podeCancelar = a.status === "AGENDADO" || a.status === "CONFIRMADO";
          return (
            <div key={a.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {a.dataHoraInicio.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  às{" "}
                  {a.dataHoraInicio.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-neutral-500">
                  {a.servicos.map((s) => s.servico.nome).join(", ")} com {a.barbeiro.nome}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">{STATUS_LABEL[a.status]}</span>
                {podeCancelar && (
                  <BotaoCancelar agendamentoId={a.id} cancelarAction={cancelarComContexto} />
                )}
              </div>
            </div>
          );
        })}
        {agendamentos.length === 0 && (
          <p className="p-6 text-center text-neutral-400 text-sm">
            Você ainda não tem agendamentos.
          </p>
        )}
      </div>
    </div>
  );
}
