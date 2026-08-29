import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getClienteAtual } from "@/lib/cliente-atual";

export default async function ClienteInicioPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const cliente = await getClienteAtual(tenant.id);

  const [proximoAgendamento, assinatura, pedidosRecentes] = await Promise.all([
    prisma.agendamento.findFirst({
      where: {
        tenantId: tenant.id,
        clienteId: cliente.id,
        status: { in: ["AGENDADO", "CONFIRMADO"] },
        dataHoraInicio: { gte: new Date() },
      },
      include: { barbeiro: true, servicos: { include: { servico: true } } },
      orderBy: { dataHoraInicio: "asc" },
    }),
    prisma.assinaturaCliente.findFirst({
      where: { tenantId: tenant.id, clienteId: cliente.id, status: "ATIVA" },
      include: { plano: { include: { servicosInclusos: { include: { servico: true } } } } },
    }),
    prisma.pedido.findMany({
      where: { tenantId: tenant.id, clienteId: cliente.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-1">Olá, {cliente.nome.split(" ")[0]}!</h1>
      <p className="text-neutral-500 mb-6">{tenant.nome}</p>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <p className="text-sm text-neutral-500 mb-1">Próximo agendamento</p>
        {proximoAgendamento ? (
          <div>
            <p className="font-medium">
              {proximoAgendamento.dataHoraInicio.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
              })}{" "}
              —{" "}
              {proximoAgendamento.dataHoraInicio.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm text-neutral-500">
              {proximoAgendamento.servicos.map((s) => s.servico.nome).join(", ")} com{" "}
              {proximoAgendamento.barbeiro.nome}
            </p>
          </div>
        ) : (
          <p className="text-neutral-400 text-sm">Nenhum agendamento marcado.</p>
        )}
      </div>

      {assinatura && (
        <div className="bg-white rounded-lg border p-4 mb-4">
          <p className="text-sm text-neutral-500 mb-1">Meu plano</p>
          <p className="font-medium">{assinatura.plano.nome}</p>
          <p className="text-sm text-neutral-500">
            {assinatura.plano.servicosInclusos.map((si) => si.servico.nome).join(", ")}
          </p>
        </div>
      )}

      {pedidosRecentes.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-500">Meus pedidos</p>
            <a
              href={`/barbearia/${slug}/cliente/pedidos`}
              className="text-xs text-neutral-500 hover:underline"
            >
              Ver todos →
            </a>
          </div>
          <div className="space-y-2">
            {pedidosRecentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  {p.createdAt.toLocaleDateString("pt-BR")}
                </span>
                <span className="text-xs text-neutral-400">{p.status}</span>
                <span className="font-medium">R$ {Number(p.valorTotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <a
        href={`/barbearia/${slug}/cliente/agendar`}
        className="block text-center mt-6 text-white rounded-md py-2.5 text-sm font-medium"
        style={{ backgroundColor: "var(--cor-primaria)" }}
      >
        Agendar horário
      </a>
    </div>
  );
}
